import { EXAM_FORMAT, EXAM_SLUGS, SUBJECT_SLUGS, TOPICS, examPath, type Topic } from "../../../../content.config";
import { DIAGRAMS } from "../../../../lib/diagrams";

/**
 * 주제별 도입부를 원본 마크다운으로 내주는 정적 엔드포인트.
 *
 * 화면에서 긁으면 형광펜·값칩·콜아웃·대조표가 렌더된 꼴로 섞여 나와 표기가 깨진다.
 * 그 글을 LLM에 물리거나 다른 노트로 옮기려면 md()에 들어간 그 문자열이 필요하다.
 *
 * 왜 엔드포인트인가 — 세 안을 재서 갈렸다(#145).
 *   · 도입부를 data 속성으로 선적재: 가장 무거운 영역에서 gzip +19.7KB(+14.1%).
 *     영역 페이지는 주제 수십 개를 한 화면에 세우므로 그만큼이 모든 방문에 실린다.
 *   · 클릭 때 DOM에서 역조립: 표기에서 손실이 생기고, 틀려도 조용히 틀린 마크다운이
 *     복사된다 — 복사 기능의 실패 모드로는 최악이다.
 *   · 엔드포인트: 페이지 무게 증가 0, 내용은 원본 문자열이라 손실이 없고,
 *     주소 자체를 AI에 넘길 수 있다. 비용은 이 파일 하나와 빌드 산출 137개다.
 *
 * 내보내는 것은 **도입부까지**다. 확인 문제와 정답을 실으면 이 주소가 주제 하나치
 * 정답표가 되어, 정답을 가려 두고 포스트잇 유출까지 게이트로 막는 것을 우회하는
 * 뒷문이 된다. 특정 문항을 묻고 싶은 사람은 그 문항을 복사하면 된다.
 */

/** 그림 참조(`^ 이름`)를 글로 바꾼다 — 이름만 건너가면 받는 쪽이 해석할 수 없다.
 *
 *  alt는 애초에 **그림을 못 보는 쪽에 내용을 전하려고** 쓴 글이고, 읽는 것이 LLM이면
 *  정확히 그 경우다. 계산 유형(페이지 교체·간트)은 그림이 예제 수치를 들고 있어
 *  치환하지 않으면 본문에 없는 수가 통째로 빠진다.
 *
 *  이름이 정의에 없으면 줄을 지운다 — 끊긴 이름을 남기는 것이 가장 나쁘다.
 *  (이름의 정합성은 content.config.ts의 게이트가 이미 보지만, 이 자리는 그 게이트가
 *  느슨해지는 날에도 거짓을 내보내지 않아야 한다.) */
const inlineDiagrams = (intro: string) =>
  intro.replace(/^\^ ([a-z0-9-]+)[ \t]*$/gm, (_, name: string) => {
    const d = DIAGRAMS[name];
    return d ? `그림 — ${d.alt} ${d.caption}` : "";
  });

/** 본문 앞에 서는 머리 — 어느 시험·과목·영역의 글인지와 원래 페이지 주소.
 *  받는 쪽이 글만 보고도 출처를 알 수 있어야 하고, 주소가 있으면 되돌아올 수 있다. */
const header = (topic: Topic, url: string) =>
  `# ${topic.title}\n\n${EXAM_FORMAT[topic.exam].label} · ${topic.subject} / ${topic.area}\n출처: ${url}`;

export function getStaticPaths() {
  return Object.entries(TOPICS).map(([key, topic]) => ({
    // 주제 키에는 시험이 적혀 있지 않다 — TOPICS가 DEFAULT_EXAM을 적용해 채운 exam을 쓴다.
    // 기본값을 여기서 다시 적으면 세 번째 복사본이 되고, 기본값이 갈리는 날 sec 주제가
    // 조용히 정처기 주소로 난다.
    params: { exam: EXAM_SLUGS[topic.exam], topic: key },
    props: { topic },
  }));
}

export const GET = ({ props, site }: { props: { topic: Topic }; site: URL | undefined }) => {
  const { topic } = props;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const page = `${base}${examPath(topic.exam)}/notes/s/${SUBJECT_SLUGS[topic.subject]}/`;
  const url = site ? new URL(page, site).href : page;
  const body = `${header(topic, url)}\n\n${inlineDiagrams(topic.intro).trim()}\n`;

  // 파일 이름이 .md로 끝나는 것은 이 헤더보다 중요하다 — 정적 호스팅은 빌드 산출물을
  // 제 매핑대로 내보내므로 여기서 적은 헤더가 운영에서는 쓰이지 않는다(개발 서버에서만 쓰인다).
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
};
