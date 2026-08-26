import { getCollection } from "astro:content";
import { AREAS, TOPICS } from "../content.config";

/**
 * 문제 은행 로더 — 모든 페이지가 같은 모양의 문항을 보게 하는 단일 진입점.
 *
 * 개념 글 링크는 문항이 아니라 주제의 속성이므로, 여기서 topic → post를 풀어
 * relatedPost로 얹어 준다. 덕분에 클라이언트 코드는 문항 하나만 보면 된다.
 */
export async function loadBank() {
  const entries = await getCollection("quiz");
  return entries.map((e) => ({ ...e.data, relatedPost: TOPICS[e.data.topic].post }));
}

/** 한 영역의 주제 목록 — topic-notes.json의 정의 순서(기초 → 심화)를 그대로 따른다. */
export function topicsOf(area: (typeof AREAS)[number]) {
  return Object.entries(TOPICS)
    .filter(([, t]) => t.area === area)
    .map(([key, t]) => ({ key, ...t }));
}
