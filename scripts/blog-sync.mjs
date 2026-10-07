// 블로그(daily.mcp) ↔ 문제 은행 동기화 도구. 의존성 없음(Node 18+ fetch).
//
//   --check   prebuild 게이트: RSS로 relatedPost 실존 검증(없는 글 참조 → 빌드 실패),
//             post-titles.json 자동 생성. 네트워크 실패 시 경고만 하고 통과(오프라인 빌드 보호).
//   --report  주간 CI: 블로그 레포 트리(blob sha)와 sync-state.json을 비교해 "그 주에 생긴 일"만
//             — 죽은 링크·개정된 글·새로 생긴 커버리지 갭 — 마크다운으로 출력하고 상태를 갱신한다.
//             보고한 것은 상태에 남으므로 같은 변경을 다음 주에 또 보고하지 않는다.
//   --backlog 아직 메워지지 않은 자리 전량(커버리지 갭·글 연결 갭). 주간 이슈를 새로 여는 대신
//             상시 이슈 하나의 본문을 덮어쓰는 용도라, 갱신된 상태 위에서 돌도록 --report 뒤에 온다.
//             네트워크를 쓰지 않는다 — sync-state.json이 이미 아는 것만 읽는다.
//   --link    글을 주제에 붙인다. 셋 중 하나로 갈린다 — ① 번역표(blog-seeds.json)가 그 글의
//             시드를 가리키면 임계 없이 결정적으로 붙이고 ② 없으면 제목 유사도로 또렷한 자리만
//             붙이고 ③ 그래도 애매하면 후보 목록으로 남긴다. 붙인 것은 전부 "검증 필요"로
//             보고된다 — 조용히 들어가는 연결을 만들지 않는 것이 이 모드의 조건이다.
//             섹션을 상태에서 읽으므로 --report 뒤에 온다. --dry-run을 주면 파일을 쓰지 않는다.
//   --backtest 손으로 이어 둔 연결을 정답으로 두고 같은 계산을 되본다. 임계 위에서 오답이 하나라도
//             나오면 실패로 끝낸다 — 자동 연결의 안전선은 이 역채점으로만 지킨다. 네트워크를 쓰지 않는다.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS = join(root, "src/data/questions.json");
const TITLES = join(root, "src/data/post-titles.json");
const TOPIC_NOTES = join(root, "src/data/topic-notes.json");
const STATE = join(root, "src/data/sync-state.json");
const SEEDS = join(root, "src/data/blog-seeds.json");

// 커버리지 갭을 따질 글의 섹션 — 두 시험 글만 본다(MCP·개발기 글은 붙을 주제 축이 없다).
// 판정이 --report와 --backlog 두 곳에 있어, 한쪽만 늘리면 주간 보고와 상시 이슈가 어긋난다.
const EXAM_SECTIONS = new Set(["jeongcheogi", "boangisa"]);

// 자동 연결의 기준선. 제목끼리 문자 바이그램 Dice 계수로 재고, 이 선을 넘는 자리만 기계가 붙인다.
// 형태소 분석기 없이 한글 제목에 쓸 수 있어 의존성이 늘지 않는다.
//
// 선은 손으로 이어 둔 42편을 역채점해 정했다(--backtest가 같은 계산을 다시 돈다). 오답 4편
// (SQL 인젝션 · XSS와 CSRF · RSA/DH · 위험 관리)이 전부 0.276 이하에 몰려, 0.45면 0.174 여유가 남는다.
// 격차 조건은 제목이 똑같은 자리를 자동에서 빼기 위한 것이다 — 두 시험의 쌍둥이 주제가 그렇고,
// 그건 "둘 다 붙일까"를 사람이 정할 일이다.
//
// 값 자체는 src/lib/auto-link.mjs가 갖는다 — 소개 페이지가 같은 값을 읽어 설명하므로,
// 여기 적어 두면 한쪽만 고쳐져 화면이 조용히 거짓말을 한다.
import { AUTO_SCORE, AUTO_MARGIN, CANDIDATES } from "../src/lib/auto-link.mjs";

const RSS_URL = "https://mmyonaa.github.io/blog/rss.xml";
const TREE_URL = "https://api.github.com/repos/mmyonaa/blog/git/trees/main?recursive=1";
const RAW_BASE = "https://raw.githubusercontent.com/mmyonaa/blog/main/site/src/content/blog/";
const POST_DIR = "site/src/content/blog/";

const unescapeXml = (s) =>
  s
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

/** RSS → Map<글 id, 제목>. 링크의 마지막 경로 조각이 글 id(불변 슬러그)다. */
const fetchPosts = async () => {
  const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();
  const posts = new Map();
  for (const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = item[1].match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = item[1].match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const id = link?.replace(/\/$/, "").split("/").pop();
    if (id && title) posts.set(id, unescapeXml(title.trim()));
  }
  if (posts.size === 0) throw new Error("RSS에서 글을 찾지 못함");
  return posts;
};

/** 글 id → 그 글에 연결된 문항 수. 연결은 주제(topic-notes.json)가 갖는다. */
const questionRefs = () => {
  const bank = JSON.parse(readFileSync(QUESTIONS, "utf8"));
  const topics = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  const refs = new Map();
  for (const q of bank) {
    const post = topics[q.topic]?.post;
    if (post) refs.set(post, (refs.get(post) ?? 0) + 1);
  }
  return refs;
};

/** 제목을 비교용으로 눌러 둔 문자 바이그램. 공백·기호·대소문자는 제목마다 달라 축에서 뺀다. */
const bigrams = (s) => {
  const t = s.toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
  if (t.length < 2) return t ? [t] : [];
  return Array.from({ length: t.length - 1 }, (_, i) => t.slice(i, i + 2));
};

/** 두 제목의 Dice 계수(0~1). 다중집합 교집합이라 같은 바이그램이 두 번 나오는 것도 센다. */
const similarity = (a, b) => {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const left = new Map();
  for (const g of A) left.set(g, (left.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of B) {
    const n = left.get(g);
    if (n) {
      inter++;
      left.set(g, n - 1);
    }
  }
  return (2 * inter) / (A.length + B.length);
};

/**
 * 글 제목에 대한 주제 순위(점수 내림차순).
 * 기본적으로 글이 아직 없는 주제만 자리로 본다 — 주제당 글은 하나이고, 이미 찬 자리를 추천하면
 * 사람이 기존 연결을 걷어내야 한다. all을 주면 채점용으로 전부 본다(--backtest).
 */
const rankTopics = (title, topics, { taken = new Set(), all = false } = {}) =>
  Object.entries(topics)
    .filter(([key, t]) => all || (!t.post && !taken.has(key)))
    .map(([key, t]) => ({ key, title: t.title, score: similarity(title, t.title) }))
    .sort((a, b) => b.score - a.score);

// ── --check: 빌드 게이트 + 제목 자동화 ──
const check = async () => {
  let posts;
  try {
    posts = await fetchPosts();
  } catch (e) {
    console.warn(`[blog-sync] RSS를 가져오지 못했습니다(${e.message}) — 링크 검증을 건너뜁니다.`);
    return;
  }
  const missing = [...questionRefs().keys()].filter((id) => !posts.has(id));
  if (missing.length) {
    console.error("[blog-sync] 존재하지 않는 블로그 글을 참조하는 relatedPost:");
    for (const id of missing) console.error(`  - ${id}`);
    process.exit(1);
  }
  writeFileSync(
    TITLES,
    JSON.stringify(Object.fromEntries([...posts].sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n",
  );
  console.log(`[blog-sync] 글 ${posts.size}건 확인, relatedPost 검증 통과, post-titles.json 갱신.`);
};

// ── --report: 주간 싱크 리포트 ──
const ghHeaders = () => {
  const h = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
};

/** 레포 트리에서 글 id → blob sha. sha가 바뀌면 내용이 바뀐 것이다. */
const fetchTree = async () => {
  const res = await fetch(TREE_URL, { headers: ghHeaders(), signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`tree API ${res.status}`);
  const { tree } = await res.json();
  const shas = new Map();
  for (const e of tree) {
    if (e.type === "blob" && e.path.startsWith(POST_DIR) && e.path.endsWith(".md")) {
      shas.set(e.path.slice(POST_DIR.length, -3), e.sha);
    }
  }
  return shas;
};

// 섹션은 글을 처음 본 주에 한 번만 읽어 캐시한다. 그래서 여기서 실패를 삼키고 null을 남기면
// 그 글은 영영 시험 글로 잡히지 않는다 — 네트워크 문제는 상태를 조용히 오염시키는 대신
// 실행을 세운다(fetchTree와 같은 규약). 상태를 쓰기 전에 던지므로 다음 주가 다시 시도한다.
const fetchFrontmatter = async (id, field) => {
  const res = await fetch(`${RAW_BASE}${id}.md`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`raw ${id}.md ${res.status}`);
  const head = (await res.text()).slice(0, 2000);
  return head.match(new RegExp(`^${field}:\\s*"?([a-zA-Z0-9_-]+)"?\\s*$`, "m"))?.[1] ?? null;
};

const fetchSection = (id) => fetchFrontmatter(id, "section");

/**
 * 시드 id → 주제 키 목록. 번역표는 글이 아니라 **시드**를 가리킨다 — 블로그는 시드를 1:1로
 * 소비하므로(시드 하나가 글 한 편) 시드를 미리 매핑해 두면 그 글이 올라오는 날 추측이 필요 없다.
 */
const seedMap = () =>
  new Map(
    Object.entries(JSON.parse(readFileSync(SEEDS, "utf8"))).map(([seed, v]) => [
      seed,
      Array.isArray(v) ? v : [v],
    ]),
  );

const report = async () => {
  const shas = await fetchTree();
  const refs = questionRefs();
  let state = { posts: {} };
  try {
    state = JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    /* 최초 실행 — 아래에서 초기화 */
  }
  const firstRun = Object.keys(state.posts).length === 0;

  // 신규 글은 섹션을 raw frontmatter에서 읽어 캐시(시험 글 판별용)
  for (const [id, sha] of shas) {
    if (!state.posts[id]) state.posts[id] = { sha, section: await fetchSection(id) };
  }

  const dead = [...refs.keys()].filter((id) => !shas.has(id));
  const revised = [...refs.keys()].filter(
    (id) => shas.has(id) && state.posts[id] && state.posts[id].sha !== shas.get(id),
  );
  // 커버리지 갭은 문항을 쓸 때까지 남는 백로그다(전량은 --backlog가 맡는다).
  // 주간 이슈에는 이번 주에 새로 생긴 것만 싣는다 — 같은 글을 3주 연속 싣던 것이 이슈를 잡음으로 만들었다.
  const gaps = [...shas.keys()].filter(
    (id) => EXAM_SECTIONS.has(state.posts[id]?.section) && !refs.has(id),
  );
  const newGaps = gaps.filter((id) => !state.posts[id].gapReported);

  const lines = [];
  if (dead.length) {
    lines.push("## 죽은 링크 — 블로그에 없는 글을 참조하는 relatedPost", "");
    for (const id of dead) lines.push(`- \`${id}\` (문항 ${refs.get(id)}개) — 글 복구 또는 relatedPost 제거 필요`);
    lines.push("");
  }
  if (revised.length) {
    lines.push("## 재검토 필요 — 문항이 참조하는 글이 개정됨", "");
    for (const id of revised) lines.push(`- \`${id}\` (문항 ${refs.get(id)}개) — 문항·해설이 글과 어긋나지 않는지 확인`);
    lines.push("");
  }
  if (newGaps.length) {
    lines.push("## 새 커버리지 갭 — 시험 글이 올라왔는데 문항이 없음 (문항 제작 후보)", "");
    for (const id of newGaps) lines.push(`- \`${id}\``);
    lines.push("");
  }
  // 보고했으니 상태를 현재로 갱신 — 같은 개정·같은 갭을 다음 주에 또 보고하지 않는다
  for (const [id, sha] of shas) {
    const post = state.posts[id];
    if (!post) continue;
    post.sha = sha;
    // 표시는 갭인 동안만 유지한다. 문항이 생겨 지워졌다가 다시 갭이 되면 새 갭으로 본다.
    if (gaps.includes(id)) post.gapReported = true;
    else delete post.gapReported;
  }
  for (const id of Object.keys(state.posts)) if (!shas.has(id)) delete state.posts[id];
  writeFileSync(
    STATE,
    JSON.stringify({ posts: Object.fromEntries(Object.entries(state.posts).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + "\n",
  );

  if (firstRun) {
    console.log("NO_FINDINGS");
    console.error(`[blog-sync] 최초 실행 — 글 ${shas.size}건의 상태를 초기화했습니다. 다음 실행부터 변경을 보고합니다.`);
    return;
  }
  if (lines.length === 0) {
    console.log("NO_FINDINGS");
    return;
  }
  console.log(lines.join("\n").trim());
};

// ── --link: 번역표가 아는 자리는 결정적으로, 또렷한 자리는 유사도로, 나머지는 후보로 ──
// 사람과 기계의 분업이 이 모드의 전부다. 기계는 번역표가 가리키는 자리와 제목이 또렷하게 겹치는
// 자리를 붙이고, 사람은 ① 붙은 것을 검증하고 ② 남은 후보에서 고른다. 그래서 붙인 것을 반드시
// 보고한다 — 보고되지 않는 자동 연결은 틀려도 아무도 모른다(--check는 글의 실존만 본다).
const link = async ({ dry }) => {
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const topics = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  const seeds = seedMap();
  // 제목은 RSS에서 바로 받는다. post-titles.json은 배포가 돌아야 갱신돼 갓 올라온 글이 빠지는데,
  // 자동 연결이 가장 필요한 것이 바로 그 글이다.
  const posts = await fetchPosts();
  const linked = new Set(
    Object.values(topics)
      .map((t) => t.post)
      .filter(Boolean),
  );
  const targets = [...posts.keys()].filter(
    (id) => EXAM_SECTIONS.has(state.posts[id]?.section) && !linked.has(id),
  );

  // 시드는 대상 글의 프론트매터에서만 읽는다. 주마다 몇 편이라 상태에 캐시할 이유가 없고,
  // 캐시하면 이미 쌓인 글 전부를 소급해 채우는 일이 따라온다.
  const seedOf = new Map();
  for (const id of targets) seedOf.set(id, await fetchFrontmatter(id, "topicId"));

  const made = [];       // 붙인 것 — 번역표 또는 유사도
  const occupied = [];   // 번역표가 가리키는 주제에 이미 글이 있다 — 사람이 정할 일
  const newSeeds = [];   // 번역표에 없는 시드 — 블로그 시드 풀이 늘었다는 신호
  const taken = new Set();

  // ① 번역표. 임계를 보지 않는다 — 사람이 한 번 판단해 박아 둔 매핑이 유사도보다 세다.
  const bySeed = [];
  for (const id of targets) {
    const seed = seedOf.get(id);
    const keys = seed ? seeds.get(seed) : undefined;
    if (!keys) {
      if (seed) newSeeds.push({ id, seed });
      bySeed.push(id); // 시드 밖 글(리서치)과 미매핑 시드는 유사도로 내려간다
      continue;
    }
    const free = keys.filter((k) => topics[k] && !topics[k].post && !taken.has(k));
    if (free.length === 0) {
      occupied.push({ id, seed, keys: keys.map((k) => ({ key: k, post: topics[k]?.post })) });
      continue;
    }
    for (const key of free) {
      taken.add(key);
      made.push({ id, key, title: topics[key].title, how: "번역표", seed });
    }
  }

  // ② 유사도. 점수가 높은 글부터 자리를 집는다 — 같은 주제를 여럿이 노리면 더 또렷한 글이 갖고
  // 나머지는 후보로 남는다. 자동이 엉뚱한 글로 자리를 먼저 막는 것이 사람 손으로만 되돌려지는 실패다.
  const leftover = [];
  const order = bySeed
    .map((id) => ({ id, title: posts.get(id), top: rankTopics(posts.get(id), topics, { taken })[0]?.score ?? 0 }))
    .sort((a, b) => b.top - a.top);
  for (const { id, title } of order) {
    const list = rankTopics(title, topics, { taken });
    const [first, second] = list;
    if (first && first.score >= AUTO_SCORE && first.score - (second?.score ?? 0) >= AUTO_MARGIN) {
      taken.add(first.key);
      made.push({ id, key: first.key, title: first.title, how: `유사도 ${first.score.toFixed(2)}` });
    } else {
      leftover.push({ id, title, list: list.slice(0, CANDIDATES) });
    }
  }

  if (made.length && !dry) {
    for (const m of made) {
      // 키 순서를 지켜 넣는다 — title 바로 뒤가 post 자리다. 손으로 쓴 것과 같은 모양으로 남는다.
      const t = topics[m.key];
      const rebuilt = {};
      for (const [k, v] of Object.entries(t)) {
        rebuilt[k] = v;
        if (k === "title") rebuilt.post = m.id;
      }
      if (!rebuilt.post) rebuilt.post = m.id;
      topics[m.key] = rebuilt;
    }
    writeFileSync(TOPIC_NOTES, `${JSON.stringify(topics, null, 2)}\n`);
  }

  if (made.length === 0 && leftover.length === 0 && occupied.length === 0 && newSeeds.length === 0) {
    console.log("NO_FINDINGS");
    return;
  }

  const lines = [];
  if (made.length) {
    lines.push(
      `## 자동 연결 — 검증 필요 (${made.length}건)`,
      "",
      "번역표가 가리킨 자리이거나, 제목 유사도가 임계(" +
        `${AUTO_SCORE} · 격차 ${AUTO_MARGIN})를 넘은 자리다. 글이 그 주제의 개념 노트로 맞는지 확인하고,` ,
      "아니면 `topic-notes.json`에서 고친다(자동분은 커밋 하나로 들어가므로 통째로 되돌리기도 쉽다).",
      "",
    );
    for (const m of made) lines.push(`- \`${m.id}\` → \`${m.key}\` (${m.how}) — ${m.title}`);
    lines.push("");
  }
  if (occupied.length) {
    lines.push(
      `## 자리가 찬 주제 — 어느 글을 둘지 정할 것 (${occupied.length}건)`,
      "",
      "번역표가 가리키는 주제에 이미 다른 글이 붙어 있다. 주제당 글은 하나이므로 둘 중 하나를 고르거나,",
      "주제를 쪼개거나, 번역표의 매핑을 옮긴다.",
      "",
    );
    for (const o of occupied) {
      const now = o.keys.map((k) => `\`${k.key}\`←\`${k.post ?? "?"}\``).join(" · ");
      lines.push(`- \`${o.id}\` (시드 \`${o.seed}\`) — 지금: ${now}`);
    }
    lines.push("");
  }
  if (leftover.length) {
    lines.push(
      `## 연결 후보 — 사람이 고를 자리 (${leftover.length}건)`,
      "",
      "번역표에 없고 제목도 또렷하지 않다. 맞는 주제가 있으면 `post`를 넣고, 없으면 그대로 둔다",
      "(주제가 아직 없는 글은 글감이 아니라 주제를 새로 낼 후보다).",
      "",
    );
    for (const l of leftover) {
      const cand = l.list.map((c) => `\`${c.key}\`(${c.score.toFixed(2)})`).join(" · ") || "후보 없음";
      lines.push(`- \`${l.id}\` — ${l.title}`, `  - 후보: ${cand}`);
    }
    lines.push("");
  }
  if (newSeeds.length) {
    lines.push(
      `## 번역표에 없는 시드 (${newSeeds.length}건)`,
      "",
      "블로그 시드 풀이 늘었다는 신호다. `src/data/blog-seeds.json`에 미리 매핑해 두면 그 시드에서",
      "나오는 글은 유사도를 거치지 않고 결정적으로 붙는다.",
      "",
    );
    for (const n of newSeeds) lines.push(`- 시드 \`${n.seed}\` (글 \`${n.id}\`)`);
    lines.push("");
  }
  console.log(lines.join("\n").trim());
  if (dry) console.error("[blog-sync] --dry-run — topic-notes.json을 쓰지 않았습니다.");
};

// ── --backtest: 임계값이 아직 유효한지 지금 데이터로 되본다 ──
// 손으로 이어 둔 연결을 정답으로 보고, 제목만으로 같은 답이 나오는지 센다. 주제·글이 늘면 선이
// 흔들릴 수 있어, 주간 워크플로가 자동 연결 전에 이걸 먼저 돌려 오답이 생기면 멈춘다.
const backtest = () => {
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const topics = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  const titles = JSON.parse(readFileSync(TITLES, "utf8"));

  // 한 글이 두 시험의 주제에 함께 걸릴 수 있다(쌍둥이). 그 글의 정답은 양쪽 모두다.
  const answer = new Map();
  for (const [key, t] of Object.entries(topics)) {
    if (!t.post) continue;
    if (!answer.has(t.post)) answer.set(t.post, new Set());
    answer.get(t.post).add(key);
  }

  const rows = [];
  for (const [post, keys] of answer) {
    const title = titles[post];
    // 섹션을 모르는 글(상태가 아직 못 본 신규)과 제목이 없는 글은 채점에서 뺀다.
    if (!title || !EXAM_SECTIONS.has(state.posts[post]?.section)) continue;
    const [first, second] = rankTopics(title, topics, { all: true });
    rows.push({
      post,
      score: first.score,
      margin: first.score - second.score,
      pick: first.key,
      ok: keys.has(first.key),
    });
  }
  rows.sort((a, b) => b.score - a.score);

  const auto = rows.filter((r) => r.score >= AUTO_SCORE && r.margin >= AUTO_MARGIN);
  const wrong = auto.filter((r) => !r.ok);
  const nearest = Math.max(...rows.filter((r) => !r.ok).map((r) => r.score), 0);
  console.log(`표본 ${rows.length}편(손으로 이은 시험 글) · 임계 ${AUTO_SCORE}/격차 ${AUTO_MARGIN}`);
  console.log(`  자동 연결 대상 ${auto.length}편 · 그 중 오답 ${wrong.length}편`);
  console.log(`  1위가 틀린 글 중 최고점 ${nearest.toFixed(2)} — 임계까지 여유 ${(AUTO_SCORE - nearest).toFixed(2)}`);
  for (const r of wrong) {
    console.error(`  오답: ${r.post} → ${r.pick} (${r.score.toFixed(2)}, 격차 ${r.margin.toFixed(2)})`);
  }
  if (wrong.length) {
    console.error("[blog-sync] 임계 위에서 오답이 나왔습니다 — AUTO_SCORE/AUTO_MARGIN을 다시 재기 전에는 자동 연결을 돌리지 마십시오.");
    process.exit(1);
  }
};

// ── --backlog: 아직 메워지지 않은 자리 전량(상시 이슈 본문) ──
const backlog = () => {
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const refs = questionRefs();
  const topics = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  const bank = JSON.parse(readFileSync(QUESTIONS, "utf8"));

  // 글 목록은 --report가 갱신해 둔 상태에서 온다(네트워크를 다시 치지 않는다).
  const gaps = Object.entries(state.posts)
    .filter(([id, p]) => EXAM_SECTIONS.has(p.section) && !refs.has(id))
    .map(([id]) => id);
  // 글 연결 갭 — 도입부만 있고 아직 개념 글이 없는 주제(글감 후보).
  // 도입부 자체의 누락은 스키마(z.enum)와 topic-notes.json 구조가 이미 막는다.
  const noPost = Object.entries(topics)
    .filter(([, t]) => !t.post)
    .map(([key, t]) => [key, t, bank.filter((q) => q.topic === key).length]);

  if (gaps.length === 0 && noPost.length === 0) {
    console.log("NO_FINDINGS");
    return;
  }

  // en-CA는 YYYY-MM-DD로 찍힌다. 이 워크플로는 KST 월요일 아침에 도니 날짜도 KST로 적는다.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const lines = [
    "<!-- 이 본문은 sync-report.yml이 매주 통째로 덮어쓴다 — 직접 편집해도 다음 실행에 지워진다. -->",
    `블로그와 문항 은행 사이에 아직 메워지지 않은 자리다. 해소될 때까지 남고, 주간 실행마다`,
    `현재 상태로 갱신된다. 마지막 갱신: ${today}.`,
    "",
  ];
  if (gaps.length) {
    lines.push("## 커버리지 갭 — 시험 글인데 문항이 없음 (문항 제작 후보)", "");
    for (const id of gaps) lines.push(`- \`${id}\``);
    lines.push("");
  }
  if (noPost.length) {
    lines.push("## 글 연결 갭 — 개념 글이 아직 없는 주제 (블로그 글감 후보)", "");
    for (const [key, t, n] of noPost) lines.push(`- \`${key}\` — ${t.title} (${t.area}, 문항 ${n}개)`);
    lines.push("");
  }
  console.log(lines.join("\n").trim());
};

const mode = process.argv[2];
if (mode === "--check") await check();
else if (mode === "--report") await report();
else if (mode === "--backlog") backlog();
else if (mode === "--link") await link({ dry: process.argv.includes("--dry-run") });
else if (mode === "--backtest") backtest();
else {
  console.error(
    "사용법: node scripts/blog-sync.mjs --check | --report | --link [--dry-run] | --backtest | --backlog",
  );
  process.exit(1);
}
