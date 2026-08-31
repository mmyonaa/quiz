// 필기(4지선다) 문항 병합·점검 도구. 의존성 없음.
//
//   written-merge.mjs draft.json [...]   초안을 검증한 뒤 questions.json 뒤에 붙인다
//   written-merge.mjs --dry draft.json   검증만 하고 쓰지 않는다
//   written-merge.mjs --report           시험별 은행 현황 + 다음에 낼 주제 고르기
//
// 실기용(practical-merge.mjs)과 같은 이유로 둔다 — 스키마의 최종 게이트는 빌드(zod .strict())지만,
// 깨진 초안이 questions.json에 **쓰이기 전에** 잡고 zod가 원리상 못 보는 것(문항 사이의 id·발문 중복)을 본다.
//
// 시험 축은 문항이 아니라 주제가 갖는다. 그래서 이 스크립트도 시험 목록을 따로 들고 있지 않고
// topic-notes.json에서 읽는다 — 표를 베껴 두면 언젠가 content.config.ts와 어긋난다.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANK = join(root, "src/data/questions.json");
const PRACTICAL = join(root, "src/data/practical.json");
const TOPIC_NOTES = join(root, "src/data/topic-notes.json");

/** content.config.ts의 DEFAULT_EXAM과 같은 값 — topic-notes.json에서 exam을 생략하면 이 시험이다 */
const DEFAULT_EXAM = "정처기";
const DIFFS = new Set(["하", "중", "상"]);
const ORDER = ["id", "area", "difficulty", "topic", "question", "code", "choices", "answer", "explanation"];
const FIELDS = new Set(ORDER);
const REQUIRED = ["id", "area", "difficulty", "topic", "question", "choices", "answer", "explanation"];

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const loadTopics = () =>
  Object.fromEntries(Object.entries(read(TOPIC_NOTES)).map(([k, t]) => [k, { exam: DEFAULT_EXAM, ...t }]));
/** 코드 해석 문항은 발문이 서로 같다("다음 Java 코드의 출력은?") — 제시문까지 묶어 비교한다 */
const stem = (q) => `${q.question?.trim()} ${q.code?.trim() ?? ""}`;

/** 문항 하나 점검 — 오류 목록을 돌려준다(빈 배열이면 통과) */
const check = (q, seenIds, seenStems, topics) => {
  const e = [];
  const extra = Object.keys(q).filter((k) => !FIELDS.has(k));
  if (extra.length) e.push(`허용되지 않은 필드 ${extra.join(", ")}`);
  const missing = REQUIRED.filter((k) => q[k] === undefined);
  if (missing.length) return [...e, `필수 필드 누락 ${missing.join(", ")}`];

  if (!/^[a-z0-9-]+$/.test(q.id)) e.push("id는 영문 kebab-case");
  if (/^p-/.test(q.id)) e.push("p- 접두어는 실기 문항의 것이다");
  if (seenIds.has(q.id)) e.push("id 중복");
  if (!DIFFS.has(q.difficulty)) e.push(`difficulty 불명 ${q.difficulty}`);
  if (q.question.length < 10) e.push("question 10자 미만");
  if (q.explanation.length < 20) e.push("explanation 20자 미만");
  if (seenStems.has(stem(q))) e.push("기존 문항과 발문·제시문이 동일");

  const t = topics[q.topic];
  if (!t) e.push(`topic이 topic-notes.json에 없음: ${q.topic}`);
  // 영역은 주제가 갖는 값과 같아야 한다. 시험별 영역 목록을 여기서 따로 들 필요가 없는 이유다.
  else if (t.area !== q.area) e.push(`area가 주제의 area(${t.area})와 다름: ${q.area}`);

  if (!Array.isArray(q.choices) || q.choices.length !== 4) e.push(`choices ${q.choices?.length}개 (4개여야 함)`);
  else {
    if (q.choices.some((c) => typeof c !== "string" || !c.trim())) e.push("빈 보기가 있음");
    const dup = q.choices.filter((c, i) => q.choices.indexOf(c) !== i);
    if (dup.length) e.push(`보기 중복 ${JSON.stringify([...new Set(dup)])}`);
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) e.push(`answer 범위 밖 ${q.answer}`);
  return e;
};

const merge = (paths, dry) => {
  const bank = read(BANK);
  const topics = loadTopics();
  const seenIds = new Set([...bank.map((q) => q.id), ...read(PRACTICAL).map((q) => q.id)]);
  const seenStems = new Set(bank.map(stem));

  // 초안이 배열로 오기도 하고 {questions:[...]}로 감싸여 오기도 한다 — 둘 다 받는다
  const incoming = paths.flatMap((p) => {
    const d = read(p);
    return Array.isArray(d) ? d : (d.questions ?? []);
  });
  if (!incoming.length) return console.error("초안에 문항이 없다");

  let bad = false;
  for (const q of incoming) {
    const errs = check(q, seenIds, seenStems, topics);
    if (errs.length) {
      bad = true;
      console.error(`X ${q.id ?? "?"}: ${errs.join("; ")}`);
    } else {
      seenIds.add(q.id);
      seenStems.add(stem(q));
    }
  }
  if (bad) process.exit(1);

  const normalized = incoming.map((q) =>
    Object.fromEntries(ORDER.filter((k) => q[k] !== undefined).map((k) => [k, q[k]])),
  );
  if (!dry) writeFileSync(BANK, `${JSON.stringify([...bank, ...normalized], null, 2)}\n`);

  const tally = (pool, key) =>
    Object.entries(pool.reduce((m, q) => ({ ...m, [q[key]]: (m[q[key]] ?? 0) + 1 }), {}))
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ");
  const exams = [...new Set(normalized.map((q) => topics[q.topic].exam))];
  console.log(`${dry ? "검증 통과(쓰지 않음)" : "병합"} — 은행 ${bank.length} -> ${bank.length + normalized.length}문항`);
  console.log(`  시험: ${exams.join(", ")}`);
  console.log(`  난이도: ${tally(normalized, "difficulty")}`);
  console.log(`  영역: ${tally(normalized, "area")}`);
  // 기출은 부정형 발문이 절반쯤 된다 — 긍정형만 쌓이면 실제 시험과 결이 달라진다
  const NEG = /틀린 것|옳지 않은|아닌 것|해당하지 않|거리가 먼|적절하지 않|적합하지 않|되지 않는|할 수 없는|아닌 것은/;
  const neg = normalized.filter((q) => NEG.test(q.question)).length;
  console.log(`  부정형 발문 ${neg}/${normalized.length} (${Math.round((neg / normalized.length) * 100)}%) · 기출 참고치 약 50%`);
  if (!dry) console.log("  다음: npm run build 로 스키마 게이트를 통과시킬 것");
};

/** 현황 리포트 — "다음에 어느 주제를 낼까"를 고르기 위한 것 */
const report = () => {
  const bank = read(BANK);
  const practical = read(PRACTICAL);
  const topics = loadTopics();
  const per = (arr) => arr.reduce((m, q) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }), {});
  const w = per(bank);
  const p = per(practical);

  for (const exam of [...new Set(Object.values(topics).map((t) => t.exam))]) {
    const keys = Object.keys(topics).filter((k) => topics[k].exam === exam);
    const mine = keys.filter((k) => w[k]);
    const total = keys.reduce((n, k) => n + (w[k] ?? 0), 0);
    console.log(`\n[${exam}] 필기 ${total}문항 · 주제 ${mine.length}/${keys.length} 보유 · 모의고사 ${Math.floor(total / 100)}세트분(100문항/세트)`);

    const bySubject = {};
    for (const k of keys) {
      const s = topics[k].subject;
      bySubject[s] = (bySubject[s] ?? 0) + (w[k] ?? 0);
    }
    // 과목당 20문항이 한 세트다 — 한 과목이라도 20을 못 채우면 모의고사 편성이 깨진다
    console.log(
      `  과목별: ${Object.entries(bySubject)
        .map(([s, n]) => `${s} ${n}${n < 20 ? `(-${20 - n})` : ""}`)
        .join(" · ")}`,
    );

    const todo = keys.filter((k) => !w[k]);
    if (!todo.length) {
      console.log("  모든 주제가 1문항 이상을 갖고 있다");
      continue;
    }
    console.log(`  필기 없는 주제 ${todo.length}개:`);
    for (const k of todo) {
      const t = topics[k];
      console.log(`    ${String(p[k] ?? 0).padStart(2)}실기  ${k.padEnd(30)} ${t.subject} · ${t.title}`);
    }
  }
};

const args = process.argv.slice(2);
if (args.includes("--report") || !args.length) report();
else merge(args.filter((a) => !a.startsWith("--")), args.includes("--dry"));
