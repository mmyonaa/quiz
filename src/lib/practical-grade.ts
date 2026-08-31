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
 * 문항 채점 — 답란별 정오와 함께 맞힌 비율(ratio)을 돌려준다.
 *
 * ok는 "답란을 모두 맞혔는가"다. 시험에 따라 부분 점수를 주기도 하므로 비율을 함께 낸다 —
 * 부분 점수를 어디에 줄지는 채점기가 아니라 시험 형식(PRACTICAL_FORMAT.partialCredit)이 정한다.
 */
export const gradeQuestion = (
  answers: string[][],
  inputs: string[],
  extras: string[][] = [],
): { ok: boolean; blanks: BlankResult[]; ratio: number } => {
  const blanks = answers.map((accepted, i) => ({
    input: inputs[i] ?? "",
    ok: matchBlank(inputs[i] ?? "", accepted, extras[i] ?? []),
  }));
  const hit = blanks.filter((b) => b.ok).length;
  return {
    ok: blanks.length > 0 && hit === blanks.length,
    blanks,
    ratio: blanks.length > 0 ? hit / blanks.length : 0,
  };
};

/**
 * 약술형 보조 — 모범답안의 핵심 낱말이 답안에 몇 개 들어갔는지 센다.
 * 이건 채점이 아니라 자가 채점의 근거다. 최종 정오는 사용자가 찍는다.
 */
export const countKeywords = (input: string, keywords: string[]): string[] => {
  const got = normalize(input);
  return keywords.filter((k) => got.includes(normalize(k)));
};

/**
 * 시험별 실기 형식 — 문항 수·시간·합격선·배점.
 *
 * 이 파일은 브라우저로도 번들되므로 astro:content를 끌어오는 content.config.ts에 의존하지 않는다.
 * 반대로 content.config.ts가 여기를 읽어 EXAM_FORMAT을 조립한다(값의 단일 정의는 여기다).
 *
 * 정처기는 20문항 × 5점 균일이라 uniformPoint 하나면 끝난다.
 * 정보보안기사는 유형마다 배점이 다르고(3·12·16점), 실무형은 2문항 중 1문항만 답한다 —
 * 그래서 출제 문항 수(18)와 채점 문항 수(17)가 다르다. 근거는 이슈 #33.
 */
export type PracticalComposition = {
  kind: string;
  /** 제시되는 문항 수 */
  asked: number;
  /** 그중 실제로 채점되는 문항 수(생략하면 asked 전부) */
  choose?: number;
  /** 문항당 배점 */
  points: number;
};

export type PracticalFormat = {
  /** 출제 문항 수 */
  total: number;
  minutes: number;
  /** 합격선(100점 만점 기준) */
  pass: number;
  /** 모든 문항의 배점이 같을 때만 쓴다 */
  uniformPoint?: number;
  composition?: PracticalComposition[];
  /** 부분 점수를 주는 유형 — 답란을 맞힌 비율만큼 점수를 준다 */
  partialCredit?: string[];
};

/**
 * 시험별 실기 형식 — 값의 단일 정의.
 *
 * 근거의 층이 다르니 고칠 때 유의할 것.
 * - **공식**(KCA `cq.or.kr` 종목 안내·출제기준): 검정방법 필답형, 시험시간 3시간,
 *   100점 만점 60점 이상 합격. 곧 `minutes`·`pass`는 공식 값이다.
 * - **비공식**: `composition`의 유형별 문항 수와 배점. 출제기준은 배점을 규정하지 않고
 *   시행기관도 공개하지 않는다. 수험서·기출 정리가 일관되게 전하는 값이며,
 *   **과거에 바뀐 이력이 있다**(서술형·실무형이 각 14점이던 시기가 있었다고 전해진다).
 *   회차가 바뀌면 실제 시험지 배점과 어긋날 수 있으므로 재확인 대상이다.
 *
 * 바뀌면 고칠 자리는 여기 하나다 — 채점·집계·병합 검증이 모두 이 값을 읽는다.
 */
export const PRACTICAL_FORMAT: Record<string, PracticalFormat> = {
  정처기: { total: 20, minutes: 150, pass: 60, uniformPoint: 5 },
  정보보안기사: {
    total: 18,
    minutes: 180,
    pass: 60,
    composition: [
      { kind: "단답형", asked: 12, points: 3 },
      { kind: "서술형", asked: 4, points: 12 },
      { kind: "실무형", asked: 2, choose: 1, points: 16 },
    ],
    partialCredit: ["단답형"],
  },
};

/**
 * 문자열 대조로 채점할 수 없어 사용자가 스스로 매기는 유형.
 * 이 목록의 정의를 여기 두는 이유는 소비처 셋이 모두 이 파일에만 닿을 수 있어서다 —
 * 스키마(content.config.ts)·화면의 클라이언트 스크립트·병합 스크립트.
 * 자가 채점 유형을 늘릴 때 고칠 자리는 여기 하나다.
 */
export const SELF_GRADED = ["약술형", "서술형", "실무형"] as const;
export const isSelfGraded = (kind: string): boolean => (SELF_GRADED as readonly string[]).includes(kind);

/** 한 문항의 채점 결과 — 점수 계산에 필요한 것만 추린 모양 */
export type ScoredQuestion = { kind: string; ok: boolean; ratio: number };

/** 유형별 배점. 균일 배점 시험은 유형을 보지 않는다 */
const pointsOf = (fmt: PracticalFormat, kind: string): number =>
  fmt.uniformPoint ?? fmt.composition?.find((c) => c.kind === kind)?.points ?? 0;

/** 만점 — 선택 문항이 있는 유형은 실제로 채점되는 수만 센다 */
export const maxPoints = (fmt: PracticalFormat): number =>
  fmt.uniformPoint !== undefined
    ? fmt.uniformPoint * fmt.total
    : (fmt.composition ?? []).reduce((sum, c) => sum + (c.choose ?? c.asked) * c.points, 0);

/**
 * 모의고사 점수 집계.
 *
 * 두 가지가 균일 배점 시험과 다르다.
 *   1) 부분 점수 — partialCredit에 든 유형은 답란을 맞힌 비율만큼 받는다.
 *   2) 선택 문항 — 실무형처럼 choose가 있는 유형은 제시된 것 중 잘한 것부터 choose개만 센다.
 *      실제 시험에서 응시자가 유리한 쪽을 골라 답하는 것과 같은 결과가 된다.
 */
export const scoreSession = (
  graded: ScoredQuestion[],
  fmt: PracticalFormat,
): { points: number; max: number; pass: boolean } => {
  const earn = (g: ScoredQuestion) => {
    const p = pointsOf(fmt, g.kind);
    return fmt.partialCredit?.includes(g.kind) ? p * g.ratio : g.ok ? p : 0;
  };

  let points = 0;
  const chooseKinds = new Map((fmt.composition ?? []).filter((c) => c.choose).map((c) => [c.kind, c.choose!]));
  for (const g of graded) if (!chooseKinds.has(g.kind)) points += earn(g);
  for (const [kind, take] of chooseKinds) {
    const best = graded
      .filter((g) => g.kind === kind)
      .map(earn)
      .sort((a, b) => b - a)
      .slice(0, take);
    points += best.reduce((a, b) => a + b, 0);
  }

  points = Math.round(points);
  const max = maxPoints(fmt);
  return { points, max, pass: points >= fmt.pass };
};
