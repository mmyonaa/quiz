import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * 페이지 공용 인증 상태. import하는 쪽 어디서든 같은 세션을 본다.
 * 세션 토큰 보관·갱신은 supabase-js가 담당(localStorage) — 유저 데이터와는 별개다.
 */
type Listener = (session: Session | null) => void;

const listeners = new Set<Listener>();
let current: Session | null = null;
let ready = false;

/** 세션 변화 구독. 초기 세션 확인이 끝났다면 등록 즉시 현재 상태로 한 번 불린다. */
export const onAuth = (fn: Listener) => {
  listeners.add(fn);
  if (ready) fn(current);
};

export const authSession = () => current;

const emit = (s: Session | null) => {
  current = s;
  ready = true;
  listeners.forEach((fn) => fn(s));
};

supabase.auth.getSession().then(({ data }) => emit(data.session));
supabase.auth.onAuthStateChange((_event, s) => emit(s));

/** Google OAuth 로그인 — 끝나면 지금 보던 페이지로 복귀한다. */
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  if (error) alert(`로그인에 실패했습니다: ${error.message}`);
};

export const logout = () => supabase.auth.signOut();

/** 로그인이 필요한 동작의 관문. 비로그인이면 로그인 여부를 묻고 false를 돌려준다. */
export const requireLogin = (): boolean => {
  if (current) return true;
  if (confirm("로그인이 필요한 기능입니다. Google로 로그인할까요?")) loginWithGoogle();
  return false;
};

/**
 * DB 요청 실패를 사용자에게 보여줄 문구로 바꾼다.
 * 세션 만료·인증 문제(JWT 만료 PGRST301, RLS 거부 42501 — 이 앱의 정책상
 * 로그인 유저의 본인 행 접근은 항상 통과하므로 42501은 곧 토큰 문제다)면
 * 원인 코드 대신 재로그인 안내를 띄운다.
 */
export const errorText = (prefix: string, e: { message: string; code?: string }): string =>
  e.code === "PGRST301" || e.code === "42501" || /jwt|expired|token/i.test(e.message)
    ? "세션이 만료됐습니다. 다시 로그인해주세요."
    : `${prefix}: ${e.message}`;
