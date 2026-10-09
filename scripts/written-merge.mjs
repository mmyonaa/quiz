// 필기(4지선다) 문항 병합·점검 도구. 의존성 없음.
//
//   written-merge.mjs draft.json [...]   초안을 검증한 뒤 questions.json 뒤에 붙인다
//   written-merge.mjs --dry draft.json   검증만 하고 쓰지 않는다
//   written-merge.mjs --report           시험별 은행 현황(필기·실기·암기 카드) + 다음에 낼 주제 고르기
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
const MEMO_NOTES = join(root, "src/data/memo-notes.json");

/** content.config.ts의 DEFAULT_EXAM과 같은 값 — topic-notes.json에서 exam을 생략하면 이 시험이다 */
const DEFAULT_EXAM = "정처기";
const DIFFS = new Set(["하", "중", "상"]);
const ORDER = ["id", "area", "difficulty", "topic", "concept", "question", "code", "choices", "answer", "explanation"];
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

/**
 * 보기에서 답이 유도되는 드리프트 지표.
 *
 * 필기는 정답이 보기 중 하나로 **이미 보이므로**, 실기처럼 "정답이 발문에 있으면 결함"이
 * 성립하지 않는다(발문이 뜻을 설명하고 보기에서 이름을 고르는 것은 정상 유형이다).
 * 대신 보기 묶음의 **모양**이 정답을 가리키는 경우가 결함이고, 이건 한 문항만 보면
 * 판단할 수 없다 — 은행 전체의 치우침으로만 드러난다. 그래서 막지 않고 보이게만 한다.
 *
 * 실제로 정보보안기사 은행은 정답이 1번에 54%(234/436) 쏠려 있었고, 보기는 은행에 적힌
 * 순서로 그대로 렌더되므로 그 자체가 답을 유도하는 구조였다. 숫자로 보고 있었다면
 * 386문항이 쌓이기 전에 알아챘을 것이다.
 */
const NEG_STEM = /틀린 것|옳지 않은|아닌 것|해당하지 않|거리가 먼|적절하지 않|적합하지 않|되지 않는|할 수 없는|없는 것|보기 어려운/;
const ABSOLUTE = /항상|절대|무조건|전혀|반드시|유일|100%|필요 없다|불필요하다|언제나/;
const has = (re) => (c) => re.test(c);

const drift = (pool) => {
  const only = (pred) => pool.filter((q) => pred(q.choices[q.answer]) && q.choices.filter(pred).length === 1).length;
  const skewed = pool.filter((q) => {
    const len = q.choices.map((c) => c.length);
    const mine = len[q.answer];
    const rest = len.filter((_, i) => i !== q.answer);
    const max = Math.max(...rest);
    const min = Math.min(...rest);
    return (mine > max * 1.6 && mine - max >= 10) || (mine * 1.6 < min && min - mine >= 10);
  }).length;
  const neg = pool.filter((q) => NEG_STEM.test(q.question));
  return {
    byIndex: [0, 1, 2, 3].map((i) => pool.filter((q) => q.answer === i).length),
    skewed,
    onlyParen: only(has(/[([]/)),
    onlyLatin: only(has(/[A-Za-z]/)),
    neg: neg.length,
    negAbsolute: neg.filter((q) => ABSOLUTE.test(q.choices[q.answer])).length,
  };
};

/**
 * 영역별 형광펜 밀도. 게이트(content.config.ts)는 한 항목만 보므로 "해설 하나에 하나까지"는
 * 막을 수 있어도 "영역 해설의 절반이 노란색"은 못 본다 — 보기 쏠림과 같은 종류의 지표다.
 *
 * 실제로 그렇게 됐다: 정보보안기사 해설의 31~64%가 형광펜을 들고 있었고(정처기는 13%),
 * 한 커밋이 130문항에 124개를 한꺼번에 붙인 결과였다. 기준은 "열 장 중 한둘"(10~20%)이다.
 */
const HL = /==(?=\S)[^=\n]+(?<=\S)==/g;
const hlDensity = (pool, areaOf) => {
  const m = {};
  for (const q of pool) {
    const a = areaOf(q);
    (m[a] ??= [0, 0])[0] += 1;
    if (HL.test(q.explanation + (q.modelAnswer ?? ""))) m[a][1] += 1;
    HL.lastIndex = 0;
  }
  return m;
};

/**
 * 개념 포스트잇이 정답을 비추는 정도. 게이트(content.config.ts)는 정답 선지가 포스트잇에
 * **통째로** 들어간 것만 막는다 — 글자를 조금 바꿔 쓰면 빠져나가고, 짧은 정답("MX"·"21번")은
 * 자를 아예 대지 않는다. 그 몫을 여기서 숫자로 본다.
 *
 * 재는 것은 "포스트잇의 낱말이 정답 선지에만 몰려 있는가"다. 오답에도 고르게 걸치면
 * 그 포스트잇은 축을 세운 것이고, 정답에만 걸리면 답을 가리킨 것이다(#112).
 */
const leakToks = (s) =>
  new Set(
    (s ?? "")
      .replace(/[=*`]/g, "")
      .replace(/[()\[\]{}·,.\/\-—–'"]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2),
  );
const leakOverlap = (concept, choice) => {
  const A = leakToks(concept);
  const B = [...leakToks(choice)];
  return B.length ? B.filter((t) => A.has(t)).length / B.length : 0;
};
/**
 * 순서가 매겨진 열거는 게이트 양쪽을 다 빠져나간다.
 *
 * `"결합도는 자료<스탬프<제어<외부<공통<내용 순으로 강해지며"`는 같은 페이지의
 * `"가장 높고 나쁜 결합도는?"`에 사다리의 맨 끝을 그대로 답한다. 그런데 게이트는 못 본다 —
 * 선지는 `"내용 결합도"`인데 포스트잇에는 `"내용"`만 있어 통째 포함이 아니고, 선지를
 * 여럿 품으므로 열거형 참고 목록으로 통과한다. **순서가 뜻을 묶는다**는 것을 기계가 모른다.
 *
 * 그래서 세지 말고 **짚어만 준다** — 순서 표지(`<`·`→`·`순으로`·사다리)를 든 포스트잇과
 * '가장 ~한 것'을 묻는 발문이 한 주제에 함께 있으면 눈으로 보라고 올린다. 오탐이 섞인다
 * (응집도 사다리와 결합도 발문처럼 축이 다른 짝). 판정은 사람이 한다(#114).
 */
const ORDER_MARK = /<|→|순으로|순서대로|사다리|층을 이룬/;
const EXTREME_ASK = /가장 (높|낮|좋|나쁜|강|약|먼저|적게|오랜)|맨 (위|앞)|최상위|최하위|제일/;
const orderedPairs = (pool) => {
  const byTopic = {};
  for (const q of pool) (byTopic[q.topic] ??= []).push(q);
  return Object.entries(byTopic).filter(([, qs]) => {
    return qs.some((q) => q.concept && ORDER_MARK.test(q.concept)) && qs.some((q) => EXTREME_ASK.test(q.question));
  });
};

/** 정답에만 쏠린 포스트잇을 센다 — 정답 겹침이 높고 오답 겹침과 벌어진 것 */
const conceptLeaks = (pool) =>
  pool.filter((q) => {
    if (!q.concept) return false;
    const a = leakOverlap(q.concept, q.choices[q.answer]);
    const o = Math.max(...q.choices.map((c, i) => (i === q.answer ? 0 : leakOverlap(q.concept, c))));
    return a >= 0.7 && a - o >= 0.35;
  });

/**
 * 같은 주제의 옆 포스트잇이 정답과만 겹치는 쌍. 게이트는 정답 선지가 **통째로** 든 것만
 * 막으므로, 글자를 조금 바꿔 쓴 것(`"위장하되"` vs `"위장하지만"`)은 그 자를 빠져나간다 —
 * 그렇게 샌 것이 다섯 있었고 셋은 자기 카드까지 흘렸다(#114).
 *
 * 오탐이 섞인다. 짧은 정답(`IP`)은 그 주제 글에 안 나올 수가 없고, 괄호가 많은 값(`O(n)`)은
 * 토큰이 잘려 겹침이 과장된다. 세기만 하고 판정은 사람이 한다.
 */
const crossConceptLeaks = (pool) => {
  const byTopic = {};
  for (const q of pool) (byTopic[q.topic] ??= []).push(q);
  const out = [];
  for (const qs of Object.values(byTopic))
    for (const q of qs)
      for (const other of qs) {
        if (other.id === q.id || !other.concept) continue;
        const a = leakOverlap(other.concept, q.choices[q.answer]);
        const o = Math.max(...q.choices.map((c, i) => (i === q.answer ? 0 : leakOverlap(other.concept, c))));
        if (a >= 0.7 && a - o >= 0.35) out.push(`${q.id}←${other.id}`);
      }
  return out;
};

/** 현황 리포트 — "다음에 어느 주제를 낼까"를 고르기 위한 것 */
const report = () => {
  const bank = read(BANK);
  const practical = read(PRACTICAL);
  const memos = read(MEMO_NOTES);
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

    // 보기 모양이 답을 가리키는지 — 막지 않고 숫자로만 보여 준다(위 주석 참고)
    const pool = bank.filter((q) => topics[q.topic]?.exam === exam);
    if (pool.length) {
      const d = drift(pool);
      const even = Math.round(pool.length / 4);
      const worst = Math.max(...d.byIndex);
      console.log(
        `  정답 위치: ${d.byIndex.join("·")} (고르면 각 ${even}) ` +
          `${worst > even * 1.25 ? `← ${d.byIndex.indexOf(worst) + 1}번에 ${Math.round((worst / pool.length) * 100)}% 쏠렸다` : "균형"}`,
      );
      console.log(
        `  보기 모양: 정답지만 유난히 길거나 짧음 ${d.skewed} · 정답지만 괄호 병기 ${d.onlyParen} · 정답지만 영문 포함 ${d.onlyLatin}`,
      );
      console.log(
        `  부정형 발문 ${d.neg}/${pool.length} (${Math.round((d.neg / pool.length) * 100)}%, 기출 참고치 약 50%)` +
          ` · 그중 정답지에 절대어 ${d.negAbsolute}`,
      );

      // 포스트잇이 답을 비추는지 — 게이트가 통째 포함만 막으므로 쏠림은 여기서 본다
      const withConcept = pool.filter((q) => q.concept);
      const leaks = conceptLeaks(pool);
      console.log(
        `  개념 포스트잇 ${withConcept.length}/${pool.length}` +
          ` · 정답에만 쏠린 것 ${leaks.length}${leaks.length ? ` ← ${leaks.slice(0, 5).map((q) => q.id).join(" · ")}${leaks.length > 5 ? " …" : ""}` : ""}`,
      );
      const cross = crossConceptLeaks(pool);
      if (cross.length)
        console.log(`  옆 포스트잇이 정답과만 겹치는 쌍 ${cross.length}: ${cross.slice(0, 6).join(" · ")}${cross.length > 6 ? " …" : ""}  ← 눈으로 확인`);

      // 순서 열거 + 극단 발문 — 게이트가 못 보는 자리라 눈으로 보라고 짚어만 준다(오탐 섞임)
      const ordered = orderedPairs(pool);
      if (ordered.length)
        console.log(`  순서 열거와 '가장 ~한 것' 발문이 한 주제에 함께: ${ordered.map(([t]) => t).join(" · ")}  ← 눈으로 확인`);
    }

    // 형광펜 밀도 — 상한을 넘으면 그 영역 페이지가 통째로 노랗게 읽힌다
    const areaOf = (q) => topics[q.topic].area;
    for (const [label, src] of [
      ["필기", pool],
      ["실기", practical.filter((q) => topics[q.topic]?.exam === exam)],
    ]) {
      const d = hlDensity(src, areaOf);
      // 아래쪽도 본다 — 상한만 보던 탓에 데이터베이스가 5%로 평평한 것을 오래 놓쳤다.
      // 표본이 작으면 한 건이 10%를 넘겨 비율이 튀므로 20문항 미만은 경고하지 않는다.
      const off = (f) => Object.entries(d).filter(([, [n, h]]) => n >= 20 && f(h / n));
      const over = off((r) => r > 0.2);
      const under = off((r) => r < 0.1);
      const line = Object.entries(d)
        .map(([a, [n, h]]) => `${a} ${Math.round((h / n) * 100)}%`)
        .join(" · ");
      const flag = [over.length && "상한 초과", under.length && "하한 미만"].filter(Boolean).join(" · ");
      if (line) console.log(`  ${label} 형광펜 밀도(기준 10~20%): ${line}${flag ? `  ← ${flag}` : ""}`);
    }

    // ── 암기 카드 ──
    // 카드는 주제를 통해 시험·영역을 물려받고, 한 카드가 두 시험에 걸칠 수 있다(#92).
    // 여기서 보는 것은 "얼마나 많은가"가 아니라 **영역끼리 고른가**다. 암기 노트는 주제와
    // 1:1일 이유가 없어 절대 목표치가 없지만, 영역 간 편차는 대개 "외울 게 그 영역에 몰려서"가
    // 아니라 아직 그 영역을 안 썼기 때문이다(초안을 네트워크부터 쓴 탓에 정보보안기사
    // 네트워크 보안이 11장, 나머지 다섯 영역이 각 4장이었다 — 2026-10-05 실측).
    //
    // 임계는 두지 않는다. 주제 수가 영역마다 3배 가까이 달라(소프트웨어공학 26 : 네트워크 9)
    // 고정 퍼센트가 성립하지 않고, "몇 %가 옳다"는 근거도 없다. 적은 순으로 줄 세우고 평균을
    // 함께 적어 꼬리가 어디인지만 보여 준다 — 어디를 메울지는 읽는 사람이 고른다.
    //
    // 형광펜 밀도는 재지 않는다. 해설은 열에 한둘만 칠하는 게 맞지만 카드는 한 장이 곧 한 주제라
    // 저마다 "들고 갈 한 줄"을 갖는 것이 정상이다(실측 67~100%). 재면 전부 경보가 된다.
    const mCards = Object.entries(memos).filter(([, m]) => m.topics.some((t) => topics[t]?.exam === exam));
    if (mCards.length) {
      const topicOf = (m) => m.topics.find((x) => topics[x]?.exam === exam);
      const byArea = {};
      for (const k of keys) (byArea[topics[k].area] ??= [0, 0])[1] += 1;
      for (const [, m] of mCards) byArea[topics[topicOf(m)].area][0] += 1;
      const held = new Set(mCards.map(([, m]) => topicOf(m)));
      const avg = Math.round((mCards.length / keys.length) * 100);
      console.log(`  암기 카드 ${mCards.length}장 · 주제 ${held.size}/${keys.length} 보유 · 영역 평균 ${avg}%`);
      console.log(
        `  영역별 카드/주제(적은 순): ${Object.entries(byArea)
          .map(([a, [c, n]]) => [a, c, n, n ? c / n : 0])
          .sort((x, y) => x[3] - y[3])
          .map(([a, c, n, r]) => `${a} ${c}/${n} ${Math.round(r * 100)}%`)
          .join(" · ")}`,
      );
    }

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
