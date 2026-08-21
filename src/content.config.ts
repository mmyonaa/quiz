import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

/**
 * 문제 은행 스키마 — 발행 게이트 역할(블로그 publish_post의 검증과 같은 철학).
 * 스키마 위반 문제는 빌드가 실패하므로, 깨진 문제가 사이트에 실리지 않는다.
 * 문제는 기출 복제가 아니라 daily.mcp 정처기 글 기반의 자체 제작 문항이다.
 */
export const AREAS = ["운영체제", "네트워크", "데이터베이스", "소프트웨어공학", "정보보안"] as const;

/** 난이도 단계 — 하(정의·단순 매칭), 중(유사 개념 구분·함정), 상(계산·다단계 추론) */
export const DIFFICULTIES = ["하", "중", "상"] as const;

/** 영역별 URL 슬러그 — 개념 노트 상세 라우팅(/notes/<slug>/)에 쓴다 */
export const AREA_SLUGS: Record<(typeof AREAS)[number], string> = {
  운영체제: "os",
  네트워크: "network",
  데이터베이스: "database",
  소프트웨어공학: "software",
  정보보안: "security",
};

const quiz = defineCollection({
  loader: file("src/data/questions.json"),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9-]+$/, "id는 영문 kebab-case"),
      area: z.enum(AREAS),
      /** 난이도 — 필수 필드라 라벨 누락 문항은 빌드가 잡는다 */
      difficulty: z.enum(DIFFICULTIES),
      question: z.string().min(10),
      /** 4지선다 고정 — 정처기 필기 형식 */
      choices: z.array(z.string().min(1)).length(4),
      /** 정답 선지 인덱스(0~3) */
      answer: z.number().int().min(0).max(3),
      explanation: z.string().min(20, "해설은 오답 학습의 핵심 — 20자 이상"),
      /**
       * 개념을 다룬 daily.mcp 글의 파일 id(날짜 포함). 오답 리뷰에서 링크로 렌더.
       * 선택 필드 — 시험 커버리지가 블로그 발행 속도에 묶이지 않도록, 글이 없는 주제는
       * 문항을 먼저 만들고 글 발행 시 링크를 채운다. 실존 검증은 prebuild(blog-sync --check)가 맡는다.
       */
      relatedPost: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/).optional(),
    })
    .strict(),
});

export const collections = { quiz };
