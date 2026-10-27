import { getCollection } from "astro:content";
import {
  AREA_SLUGS,
  AREAS_BY_EXAM,
  PRACTICAL_KINDS,
  SUBJECTS_BY_EXAM,
  DEFAULT_EXAM,
  TOPICS,
  examPath,
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
 * 목차 검색이 훑을 텍스트로 다듬는다 — 소문자로 이어 붙이고 강조·블록 표기를 걷어낸다.
 *
 * 개념 그림 블록("^ 이름")은 글이 아니라 그림 참조다 — 슬러그가 검색어로 잡히면
 * "cycle"을 친 사람에게 글자 어디에도 없는 항목이 걸린다.
 */
const searchable = (parts: (string | undefined)[], body: string) => {
  const text = body
    .split("\n\n")
    .filter((b) => !b.startsWith("^ "))
    .join(" ");
  return [...parts, text]
    .filter(Boolean)
    .join(" ")
    .replace(/[=*`>|#]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
};

/**
 * 개념 노트 목차 검색이 훑을 텍스트 — 제목·별칭·도입부.
 * 본문(도입부)까지 검색되게 하되, 사이드 목차는 모든 노트 페이지에 실리므로 해설은 넣지 않는다(무게).
 */
export function topicSearchText(t: { title: string; intro: string; aliases?: string }) {
  return searchable([t.title, t.aliases], t.intro);
}

/**
 * 한 주제의 개념 노트 주소 — 영역 페이지의 그 주제 자리까지.
 *
 * 주제 앵커는 영역 안에서의 순번(#t<i>)이라 번호를 여기서 찾는다. 암기 카드와
 * 마이페이지가 같은 길을 쓰므로 여기 둔다 — 두 곳에 각자 두면 앵커 방식이 바뀔 때
 * 한쪽만 고쳐져 한 화면의 링크만 조용히 빗나간다.
 */
export function topicNoteHref(topicKey: string) {
  const t = TOPICS[topicKey];
  if (!t) return undefined;
  const i = topicsOf(t.area, t.exam).findIndex((x) => x.key === topicKey);
  if (i < 0) return undefined;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${examPath(t.exam)}/notes/${AREA_SLUGS[t.area]}/#t${i}`;
}

/**
 * 산문이 아닌 문단의 줄머리 — MdBlocks.astro가 펴는 블록 표기 전부다.
 * 콜아웃(`> `) · 대조표(`| `) · 흐름(`~ `) · 스택(`# `와 머리글을 단 `#= `) ·
 * 타일(`* `) · 그림(`^ `) · 목록(`- `). 하나라도 빠뜨리면 그 블록이 산문으로 집혀
 * 표기 기호가 발췌에 글자로 실린다 — 접두어가 늘면 여기도 같이 늘린다.
 */
const INTRO_BLOCK = /^(?:[>|~^*-] |#=? )/;
/** md()의 형광펜 — 여기서는 펴지 않고 짝이 갈렸는지 재는 데만 쓴다 */
const HL_PAIR = /==(?=\S)[^=\n]+(?<=\S)==/g;

/**
 * 도입부 한 입 — '저장한 개념' 카드가 "어느 주제의 개념인가"를 보여 주는 두어 문장.
 *
 * 블록 표기 문단은 건너뛰고 첫 산문 문단을 집는다. 카드는 md()로 인라인 강조만 펴므로,
 * 콜아웃·대조표·그림 참조가 걸리면 표기 기호가 그대로 글자로 드러난다.
 *
 * 문단을 통째로 들이지는 않는다 — 첫 산문 문단은 중앙값 `237`자에 최대 `916`자라
 * 긴 쪽이 걸리면 카드가 아니라 벽이 된다(2026-10-27, 주제 138개 실측). 문장 끝에서 자르고,
 * 자른 자리에서 형광펜이나 값 칩의 짝이 갈리면 다음 문장까지 더 집는다 — 짝이 깨지면
 * ==와 백틱이 화면에 글자로 나온다.
 */
export function introLead(intro: string, min = 120) {
  const prose = intro
    .split(/\n\n+/)
    .map((x) => x.trim())
    .find((x) => x && !INTRO_BLOCK.test(x));
  if (!prose) return "";
  const paired = (x: string) =>
    (x.match(/`/g)?.length ?? 0) % 2 === 0 && !x.replace(HL_PAIR, "").includes("==");
  // 마침표 뒤 공백에서만 끊는다 — 소수점(0.45)은 뒤에 공백이 없어 문장으로 갈리지 않는다
  let lead = "";
  for (const sentence of prose.split(/(?<=\.)\s+/)) {
    lead = lead ? `${lead} ${sentence}` : sentence;
    if (lead.length >= min && paired(lead)) break;
  }
  return lead.length < prose.length ? `${lead} …` : lead;
}

/**
 * 암기 노트 목차 검색이 훑을 텍스트 — 제목·두문자·카드 본문.
 *
 * 두문자는 가운뎃점을 뺀 꼴도 함께 넣는다. 카드에는 "물·데·네·전·세·표·응"으로 적혀 있지만
 * 외우는 사람은 "물데네전세표응"으로 읊어서, 적힌 그대로만 담아 두면 정작 두문자로는 못 찾는다.
 */
export function memoSearchText(m: { title: string; mnemonic?: string; body: string }) {
  const mn = m.mnemonic ?? "";
  return searchable([m.title, mn, mn.replace(/[\s·]+/g, "")], m.body);
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
