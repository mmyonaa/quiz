import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저에서 직접 쓰는 Supabase 클라이언트 싱글턴.
 * anon key는 공개용 — 유저별 데이터 격리는 DB의 RLS 정책이 강제한다.
 */
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
