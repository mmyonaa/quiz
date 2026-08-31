import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import topicNotes from "./data/topic-notes.json";
import { PRACTICAL_FORMAT, SELF_GRADED, isSelfGraded } from "./lib/practical-grade";

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

/** 주제 정의가 깨지면(시험·과목·영역 오타) 빌드에서 잡는다 */
for (const [key, t] of Object.entries(TOPICS)) {
  if (!EXAMS.includes(t.exam)) throw new Error(`주제 ${key}의 exam이 잘못됨: ${t.exam}`);
  const subjects = SUBJECTS_BY_EXAM[t.exam] as readonly string[];
  const areas = AREAS_BY_EXAM[t.exam] as readonly string[];
  if (!subjects.includes(t.subject)) throw new Error(`주제 ${key}의 subject가 ${t.exam}에 없음: ${t.subject}`);
  if (!areas.includes(t.area)) throw new Error(`주제 ${key}의 area가 ${t.exam}에 없음: ${t.area}`);
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
    }),
});

export const collections = { quiz, practical };
