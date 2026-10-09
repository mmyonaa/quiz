import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import topicNotes from "./data/topic-notes.json";
import memoNotes from "./data/memo-notes.json";
import blogSeeds from "./data/blog-seeds.json";
import { PRACTICAL_FORMAT, SELF_GRADED, isSelfGraded } from "./lib/practical-grade";
import { DIAGRAMS } from "./lib/diagrams";

/**
 * 문제 은행 스키마 — 발행 게이트 역할(블로그 publish_post의 검증과 같은 철학).
 * 스키마 위반 문제는 빌드가 실패하므로, 깨진 문제가 사이트에 실리지 않는다.
 * 문제는 기출 복제가 아니라 daily.mcp 글 기반의 자체 제작 문항이다.
 */

/**
 * 시험 축 — 이 사이트가 다루는 자격 시험. 영역·과목·시험 형식이 전부 시험에 매달린다.
 * 문항은 시험을 직접 갖지 않는다 — 주제(topic)가 갖고 문항은 주제를 통해 물려받는다.
 * 분류축을 한 군데(주제)에만 두는 것이 이 레포의 일관된 선택이다(과목·영역도 같은 방식).
 */
export const EXAMS = ["정처기", "정보보안기사"] as const;
export type Exam = (typeof EXAMS)[number];

/** 기본 시험 — 기존 URL(/notes/…)과 topic-notes.json의 exam 생략 시 값 */
export const DEFAULT_EXAM = "정처기" satisfies Exam;

/**
 * 시험별 영역 — 문항을 주제별로 묶는 큰 갈래. 과목과는 다대다다.
 * 정보보안기사는 5과목(SUBJECTS_BY_EXAM)과 영역이 다대다다 — '정보보안 일반'이 보안 일반과 암호학
 * 둘로 갈리고, 나머지 세 과목은 같은 이름의 영역과 1:1로 대응한다(#28).
 */
export const AREAS_BY_EXAM = {
  정처기: ["운영체제", "네트워크", "데이터베이스", "소프트웨어공학", "정보보안", "프로그래밍"],
  정보보안기사: ["보안 일반", "암호학", "시스템 보안", "네트워크 보안", "애플리케이션 보안", "보안관리·법규"],
} as const satisfies Record<Exam, readonly string[]>;

/**
 * 시험별 과목 — 실제 필기의 과목 구성. 과목당 20문항, 과목별 40점 미만이면 과락.
 * 정처기는 영역과 다대다다(소프트웨어공학은 1·2·5과목에, 프로그래밍은 2·4과목에 걸친다).
 * 그래서 과목은 영역이 아니라 주제(topic)에 붙는다.
 */
export const SUBJECTS_BY_EXAM = {
  정처기: [
    "소프트웨어 설계",
    "소프트웨어 개발",
    "데이터베이스 구축",
    "프로그래밍 언어 활용",
    "정보시스템 구축 관리",
  ],
  정보보안기사: [
    "시스템 보안",
    "네트워크 보안",
    "애플리케이션 보안",
    "정보보안 일반",
    "정보보안 관리 및 법규",
  ],
} as const satisfies Record<Exam, readonly string[]>;

export type Area = (typeof AREAS_BY_EXAM)[Exam][number];
export type Subject = (typeof SUBJECTS_BY_EXAM)[Exam][number];

/**
 * 시험별 URL 접두어. 정처기는 접두어가 없다 — 기존 URL(/notes/…)이 이미 색인돼 있고
 * SEO 일감(#10~#14)이 그 위에 서 있어 바꾸면 안 된다. 라우트는 rest 파라미터([...exam])로
 * 받으므로 undefined면 그 segment가 통째로 사라진다.
 */
export const EXAM_SLUGS: Record<Exam, string | undefined> = {
  정처기: undefined,
  정보보안기사: "sec",
};

/** 시험의 URL 접두어 조각 — `${base}${examPath(exam)}/notes/…` 형태로 쓴다 */
export const examPath = (exam: Exam) => (EXAM_SLUGS[exam] ? `/${EXAM_SLUGS[exam]}` : "");

/** 영역별 URL 슬러그 — 개념 노트 상세 라우팅(/notes/<slug>/)에 쓴다 */
export const AREA_SLUGS: Record<Area, string> = {
  운영체제: "os",
  네트워크: "network",
  데이터베이스: "database",
  소프트웨어공학: "software",
  정보보안: "security",
  프로그래밍: "programming",
  "보안 일반": "basics",
  암호학: "crypto",
  "시스템 보안": "system",
  "네트워크 보안": "network",
  "애플리케이션 보안": "application",
  "보안관리·법규": "governance",
};

/** 과목별 URL 슬러그 — 개념 노트 과목 라우팅(/notes/s/<slug>/)에 쓴다 */
export const SUBJECT_SLUGS: Record<Subject, string> = {
  "소프트웨어 설계": "design",
  "소프트웨어 개발": "dev",
  "데이터베이스 구축": "database",
  "프로그래밍 언어 활용": "language",
  "정보시스템 구축 관리": "management",
  "시스템 보안": "system",
  "네트워크 보안": "network",
  "애플리케이션 보안": "application",
  "정보보안 일반": "general",
  "정보보안 관리 및 법규": "governance",
};

/**
 * 시험 형식 — 필기·실기의 문항 수·시간·합격 기준.
 * 정처기와 정보보안기사는 **필기 구조가 같다**(과목당 20문항 · 과락 40 · 평균 60 · 150분).
 * 실기는 다르다 — 정처기는 20문항 × 5점 균일이고, 정보보안기사는 배점이 유형마다 다르며
 * 실무형 2문항 중 1문항을 골라 답한다(출제 18문항 / 채점 17문항). 근거는 #33.
 * 실기 쪽 값은 채점기(lib/practical-grade.ts)가 단일 정의를 갖고 여기서는 가져다 쓴다 —
 * 그 파일은 브라우저로도 번들되므로 astro:content를 끌어오는 이 파일에 의존할 수 없다.
 */
export const EXAM_FORMAT = {
  정처기: {
    label: "정보처리기사",
    written: { perSubject: 20, minutes: 150, subjectPass: 40, averagePass: 60 },
    practical: PRACTICAL_FORMAT.정처기,
  },
  정보보안기사: {
    label: "정보보안기사",
    written: { perSubject: 20, minutes: 150, subjectPass: 40, averagePass: 60 },
    practical: PRACTICAL_FORMAT.정보보안기사,
  },
} as const satisfies Record<Exam, unknown>;

/** 난이도 단계 — 하(정의·단순 매칭), 중(유사 개념 구분·함정), 상(계산·다단계 추론) */
export const DIFFICULTIES = ["하", "중", "상"] as const;

/**
 * 기본 시험의 영역·과목 — 라우트가 아직 시험을 모르므로(#27이 맡는다) 여기서 풀어 둔다.
 * 시험을 가려 써야 하는 자리는 AREAS_BY_EXAM·SUBJECTS_BY_EXAM을 직접 본다.
 */
export const AREAS = AREAS_BY_EXAM[DEFAULT_EXAM];
export const SUBJECTS = SUBJECTS_BY_EXAM[DEFAULT_EXAM];

/** 모든 시험의 영역을 합친 목록 — 문항 스키마가 쓴다(시험별 정합성은 주제와 대조해 따로 본다) */
const ALL_AREAS = [...new Set(EXAMS.flatMap((e) => AREAS_BY_EXAM[e] as readonly string[]))] as [string, ...string[]];

/**
 * 개념 주제 — 개념 노트의 단위이자 문항의 분류축.
 * 정의는 src/data/topic-notes.json 하나에 모인다(제목·도입부·연결 글).
 * 블로그 글(post)은 주제의 선택적 속성 — 글이 없는 주제도 도입부로 완결된다.
 */
export type Topic = {
  /** 소속 시험 — JSON에서 생략하면 DEFAULT_EXAM이다(91개 주제에 같은 값을 91번 적지 않는다) */
  exam: Exam;
  subject: Subject;
  area: Area;
  title: string;
  intro: string;
  post?: string;
  /** 목차 검색용 별칭 — 제목·도입부에 없는 약어·영문·동의어를 공백으로 이어 적는다(예: "windows ntfs mft"). */
  aliases?: string;
};
/**
 * JSON을 import하면 subject·area가 리터럴 유니온이 아니라 string으로 넓어져 타입이 맞지 않는다.
 * 타입은 단언으로 좁히되, 실제 검사는 바로 아래 런타임 게이트가 맡는다 — 단언을 믿는 게 아니라
 * 값을 직접 확인하는 쪽이 오타를 잡는 유일한 수단이다.
 */
export const TOPICS: Record<string, Topic> = Object.fromEntries(
  Object.entries(topicNotes as Record<string, Omit<Topic, "exam"> & { exam?: Exam }>).map(([key, t]) => [
    key,
    { exam: DEFAULT_EXAM, ...t },
  ]),
);
const TOPIC_KEYS = Object.keys(TOPICS) as [string, ...string[]];

/**
 * 강조 표기 규칙 — 표기법은 src/lib/md.ts가 정의하고, 지켜지는지는 여기가 본다.
 * 규칙을 문서에만 두었더니 137개 주제 중 100개가 강조 없이 평평하게 쓰였다(#60).
 * 사람이 읽어야 지켜지는 규칙은 지켜지지 않는다 — 빌드가 막는다.
 *
 * 백틱만 짝을 검사한다. **는 포인터 *p·COUNT(*)·마스킹 900101-1******처럼 본문에서
 * 홑으로 쓰여 짝 검사가 성립하지 않고, ==는 C 관계 연산자와 글자가 겹친다(c-operators).
 * 백틱은 이 데이터에서 값 칩으로만 쓰이므로 홀수면 곧 결함이다.
 */
const HIGHLIGHT = /==(?=\S)([^=\n]+)(?<=\S)==/g;
/** 형광펜이 이보다 길면 '표시'가 아니라 노란 문단이 되어 눈이 다시 갈 곳을 잃는다 */
const HIGHLIGHT_MAX = 100;
/**
 * 개수 상한 — 이게 없으면 게이트는 "칠했는가"만 보고 "무엇을 칠했는가"를 못 본다.
 * 실제로 그렇게 됐다: 강조 체계(#67) 이후 쓰인 정보보안기사 콘텐츠는 한 커밋에서
 * 해설 130개에 형광펜 124개가 한꺼번에 들어갔고(4bf7d6f), 신규 50문항에는 53개 —
 * 문항당 하나꼴로 기계적으로 붙었다. 통과 조건이 "칠하면 통과"였기 때문이다.
 * 결과는 영역당 해설의 31~64%가 노란색인 화면이고, 그러면 강조가 강조를 죽인다.
 *
 * 무엇을 칠했는지는 기계가 못 본다. 대신 몇 개를 칠했는지는 본다 — 상한이 좁으면
 * 고를 수밖에 없고, 고르려면 무엇이 함정인지 생각하게 된다.
 */
const HIGHLIGHT_PER_INTRO = 2;
/** 해설은 이미 짧고 초점이 하나다 — 둘을 칠하면 초점이 둘이 되어 어느 쪽도 서지 않는다 */
const HIGHLIGHT_PER_EXPLANATION = 1;
export const countHighlights = (s: string) => [...s.matchAll(HIGHLIGHT)].length;
export const unpairedBacktick = (s: string) => ((s.match(/`/g) ?? []).length & 1) === 1;
/** 상한을 넘는 형광펜을 찾아 돌려준다(없으면 undefined) — 도입부와 해설이 같은 자를 쓴다 */
export const overlongHighlight = (s: string) => {
  for (const [, body] of s.matchAll(HIGHLIGHT)) if (body.length > HIGHLIGHT_MAX) return body;
  return undefined;
};

/**
 * 개념 포스트잇(concept)이 정답을 흘리는지 본다.
 *
 * 포스트잇은 문제 바로 위에 선다. 그 자리에 정답 용어가 적혀 있으면 확인 문제가
 * 확인을 못 한다 — 떠올리는 대신 위를 보고 옮겨 적게 된다. 실제로 그렇게 됐다:
 * concept을 가진 813문항 중 98개에서 포스트잇이 정답 선지의 정의문이었고,
 * 발문은 그 정의를 되물었다(#112). 해설을 가렸던 것과 같은 결함이 한 칸 위에 있었다.
 *
 * 그래서 포스트잇은 **정답 낱말을 비우고 축을 세운다** — 무엇으로 갈리는 문제인지만
 * 말하고, 갈래의 이름은 읽는 쪽이 채운다. 기계는 그 축이 좋은지는 못 보지만,
 * 정답 선지가 그대로 들어 있는지는 본다.
 */
const normalizeForLeak = (s: string) =>
  s
    .replace(/[=*`]/g, "")
    .replace(/[()\[\]{}·,.\/\-—–'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** 정답 선지가 포스트잇에 통째로 들어 있으면 그 선지를 돌려준다(없으면 undefined) */
export const leakedAnswer = (concept: string | undefined, choices: string[], answer: number) => {
  if (!concept) return undefined;
  const ans = normalizeForLeak(choices[answer] ?? "");
  // 짧은 정답("A"·"MX"·"21번")은 축을 설명하는 문장에 우연히 섞일 수 있어 자를 대지 않는다 —
  // 그런 문항은 리포트(written-merge.mjs --report)의 겹침 쪽에서 걸러 본다.
  if (ans.length < 4) return undefined;
  return normalizeForLeak(concept).includes(ans) ? choices[answer] : undefined;
};

/**
 * 칸이 있는 블록은 칸 수가 줄마다 같아야 한다 — 어긋나면 표가 조용히 어긋난 채로 그려진다(도입부·암기 카드 공용).
 * 대조표("| ")와 계층 스택("# "/"#= ")은 모든 줄의 칸 수가 같아야 하고, 타일("* ")은 "이름 | 설명" 두 칸이다.
 * 한 블록 안에서 줄머리가 섞이면(목록 줄 사이에 타일 줄) 그 줄은 다른 종류로 그려지므로 그것도 막는다.
 */
const cellCount = (r: string) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").length;
const checkTables = (label: string, text: string) => {
  for (const block of text.split("\n\n")) {
    const rows = block.split("\n");
    if (block.startsWith("| ")) {
      const ns = rows.map(cellCount);
      if (rows.length < 2) throw new Error(`${label}의 대조표에 머리글만 있고 줄이 없음`);
      if (new Set(ns).size > 1)
        throw new Error(`${label}의 대조표 칸 수가 줄마다 다름(${ns.join("·")}) — 모든 줄의 칸 수가 같아야 한다`);
    } else if (block.startsWith("# ") || block.startsWith("#= ")) {
      if (!rows.every((r) => r.startsWith("# ") || r.startsWith("#= ")))
        throw new Error(`${label}의 계층 스택에 "# "로 시작하지 않는 줄이 섞여 있음`);
      const ns = rows.map((r) => cellCount(r.replace(/^#=? /, "")));
      if (new Set(ns).size > 1)
        throw new Error(`${label}의 계층 스택 칸 수가 줄마다 다름(${ns.join("·")})`);
    } else if (block.startsWith("* ")) {
      if (!rows.every((r) => r.startsWith("* ") && cellCount(r.slice(2)) === 2))
        throw new Error(`${label}의 타일은 모든 줄이 "* 이름 | 설명" 두 칸이어야 함`);
    } else if (block.startsWith("~ ") || block.startsWith("- ")) {
      const mark = block.slice(0, 2);
      if (!rows.every((r) => r.startsWith(mark)))
        throw new Error(`${label}의 "${mark.trim()}" 블록에 다른 줄머리가 섞여 있음 — 빈 줄로 블록을 나눈다`);
    }
  }
};

/**
 * 개념 그림("^ 이름") — 이름이 실존 그림을 가리켜야 하고, 한 본문에 하나여야 한다.
 *
 * 이름 검사는 번역표(blog-seeds)와 같은 이유다 — 가리키는 곳이 사라진 참조는 조용히 빈
 * 자리로 그려지는 것이 가장 나쁘다. 개수 상한은 형광펜과 같은 이유다: 그림은 강조 층 중
 * 가장 무거워서, 주제마다 하나씩 붙으면 #67 이전의 "굵게 13개"가 그림으로 재현된다.
 * 게이트는 **무엇을 그렸는지는 못 본다** — 하나로 좁혀 고르게 만들 뿐이다.
 */
/**
 * 그림 자체의 게이트 — 캡션에 형광펜을 두지 않는다.
 *
 * 캡션은 도입부 밖이라 형광펜을 칠해도 도입부 상한(2개)에 안 잡힌다. 그런데 화면에서는
 * 같은 노란 띠로 보이므로, 막지 않으면 상한을 우회하는 길이 하나 열린 셈이 된다.
 * 애초에 캡션은 그림 아래 한 줄이라 이미 초점이 하나다 — 그림이라는 가장 무거운 강조
 * 바로 밑에서 또 칠하면 둘 다 죽는다. 값 칩(`값`)은 둘 수 있다(도입부와 같은 값을
 * 같은 모양으로 보여야 "외울 값"이라는 신호가 흐려지지 않는다).
 */
for (const [name, d] of Object.entries(DIAGRAMS)) {
  if (!d.alt || !d.caption) throw new Error(`개념 그림 ${name}에 alt나 caption이 없음 — 눈으로 못 보는 쪽과 들고 갈 한 줄이 둘 다 필요하다`);
  if (countHighlights(d.caption))
    throw new Error(`개념 그림 ${name}의 캡션에 형광펜이 있음 — 그림 밑에서 또 칠하면 둘 다 죽는다(값 칩은 둘 수 있다)`);
  if (unpairedBacktick(d.caption)) throw new Error(`개념 그림 ${name}의 캡션에 백틱 짝이 맞지 않음`);
}

const checkDiagrams = (label: string, text: string) => {
  const names = text
    .split("\n\n")
    .filter((b) => b.startsWith("^ "))
    .map((b) => b.trim());
  if (names.length > 1)
    throw new Error(`${label}에 개념 그림이 ${names.length}개 — 본문당 하나다(둘이면 어느 쪽도 보지 않는다)`);
  for (const line of names) {
    if (line.includes("\n")) throw new Error(`${label}의 개념 그림 블록이 여러 줄 — "^ 이름" 한 줄이어야 한다`);
    const name = line.slice(2).trim();
    if (!DIAGRAMS[name])
      throw new Error(`${label}이 없는 개념 그림을 가리킴: ${name} — lib/diagrams.ts에 두거나 이름을 맞춘다`);
  }
};

/**
 * 번역표(blog-seeds.json)의 값은 실존 주제 키여야 한다.
 *
 * 블로그 시드 → 주제 연결은 블로그가 아니라 이쪽이 든다(블로그는 부가 서비스 때문에 바뀌지
 * 않는다). 그래서 주제 키를 바꾸거나 주제를 지우면 번역표가 가리키는 곳이 사라지는데,
 * --link는 모르는 키를 만나면 조용히 유사도로 내려가 버린다 — 결정적이어야 할 경로가 추측으로
 * 바뀌는 것을 알려줄 자리가 여기뿐이다.
 */
for (const [seed, value] of Object.entries(blogSeeds as Record<string, string | string[]>)) {
  for (const key of Array.isArray(value) ? value : [value]) {
    if (!TOPIC_KEYS.includes(key))
      throw new Error(`번역표(blog-seeds.json)의 시드 ${seed}가 없는 주제를 가리킴: ${key}`);
  }
}

/** 주제 정의가 깨지면(시험·과목·영역 오타, 강조 표기 위반) 빌드에서 잡는다 */
for (const [key, t] of Object.entries(TOPICS)) {
  if (!EXAMS.includes(t.exam)) throw new Error(`주제 ${key}의 exam이 잘못됨: ${t.exam}`);
  const subjects = SUBJECTS_BY_EXAM[t.exam] as readonly string[];
  const areas = AREAS_BY_EXAM[t.exam] as readonly string[];
  if (!subjects.includes(t.subject)) throw new Error(`주제 ${key}의 subject가 ${t.exam}에 없음: ${t.subject}`);
  if (!areas.includes(t.area)) throw new Error(`주제 ${key}의 area가 ${t.exam}에 없음: ${t.area}`);
  if (unpairedBacktick(t.intro))
    throw new Error(`주제 ${key}의 도입부에 백틱 짝이 맞지 않음 — 값 칩 대신 백틱 글자가 화면에 그대로 나온다`);
  const long = overlongHighlight(t.intro);
  if (long)
    throw new Error(
      `주제 ${key}의 형광펜이 ${long.length}자(상한 ${HIGHLIGHT_MAX}) — 설명구는 본문에 두고 외울 낱말에만 칠한다: "${long.slice(0, 40)}…"`,
    );
  // 강조 아무거나가 아니라 형광펜을 센다 — **·백틱으로도 통과하던 탓에 도입부 5개가
  // 형광펜 없이 지나갔다(sec-cia-triad 등). "들고 갈 한 줄"은 형광펜만 세울 수 있다.
  const hl = countHighlights(t.intro);
  if (hl === 0)
    throw new Error(`주제 ${key}의 도입부에 형광펜이 없음 — 이 주제에서 하나만 들고 간다면 무엇인지 ==형광펜==으로 한 줄 칠한다`);
  if (hl > HIGHLIGHT_PER_INTRO)
    throw new Error(
      `주제 ${key}의 도입부에 형광펜이 ${hl}개(상한 ${HIGHLIGHT_PER_INTRO}) — 열거를 전부 칠하지 말고 그중 함정 하나만 남긴다`,
    );
  checkTables(`주제 ${key}`, t.intro);
  checkDiagrams(`주제 ${key}`, t.intro);
}

/**
 * 암기 노트 — 개념 노트 옆의 두 번째 노트. 줄글 없이 외울 것만 두문자·표·목록으로 모은 카드다.
 * 정의는 src/data/memo-notes.json 하나에 모이고, 본문은 개념 도입부와 같은 블록 표기·강조 3층을
 * 쓴다(렌더러도 MdBlocks 하나를 같이 쓴다). 문항은 붙지 않는다 — 읽고 가리고 떠올리는 용도다.
 *
 * 카드는 **시험·영역을 직접 들지 않는다**. 요약하는 개념 주제(topic)를 들고 거기서 물려받는다 —
 * 문항이 그러는 것과 같은 방식이고, 분류축을 한 군데에만 두는 이 레포의 일관된 선택이다.
 *
 * 그래서 한 카드가 두 시험에 함께 설 수 있다. 주제를 시험마다 하나씩 들면 본문 한 벌이 양쪽
 * 화면에 나가고, 영역은 각 시험의 주제를 따라 달라진다(OSI 카드는 정처기에서 '네트워크',
 * 정보보안기사에서 '네트워크 보안'에 선다). 처음엔 시험별로 카드를 한 벌씩 복사해 두었는데
 * 14쌍 6,744자가 글자 단위로 같았다 — 한쪽만 고치면 조용히 어긋나는 모양이라 접었다(#92).
 */
export type Memo = {
  /** 이 카드가 요약하는 개념 주제 — 시험당 하나. 시험·영역·과목·연결 글이 전부 여기서 나온다 */
  topics: string[];
  title: string;
  /** 두문자·외우기 구절(선택) — 카드 제목 옆에 칩으로 붙는다 */
  mnemonic?: string;
  body: string;
};
export const MEMOS = memoNotes as Record<string, Memo>;

/**
 * 한 시험의 암기 카드 — 그 시험의 주제를 가진 카드만 추려 정의 순서대로 돌려준다.
 * 영역·과목·연결 글은 주제에서 풀어 얹는다(문항 로더가 하는 일과 같다).
 */
export const memosOf = (exam: Exam) =>
  Object.entries(MEMOS).flatMap(([key, m]) => {
    const tk = m.topics.find((t) => TOPICS[t]?.exam === exam);
    if (!tk) return [];
    const t = TOPICS[tk];
    return [{ key, ...m, topic: tk, topicTitle: t.title, area: t.area, subject: t.subject, post: t.post }];
  });
/** 암기 노트가 있는 시험 — 라우트와 헤더 메뉴가 이 목록만 낸다(없는 시험에 빈 페이지를 내지 않는다) */
export const MEMO_EXAMS = EXAMS.filter((e) => memosOf(e).length > 0);

/**
 * 암기 카드 게이트 — 도입부와 같은 자를 쓴다(백틱 짝 · 100자 형광펜 · 카드당 형광펜 2개 · 표 칸 수).
 * 다른 점 하나: 형광펜 0개를 허용한다. 포트 번호 표처럼 카드 전체가 '외울 값'인 것은
 * 형광펜을 둘 자리가 없다 — 억지로 한 줄을 칠하면 표가 아니라 그 줄만 외우게 된다.
 *
 * 주제 쪽은 둘을 본다 — 없는 주제를 쓰지 않았는가, 한 시험의 주제를 둘 이상 들지 않았는가.
 * 뒤엣것을 놓치면 같은 카드가 한 화면에 두 번 선다.
 */
for (const [key, m] of Object.entries(MEMOS)) {
  if (!m.topics?.length) throw new Error(`암기 카드 ${key}에 주제가 없음 — 시험·영역이 주제에서 나온다`);
  const seen = new Set<Exam>();
  for (const tk of m.topics) {
    const t = TOPICS[tk];
    if (!t) throw new Error(`암기 카드 ${key}의 주제 ${tk}가 topic-notes.json에 없음`);
    if (seen.has(t.exam))
      throw new Error(`암기 카드 ${key}가 ${t.exam}의 주제를 둘 이상 가짐 — 시험당 하나여야 한 번만 선다`);
    seen.add(t.exam);
  }
  if (unpairedBacktick(m.body + (m.mnemonic ?? "")))
    throw new Error(`암기 카드 ${key}의 백틱 짝이 맞지 않음 — 값 칩 대신 백틱 글자가 화면에 그대로 나온다`);
  const long = overlongHighlight(m.body);
  if (long)
    throw new Error(`암기 카드 ${key}의 형광펜이 ${long.length}자(상한 ${HIGHLIGHT_MAX}): "${long.slice(0, 40)}…"`);
  const hl = countHighlights(m.body);
  if (hl > HIGHLIGHT_PER_INTRO)
    throw new Error(`암기 카드 ${key}의 형광펜이 ${hl}개(상한 ${HIGHLIGHT_PER_INTRO}) — 함정 짝 하나만 남긴다`);
  checkTables(`암기 카드 ${key}`, m.body);
  checkDiagrams(`암기 카드 ${key}`, m.body);
}

const quiz = defineCollection({
  loader: file("src/data/questions.json"),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9-]+$/, "id는 영문 kebab-case"),
      /** 두 시험의 영역을 합쳐 받는다 — 시험별 정합성은 아래 refine이 주제와 대조해 본다 */
      area: z.enum(ALL_AREAS),
      /** 난이도 — 필수 필드라 라벨 누락 문항은 빌드가 잡는다 */
      difficulty: z.enum(DIFFICULTIES),
      /** 소속 개념 주제 — topic-notes.json에 없는 주제를 쓰면 빌드가 실패한다 */
      topic: z.enum(TOPIC_KEYS),
      /**
       * 문항이 짚는 객관적 개념 한 줄(선택) — 개념 노트에서 문제 위에 먼저 놓인다.
       * "개념 → 문제 → 상세 해설" 구조의 머리. 없으면 문제부터 바로 보인다(점진 도입).
       */
      concept: z.string().min(2).optional(),
      question: z.string().min(10),
      /**
       * 제시문 블록 — 고정폭 <pre>로 렌더(선택). 기출의 박스 제시문에 대응한다:
       * 코드와 [실행결과], [조건]·[SQL문], 표 형태 데이터, 용어를 고르게 하는 특징 불릿 등.
       */
      code: z.string().optional(),
      /** 4지선다 고정 — 정처기 필기 형식 */
      choices: z.array(z.string().min(1)).length(4),
      /** 정답 선지 인덱스(0~3) */
      answer: z.number().int().min(0).max(3),
      explanation: z.string().min(20, "해설은 오답 학습의 핵심 — 20자 이상"),
    })
    .strict()
    // 문항의 영역과 주제의 영역이 어긋나면(주제 재배치 실수) 빌드에서 잡는다
    .refine((q) => TOPICS[q.topic].area === q.area, {
      message: "문항의 area가 topic의 area와 다릅니다",
      path: ["topic"],
    })
    // 발문·해설·포스트잇 모두 md()를 거치므로 백틱이 홀수면 백틱 글자가 화면에 그대로 나온다
    .refine((q) => !unpairedBacktick(q.question + q.explanation + (q.concept ?? "")), {
      message: "발문·해설·개념의 백틱 짝이 맞지 않습니다",
      path: ["explanation"],
    })
    // 포스트잇이 정답 선지를 그대로 품으면 확인 문제가 확인을 못 한다
    .refine((q) => !leakedAnswer(q.concept, q.choices, q.answer), {
      message:
        "개념 포스트잇이 정답 선지를 그대로 품고 있습니다 — 정답 낱말을 비우고 '무엇으로 갈리는 문제인지'만 세웁니다",
      path: ["concept"],
    })
    // 해설의 형광펜도 도입부와 같은 상한을 쓴다 — 길면 표시가 아니라 문단이 된다
    .refine((q) => !overlongHighlight(q.question + "\n" + q.explanation), {
      message: `발문이나 해설의 형광펜이 ${HIGHLIGHT_MAX}자를 넘습니다 — 함정을 말하는 구절만 칠합니다`,
      path: ["explanation"],
    })
    // 해설의 형광펜은 '오답의 뿌리' 한 군데뿐 — 영역 전체 밀도는 written-merge.mjs --report가 본다
    .refine((q) => countHighlights(q.question + "\n" + q.explanation) <= HIGHLIGHT_PER_EXPLANATION, {
      message: `해설의 형광펜이 ${HIGHLIGHT_PER_EXPLANATION}개를 넘습니다 — 오답의 뿌리를 짚는 한 구절만 남깁니다`,
      path: ["explanation"],
    }),
});

/**
 * 실기 문항 유형 — 보기가 없고 답을 직접 쓰므로 채점 방식이 유형마다 다르다.
 * 단답형·계산형·코드형·SQL형은 문자열 대조로 자동 채점하고, 약술형·서술형·실무형은 자가 채점한다.
 *
 * 서술형·실무형은 정보보안기사 실기의 유형이다(#33). 정처기 실기에는 나오지 않지만,
 * 유형 목록은 시험이 아니라 문항 스키마에 붙으므로 한 벌로 둔다 — 어느 유형이 몇 문항
 * 몇 점인지는 시험 형식(PRACTICAL_FORMAT)이 따로 정한다.
 */
export const PRACTICAL_KINDS = ["단답형", "계산형", "코드형", "SQL형", "약술형", "서술형", "실무형"] as const;

const practical = defineCollection({
  loader: file("src/data/practical.json"),
  schema: z
    .object({
      /** 필기 문항 id와 섞이지 않게 p- 접두어를 강제한다(저장·오답 기록이 두 은행을 함께 다룬다) */
      id: z.string().regex(/^p-[a-z0-9-]+$/, "실기 문항 id는 p-로 시작하는 kebab-case"),
      /** 소속 개념 주제 — 필기와 같은 91주제를 공유해 개념 노트에 함께 붙는다 */
      topic: z.enum(TOPIC_KEYS),
      difficulty: z.enum(DIFFICULTIES),
      kind: z.enum(PRACTICAL_KINDS),
      question: z.string().min(10),
      /** 제시문 — 코드형·SQL형·계산형의 코드/조건 블록(고정폭 렌더) */
      code: z.string().optional(),
      /**
       * 답란별 허용 표기 — 바깥 배열이 답란(①②③ 다답형), 안쪽이 그 답란의 정답 표기 목록.
       * 예: [["교착상태", "데드락", "deadlock"]]. 표기 흔들림은 정규화 + 이 목록으로 흡수한다.
       * 약술형은 채점 대상이 아니므로 빈 배열을 허용한다.
       */
      answers: z.array(z.array(z.string().min(1)).min(1)),
      /** 답란 이름 — 다답형에서 무엇을 쓰는 칸인지 표시(예: ["①", "②"]). 길이는 answers와 같아야 한다 */
      labels: z.array(z.string().min(1)).optional(),
      /** 약술형 모범답안 — 자가 채점의 기준 */
      modelAnswer: z.string().optional(),
      /** 약술형 채점 키워드 — 포함 개수를 세어 자가 채점을 돕는다 */
      keywords: z.array(z.string().min(1)).optional(),
      explanation: z.string().min(20, "해설은 오답 학습의 핵심 — 20자 이상"),
    })
    .strict()
    .refine((q) => (isSelfGraded(q.kind) ? q.answers.length === 0 : q.answers.length > 0), {
      message: `${SELF_GRADED.join("·")}은 answers를 비우고, 나머지 유형은 답란을 하나 이상 둬야 합니다`,
      path: ["answers"],
    })
    .refine((q) => (isSelfGraded(q.kind) ? !!q.modelAnswer && !!q.keywords?.length : true), {
      message: `${SELF_GRADED.join("·")}은 modelAnswer와 keywords가 필요합니다`,
      path: ["modelAnswer"],
    })
    .refine((q) => !q.labels || q.labels.length === q.answers.length, {
      message: "labels 길이가 답란 수와 다릅니다",
      path: ["labels"],
    })
    .refine((q) => (q.kind === "코드형" || q.kind === "SQL형" ? !!q.code : true), {
      message: "코드형·SQL형은 제시문(code)이 필요합니다",
      path: ["code"],
    })
    // 발문·해설·모범답안도 md()를 거친다 — 백틱이 홀수면 백틱 글자가 화면에 그대로 나온다
    .refine((q) => !unpairedBacktick(q.question + q.explanation + (q.modelAnswer ?? "")), {
      message: "발문·해설·모범답안의 백틱 짝이 맞지 않습니다",
      path: ["explanation"],
    })
    .refine((q) => !overlongHighlight([q.question, q.explanation, q.modelAnswer ?? ""].join("\n")), {
      message: `발문·해설·모범답안의 형광펜이 ${HIGHLIGHT_MAX}자를 넘습니다 — 함정을 말하는 구절만 칠합니다`,
      path: ["explanation"],
    })
    .refine(
      (q) => countHighlights([q.question, q.explanation, q.modelAnswer ?? ""].join("\n")) <= HIGHLIGHT_PER_EXPLANATION,
      {
        message: `해설·모범답안의 형광펜이 ${HIGHLIGHT_PER_EXPLANATION}개를 넘습니다 — 오답의 뿌리를 짚는 한 구절만 남깁니다`,
        path: ["explanation"],
      },
    ),
});

export const collections = { quiz, practical };
