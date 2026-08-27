/**
 * 실기 채점 엔진 — 필답형의 본질적 난제는 "같은 답의 다른 표기"다.
 *
 * 교착상태 / 데드락 / Deadlock / dead lock / 교착 상태 는 모두 정답이어야 하고,
 * 그렇지 못하면 자동 채점이 학습을 방해한다. 두 겹으로 흡수한다.
 *   1) normalize() — 표기 요동(공백·대소문자·전각·구두점)을 기계적으로 뭉갠다
 *   2) answers 목록 — 뜻이 같은 다른 낱말(한글/영문/약어)은 문항이 직접 나열한다
 * 그래도 새는 표기는 사용자가 "이 표기도 정답 처리"로 로컬에 덧붙인다.
 */

/**
 * 채점 전 정규화.
 * - NFKC: 전각 영문·숫자(ＳＱＬ)와 조합형 한글을 표준형으로
 * - 소문자화: SQL / sql / Sql 을 하나로
 * - 공백 제거: "교착 상태", "dead lock"을 붙여쓴 형태와 같게
 * - 장식 문자 제거: 괄호·쉼표·가운뎃점 등
 *
 * 빼기와 마침표는 **함부로 지우지 않는다**. 후위 표기 답안 `35+82-*`에서 -를 지우면
 * `35+82*`도 정답이 되어 버리고, `3.14`에서 .을 지우면 `314`가 통과한다.
 * 하이픈은 "글자-글자"로 낱말을 잇는 자리(Go-Back-N ↔ Go Back N)에서만 없앤다.
 */
const DECOR = /[()[\]{}<>,·・:;'"`~!?_–—]/g;
const WORD_HYPHEN = /([a-z가-힣])-([a-z가-힣])/g;

export const normalize = (s: string): string => {
  let out = s.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(DECOR, "");
  // "a-b-c"처럼 하이픈이 한 글자 간격으로 이어지면 한 번에 다 걸리지 않아 안정될 때까지 돈다
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(WORD_HYPHEN, "$1$2");
  }
  return out.replace(/^[.\-]+|[.\-]+$/g, ""); // 문장 끝 마침표 같은 장식만 떼어낸다
};

/** 한 답란 채점 — 허용 표기 중 하나와 정규화 결과가 같으면 정답 */
export const matchBlank = (input: string, accepted: string[], extra: string[] = []): boolean => {
  const got = normalize(input);
  if (!got) return false;
  return [...accepted, ...extra].some((a) => normalize(a) === got);
};

export type BlankResult = { input: string; ok: boolean };

/**
 * 문항 채점 — 실기는 부분 점수가 거의 없다.
 * 다답형이라도 답란을 모두 맞혀야 정답으로 본다(blanks에는 칸별 정오를 남겨 복기용으로 쓴다).
 */
export const gradeQuestion = (
  answers: string[][],
  inputs: string[],
  extras: string[][] = [],
): { ok: boolean; blanks: BlankResult[] } => {
  const blanks = answers.map((accepted, i) => ({
    input: inputs[i] ?? "",
    ok: matchBlank(inputs[i] ?? "", accepted, extras[i] ?? []),
  }));
  return { ok: blanks.length > 0 && blanks.every((b) => b.ok), blanks };
};

/**
 * 약술형 보조 — 모범답안의 핵심 낱말이 답안에 몇 개 들어갔는지 센다.
 * 이건 채점이 아니라 자가 채점의 근거다. 최종 정오는 사용자가 찍는다.
 */
export const countKeywords = (input: string, keywords: string[]): string[] => {
  const got = normalize(input);
  return keywords.filter((k) => got.includes(normalize(k)));
};

/** 실기 점수 — 20문항 × 5점 = 100점, 60점 이상 합격 */
export const PRACTICAL_TOTAL = 20;
export const PRACTICAL_POINT = 5;
export const PRACTICAL_PASS = 60;
export const PRACTICAL_MINUTES = 150;
