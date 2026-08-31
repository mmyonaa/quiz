import { getCollection } from "astro:content";
import {
  AREAS_BY_EXAM,
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
 * 실기 문항 로더 — 필기와 같은 91주제를 공유하므로 area·subject는 주제에서 풀어 얹는다.
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
