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
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS = join(root, "src/data/questions.json");
const TITLES = join(root, "src/data/post-titles.json");
const TOPIC_NOTES = join(root, "src/data/topic-notes.json");
const STATE = join(root, "src/data/sync-state.json");

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
// 그 글은 영영 정처기 글로 잡히지 않는다 — 네트워크 문제는 상태를 조용히 오염시키는 대신
// 실행을 세운다(fetchTree와 같은 규약). 상태를 쓰기 전에 던지므로 다음 주가 다시 시도한다.
const fetchSection = async (id) => {
  const res = await fetch(`${RAW_BASE}${id}.md`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`raw ${id}.md ${res.status}`);
  const head = (await res.text()).slice(0, 2000);
  return head.match(/^section:\s*"?([a-zA-Z0-9_-]+)"?\s*$/m)?.[1] ?? null;
};

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

  // 신규 글은 섹션을 raw frontmatter에서 읽어 캐시(정처기 글 판별용)
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
    (id) => state.posts[id]?.section === "jeongcheogi" && !refs.has(id),
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
    lines.push("## 새 커버리지 갭 — 정처기 글이 올라왔는데 문항이 없음 (문항 제작 후보)", "");
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

// ── --backlog: 아직 메워지지 않은 자리 전량(상시 이슈 본문) ──
const backlog = () => {
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const refs = questionRefs();
  const topics = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  const bank = JSON.parse(readFileSync(QUESTIONS, "utf8"));

  // 글 목록은 --report가 갱신해 둔 상태에서 온다(네트워크를 다시 치지 않는다).
  const gaps = Object.entries(state.posts)
    .filter(([id, p]) => p.section === "jeongcheogi" && !refs.has(id))
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
    lines.push("## 커버리지 갭 — 정처기 글인데 문항이 없음 (문항 제작 후보)", "");
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
else {
  console.error("사용법: node scripts/blog-sync.mjs --check | --report | --backlog");
  process.exit(1);
}
