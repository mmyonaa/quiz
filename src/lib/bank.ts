import { getCollection } from "astro:content";
import {
  AREAS_BY_EXAM,
  PRACTICAL_KINDS,
  SUBJECTS_BY_EXAM,
  DEFAULT_EXAM,
  TOPICS,
  type Area,
  type Exam,
  type Subject,
} from "../content.config";

/**
 * 문제 은행 로더 — 모든 페이지가 같은 모양의 문항을 보게 하는 단일 진입점.
 *
 * 과목·개념 글 링크는 문항이 아니라 주제의 속성이므로, 여기서 topic을 풀어
 * subject와 relatedPost로 얹어 준다. 덕분에 클라이언트 코드는 문항 하나만 보면 된다.
 */
export async function loadBank() {
  const entries = await getCollection("quiz");
  return entries.map((e) => ({
    ...e.data,
    exam: TOPICS[e.data.topic].exam,
    subject: TOPICS[e.data.topic].subject,
    relatedPost: TOPICS[e.data.topic].post,
  }));
}

/**
 * 실기 문항 로더 — 필기와 같은 주제를 공유하므로 area·subject는 주제에서 풀어 얹는다.
 * 덕분에 실기 문항 JSON은 area를 중복해 적지 않아도 되고, 어긋날 여지도 없다.
 */
export async function loadPractical() {
  const entries = await getCollection("practical");
  return entries.map((e) => ({
    ...e.data,
    exam: TOPICS[e.data.topic].exam,
    area: TOPICS[e.data.topic].area,
    subject: TOPICS[e.data.topic].subject,
    topicTitle: TOPICS[e.data.topic].title,
    relatedPost: TOPICS[e.data.topic].post,
  }));
}

/**
 * 한 영역의 주제 목록 — topic-notes.json의 정의 순서(기초 → 심화)를 그대로 따른다.
 * 영역 이름은 시험마다 겹칠 수 있으므로(예: "네트워크") 시험까지 좁혀야 섞이지 않는다.
 */
export function topicsOf(area: Area, exam: Exam = DEFAULT_EXAM) {
  return Object.entries(TOPICS)
    .filter(([, t]) => t.exam === exam && t.area === area)
    .map(([key, t]) => ({ key, ...t }));
}

/**
 * 목차 검색이 훑을 텍스트 — 제목·별칭·도입부를 소문자로 이어 붙이고 강조 표기(==·**·` )를 걷어낸다.
 * 본문(도입부)까지 검색되게 하되, 사이드 목차는 모든 노트 페이지에 실리므로 해설은 넣지 않는다(무게).
 */
export function topicSearchText(t: { title: string; intro: string; aliases?: string }) {
  return [t.title, t.aliases ?? "", t.intro]
    .join(" ")
    .replace(/[=*`>|#]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/** 한 과목의 주제 목록 — 과목 안에서도 정의 순서를 유지한다. */
export function topicsOfSubject(subject: Subject, exam: Exam = DEFAULT_EXAM) {
  return Object.entries(TOPICS)
    .filter(([, t]) => t.exam === exam && t.subject === subject)
    .map(([key, t]) => ({ key, ...t }));
}

/** 과목 안에 실제로 등장하는 영역 목록 — 과목·영역이 다대다라 목차에서 함께 보여준다. */
export function areasOfSubject(subject: Subject, exam: Exam = DEFAULT_EXAM) {
  return (AREAS_BY_EXAM[exam] as readonly Area[]).filter((a) =>
    Object.values(TOPICS).some((t) => t.exam === exam && t.subject === subject && t.area === a),
  );
}

/** 한 시험의 과목 목록 — 라우트가 시험을 알게 되는 #27에서 쓴다 */
export function subjectsOf(exam: Exam = DEFAULT_EXAM) {
  return SUBJECTS_BY_EXAM[exam] as readonly Subject[];
}

/** 한 시험의 영역 목록 — subjectsOf와 짝을 이룬다 */
export function areasOf(exam: Exam = DEFAULT_EXAM) {
  return AREAS_BY_EXAM[exam] as readonly Area[];
}

/**
 * 실기 간판 유형 — 목차 카드가 "이 묶음은 실기에서 무엇으로 나오나"를 한 마디로 말하는 값.
 *
 * 문항 수는 쓰지 않는다. 실기 문항은 모든 주제에 하나씩 붙어 있어(영역별 주제당 1.0~1.3개)
 * "실기 19문항"은 주제 수를 다르게 적은 것일 뿐이기 때문이다. 실기가 필기와 갈리는 지점은
 * 범위가 아니라 꺼내는 방식이고, 그 차이는 수가 아니라 유형 분포에 있다.
 *
 * 단답형은 어느 영역에나 깔린 바탕이라 간판이 못 된다 — 걷어내고 남은 유형 중 눈에 띄는
 * 것만 올린다. 남는 게 없으면 그 영역의 실기는 정말 단답형이다(최다 유형으로 되돌아간다).
 */
const SIGNATURE_MIN_COUNT = 2; // 한 문항은 우연이다 — 7문항 중 1개를 간판으로 걸면 거짓말이 된다
const SIGNATURE_MIN_SHARE = 0.2; // 묶음의 1/5 이상
const SIGNATURE_MAX = 2; // 셋을 늘어놓으면 다시 안 읽힌다

export function practicalSignature(
  questions: readonly { kind: (typeof PRACTICAL_KINDS)[number] }[],
): (typeof PRACTICAL_KINDS)[number][] {
  if (questions.length === 0) return [];

  const count = new Map<(typeof PRACTICAL_KINDS)[number], number>();
  for (const q of questions) count.set(q.kind, (count.get(q.kind) ?? 0) + 1);

  // 동수일 때는 PRACTICAL_KINDS의 정의 순서로 가른다 — 빌드마다 간판이 바뀌면 안 된다
  const byRank = [...count].sort(
    (a, b) => b[1] - a[1] || PRACTICAL_KINDS.indexOf(a[0]) - PRACTICAL_KINDS.indexOf(b[0]),
  );

  const signature = byRank
    .filter(
      ([kind, n]) =>
        kind !== "단답형" && n >= SIGNATURE_MIN_COUNT && n / questions.length >= SIGNATURE_MIN_SHARE,
    )
    .slice(0, SIGNATURE_MAX)
    .map(([kind]) => kind);

  // 간판이 될 유형이 없으면 최다 유형 하나. 보통 단답형이지만 단답형이 아예 없는 묶음도 있어
  // "단답형"을 못 박아 두면 없는 유형을 적게 된다.
  return signature.length > 0 ? signature : [byRank[0][0]];
}
