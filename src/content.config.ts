import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import topicNotes from "./data/topic-notes.json";

/**
 * 문제 은행 스키마 — 발행 게이트 역할(블로그 publish_post의 검증과 같은 철학).
 * 스키마 위반 문제는 빌드가 실패하므로, 깨진 문제가 사이트에 실리지 않는다.
 * 문제는 기출 복제가 아니라 daily.mcp 정처기 글 기반의 자체 제작 문항이다.
 */
export const AREAS = ["운영체제", "네트워크", "데이터베이스", "소프트웨어공학", "정보보안", "프로그래밍"] as const;

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
export type Topic = { area: (typeof AREAS)[number]; title: string; intro: string; post?: string };
export const TOPICS: Record<string, Topic> = topicNotes;
const TOPIC_KEYS = Object.keys(TOPICS) as [string, ...string[]];

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
      /** 코드 해석 문항의 코드 블록 — 고정폭 <pre>로 렌더 (프로그래밍 영역용, 선택) */
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

export const collections = { quiz };
