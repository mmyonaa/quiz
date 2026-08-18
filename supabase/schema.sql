-- daily.quiz 유저 데이터 스키마 (issue #4)
-- 적용: Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run.
-- 문제 본문의 원본은 리포의 src/data/questions.json — DB는 문제 id(text)만 참조한다.
-- 유저 테이블은 만들지 않는다: Supabase Auth의 auth.users가 그 역할.

-- 저장(북마크)한 문제
create table saved_questions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 오답 기록. 이력 방식: 틀릴 때마다 한 줄 → 반복 오답 통계의 근거.
create table wrong_answers (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  chosen      smallint not null check (chosen between 0 and 3),
  answered_at timestamptz not null default now()
);

create index wrong_answers_user_idx on wrong_answers (user_id, answered_at desc);

-- RLS: 본인 행만 읽고 쓸 수 있다. 비로그인(anon)은 전부 거부.
alter table saved_questions enable row level security;
alter table wrong_answers enable row level security;

create policy "own rows only" on saved_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on wrong_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2026-08-18 추가분 — 기존 DB에는 아래 블록만 골라 실행 ──────────────

-- 저장(북마크)한 개념 — 개념 노트의 해설 카드 단위. 문제와 별개 컬렉션.
create table saved_notes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table saved_notes enable row level security;

create policy "own rows only" on saved_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
