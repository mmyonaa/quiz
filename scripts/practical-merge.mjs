// 실기(필답형) 문항 병합·점검 도구. 의존성 없음.
//
//   practical-merge.mjs draft.json [...]   초안을 검증한 뒤 practical.json 뒤에 붙인다
//   practical-merge.mjs --dry draft.json   검증만 하고 쓰지 않는다
//   practical-merge.mjs --report           현재 은행 현황 + 다음에 낼 주제 고르기
//
// 스키마의 최종 게이트는 빌드(zod .strict())다. 이 스크립트가 그걸 한 번 더 보는 이유는
// 깨진 초안을 practical.json에 **쓰기 전에** 잡기 위해서다. 그리고 zod가 원리상 못 보는 것
// — 문항 사이의 id·발문 중복, 정규화하면 서로 같아지는 허용 표기 — 이 여기에 있다.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
// 채점기의 normalize를 그대로 쓴다. 점검용으로 베껴 쓰면 두 규칙이 반드시 어긋난다.
import { normalize } from "../src/lib/practical-grade.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANK = join(root, "src/data/practical.json");
const TOPIC_NOTES = join(root, "src/data/topic-notes.json");
const WRITTEN = join(root, "src/data/questions.json");

const DIFFS = new Set(["하", "중", "상"]);
const KINDS = new Set(["단답형", "계산형", "코드형", "SQL형", "약술형"]);
const ORDER = ["id", "topic", "difficulty", "kind", "question", "code", "answers", "labels", "modelAnswer", "keywords", "explanation"];
const FIELDS = new Set(ORDER);
const REQUIRED = ["id", "topic", "difficulty", "kind", "question", "answers", "explanation"];

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
/** 발문만으로는 코드형이 서로 같아 보인다("다음 코드의 출력은?") — 제시문까지 묶어 비교한다 */
const stem = (q) => `${q.question?.trim()} ${q.code?.trim() ?? ""}`;

/** 문항 하나 점검 — 오류 목록을 돌려준다(빈 배열이면 통과) */
const check = (q, seenIds, seenStems, topics) => {
  const e = [];
  const extra = Object.keys(q).filter((k) => !FIELDS.has(k));
  if (extra.length) e.push(`허용되지 않은 필드 ${extra.join(", ")}`);
  const missing = REQUIRED.filter((k) => q[k] === undefined);
  if (missing.length) return [...e, `필수 필드 누락 ${missing.join(", ")}`];

  if (!/^p-[a-z0-9-]+$/.test(q.id)) e.push("id는 p-로 시작하는 kebab-case");
  if (seenIds.has(q.id)) e.push("id 중복");
  if (!topics[q.topic]) e.push(`topic이 topic-notes.json에 없음: ${q.topic}`);
  if (!DIFFS.has(q.difficulty)) e.push(`difficulty 불명 ${q.difficulty}`);
  if (!KINDS.has(q.kind)) e.push(`kind 불명 ${q.kind}`);
  if (q.question.length < 10) e.push("question 10자 미만");
  if (q.explanation.length < 20) e.push("explanation 20자 미만");
  if (seenStems.has(stem(q))) e.push("기존 문항과 발문·제시문이 동일");

  if (q.kind === "약술형") {
    if (q.answers.length) e.push("약술형은 answers를 비운다(자가 채점)");
    if (!q.modelAnswer) e.push("약술형은 modelAnswer가 필요");
    if (!q.keywords?.length) e.push("약술형은 keywords가 필요");
  } else {
    if (!q.answers.length) e.push("답란이 하나도 없음");
    if (q.modelAnswer || q.keywords) e.push("modelAnswer·keywords는 약술형 전용");
  }
  if ((q.kind === "코드형" || q.kind === "SQL형") && !q.code) e.push(`${q.kind}은 제시문(code)이 필요`);
  if (q.labels && q.labels.length !== q.answers.length) e.push(`labels ${q.labels.length}개 vs 답란 ${q.answers.length}개`);

  // 답란별 허용 표기 — 채점기가 실제로 보는 값(정규화 결과)으로 점검한다
  q.answers.forEach((accepted, i) => {
    const at = `답란 ${i + 1}`;
    if (!Array.isArray(accepted) || !accepted.length) return e.push(`${at}: 허용 표기가 비어 있음`);
    const norm = accepted.map(normalize);
    // 정규화 후 빈 문자열이면 어떤 입력과도 맞지 않는다 — 채점 불가 문항이 된다
    const empty = accepted.filter((_, j) => !norm[j]);
    if (empty.length) e.push(`${at}: 정규화하면 빈 값이 되는 표기 ${JSON.stringify(empty)}`);
    const dup = norm.filter((n, j) => n && norm.indexOf(n) !== j);
    if (dup.length) e.push(`${at}: 정규화하면 서로 같은 표기 ${JSON.stringify([...new Set(dup)])}`);
  });
  return e;
};

const merge = (paths, dry) => {
  const bank = read(BANK);
  const topics = read(TOPIC_NOTES);
  const seenIds = new Set(bank.map((q) => q.id));
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
  console.log(`${dry ? "검증 통과(쓰지 않음)" : "병합"} — 은행 ${bank.length} -> ${bank.length + normalized.length}문항`);
  console.log(`  유형: ${tally(normalized, "kind")}`);
  console.log(`  난이도: ${tally(normalized, "difficulty")}`);
  console.log(`  주제: ${[...new Set(normalized.map((q) => q.topic))].sort().join(", ")}`);
  if (!dry) console.log("  다음: npm run build 로 스키마 게이트를 통과시킬 것");
};

/** 현황 리포트 — "다음에 어느 주제를 낼까"를 고르기 위한 것 */
const report = () => {
  const bank = read(BANK);
  const topics = read(TOPIC_NOTES);
  const written = read(WRITTEN);
  const per = (arr) => arr.reduce((m, q) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }), {});
  const mine = per(bank);
  const w = per(written);
  const keys = Object.keys(topics);
  const covered = keys.filter((k) => mine[k]);

  const tally = (key) =>
    Object.entries(bank.reduce((m, q) => ({ ...m, [q[key]]: (m[q[key]] ?? 0) + 1 }), {}))
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ");
  console.log(
    `실기 ${bank.length}문항 · 주제 ${covered.length}/${keys.length} 보유 · 모의고사 ${Math.floor(bank.length / 20)}세트분(20문항/세트)`,
  );
  console.log(`  유형: ${tally("kind")}`);
  console.log(`  난이도: ${tally("difficulty")}`);
  console.log("");

  // 실기가 없는 주제 = 다음 출제 후보. 필기 문항이 많은 주제일수록 시험 비중이 크다.
  // 도입부에 라틴 문자가 없으면 영문·약어 병기가 없다는 뜻 — 그 주제는 채점 허용 표기가 반드시 샌다.
  // (한글(영문) 정규식으로 재면 어순이 바뀐 병기를 놓친다. 라틴 문자 유무로 재는 편이 정확하다.)
  const todo = keys.filter((k) => !mine[k]).sort((a, b) => (w[b] ?? 0) - (w[a] ?? 0));
  console.log(`실기 없는 주제 ${todo.length}개 — 필기 문항 수 내림차순 (! = 도입부에 영문 병기 없음, 출제 전 보강할 것)`);
  for (const k of todo) {
    const t = topics[k];
    const flag = /[A-Za-z]/.test(t.intro) ? "  " : "! ";
    console.log(`  ${flag} ${String(w[k] ?? 0).padStart(2)}문항  ${k.padEnd(28)} ${t.area} · ${t.title}`);
  }
};

const args = process.argv.slice(2);
if (args.includes("--report") || !args.length) report();
else merge(args.filter((a) => !a.startsWith("--")), args.includes("--dry"));
