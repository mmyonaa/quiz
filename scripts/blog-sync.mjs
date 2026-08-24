// 블로그(daily.mcp) ↔ 문제 은행 동기화 도구. 의존성 없음(Node 18+ fetch).
//
//   --check   prebuild 게이트: RSS로 relatedPost 실존 검증(없는 글 참조 → 빌드 실패),
//             post-titles.json 자동 생성. 네트워크 실패 시 경고만 하고 통과(오프라인 빌드 보호).
//   --report  주간 CI: 블로그 레포 트리(blob sha)와 sync-state.json을 비교해
//             죽은 링크·개정된 글(재검토 필요)·커버리지 갭(정처기 글인데 문항 없음)을
//             마크다운으로 출력하고 상태를 갱신한다. 같은 변경은 한 번만 보고된다.
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

const questionRefs = () => {
  const bank = JSON.parse(readFileSync(QUESTIONS, "utf8"));
  const refs = new Map(); // 글 id → 참조하는 문항 수
  for (const q of bank) {
    if (q.relatedPost) refs.set(q.relatedPost, (refs.get(q.relatedPost) ?? 0) + 1);
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

const fetchSection = async (id) => {
  const res = await fetch(`${RAW_BASE}${id}.md`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
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
  const gaps = [...shas.keys()].filter(
    (id) => state.posts[id]?.section === "jeongcheogi" && !refs.has(id),
  );

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
  if (gaps.length) {
    lines.push("## 커버리지 갭 — 정처기 글인데 문항이 없음 (문항 제작 후보)", "");
    for (const id of gaps) lines.push(`- \`${id}\``);
    lines.push("");
  }
  // 개념 노트 도입부 갭 — 문항이 참조하는 주제인데 topic-notes.json에 도입부가 없음
  let introOf = {};
  try {
    introOf = JSON.parse(readFileSync(TOPIC_NOTES, "utf8"));
  } catch {
    /* 파일 없음 — 전 주제가 갭으로 잡힌다 */
  }
  const noIntro = [...refs.keys()].filter((id) => !introOf[id]);
  if (noIntro.length) {
    lines.push("## 도입부 갭 — 개념 노트에 도입부가 없는 주제 (topic-notes.json 작성 후보)", "");
    for (const id of noIntro) lines.push(`- \`${id}\` (문항 ${refs.get(id)}개)`);
    lines.push("");
  }

  // 보고했으니 상태를 현재로 갱신 — 같은 개정을 다음 주에 또 보고하지 않는다
  for (const [id, sha] of shas) if (state.posts[id]) state.posts[id].sha = sha;
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

const mode = process.argv[2];
if (mode === "--check") await check();
else if (mode === "--report") await report();
else {
  console.error("사용법: node scripts/blog-sync.mjs --check | --report");
  process.exit(1);
}
