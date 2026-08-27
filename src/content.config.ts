import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import topicNotes from "./data/topic-notes.json";

/**
 * 문제 은행 스키마 — 발행 게이트 역할(블로그 publish_post의 검증과 같은 철학).
 * 스키마 위반 문제는 빌드가 실패하므로, 깨진 문제가 사이트에 실리지 않는다.
 * 문제는 기출 복제가 아니라 daily.mcp 정처기 글 기반의 자체 제작 문항이다.
 */
export const AREAS = ["운영체제", "네트워크", "데이터베이스", "소프트웨어공학", "정보보안", "프로그래밍"] as const;

/**
 * 시험 과목 — 실제 정처기 필기의 5과목. 과목당 20문항, 과목별 40점 미만이면 과락.
 * 영역과는 다대다다(소프트웨어공학은 1·2·5과목에, 프로그래밍은 2·4과목에 걸친다).
 * 그래서 과목은 영역이 아니라 주제(topic)에 붙는다.
 */
export const SUBJECTS = [
  "소프트웨어 설계",
  "소프트웨어 개발",
  "데이터베이스 구축",
  "프로그래밍 언어 활용",
  "정보시스템 구축 관리",
] as const;

/** 과목별 URL 슬러그 — 개념 노트 과목 라우팅(/notes/s/<slug>/)에 쓴다 */
export const SUBJECT_SLUGS: Record<(typeof SUBJECTS)[number], string> = {
  "소프트웨어 설계": "design",
  "소프트웨어 개발": "dev",
  "데이터베이스 구축": "database",
  "프로그래밍 언어 활용": "language",
  "정보시스템 구축 관리": "management",
};

/** 난이도 단계 — 하(정의·단순 매칭), 중(유사 개념 구분·함정), 상(계산·다단계 추론) */
export const DIFFICULTIES = ["하", "중", "상"] as const;

/** 영역별 URL 슬러그 — 개념 노트 상세 라우팅(/notes/<slug>/)에 쓴다 */
export const AREA_SLUGS: Record<(typeof AREAS)[number], string> = {
  운영체제: "os",
  네트워크: "network",
  데이터베이스: "database",
  소프트웨어공학: "software",
  정보보안: "security",
  프로그래밍: "programming",
};

/**
 * 개념 주제 — 개념 노트의 단위이자 문항의 분류축.
 * 정의는 src/data/topic-notes.json 하나에 모인다(제목·도입부·연결 글).
 * 블로그 글(post)은 주제의 선택적 속성 — 글이 없는 주제도 도입부로 완결된다.
 */
export type Topic = {
  subject: (typeof SUBJECTS)[number];
  area: (typeof AREAS)[number];
  title: string;
  intro: string;
  post?: string;
};
export const TOPICS: Record<string, Topic> = topicNotes;
const TOPIC_KEYS = Object.keys(TOPICS) as [string, ...string[]];

/** 주제 정의가 깨지면(과목·영역 오타) 빌드에서 잡는다 */
for (const [key, t] of Object.entries(TOPICS)) {
  if (!SUBJECTS.includes(t.subject)) throw new Error(`주제 ${key}의 subject가 잘못됨: ${t.subject}`);
  if (!AREAS.includes(t.area)) throw new Error(`주제 ${key}의 area가 잘못됨: ${t.area}`);
}

const quiz = defineCollection({
  loader: file("src/data/questions.json"),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9-]+$/, "id는 영문 kebab-case"),
      area: z.enum(AREAS),
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
 * 실기 문항 유형 — 정처기 실기는 필답형 20문항·100점(문항당 5점)·150분·60점 합격이다.
 * 필기와 달리 보기가 없고 답을 직접 쓰므로, 채점 방식이 유형마다 다르다.
 * 단답형·계산형·코드형·SQL형은 문자열 대조로 자동 채점하고, 약술형은 자가 채점한다.
 */
export const PRACTICAL_KINDS = ["단답형", "계산형", "코드형", "SQL형", "약술형"] as const;

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
    .refine((q) => (q.kind === "약술형" ? q.answers.length === 0 : q.answers.length > 0), {
      message: "약술형은 answers를 비우고, 나머지 유형은 답란을 하나 이상 둬야 합니다",
      path: ["answers"],
    })
    .refine((q) => (q.kind === "약술형" ? !!q.modelAnswer && !!q.keywords?.length : true), {
      message: "약술형은 modelAnswer와 keywords가 필요합니다",
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
