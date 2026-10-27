/**
 * 시험일과 하루 몫 — "남은 분량 ÷ 남은 날"을 한 줄로 말한다.
 *
 * 진행률 막대는 지나온 거리를 말하고 끝난다. 공부를 움직이는 것은 그 뒤의 몫이다 —
 * 남은 것이 37장이고 시험이 25일 뒤면 오늘 할 일은 두 장이라는 것. 그 곱셈을 사람이
 * 하게 두면 아무도 하지 않는다.
 *
 * **시험일은 상수로 박지 않고 사용자가 고른다.** 두 시험이 각자 회차를 갖고 한 해에
 * 여러 번 돌아서, 한 날짜를 박아 두면 다음 회차부터는 전부 틀린 날짜가 된다.
 * 고른 날짜는 기기에만 남고 시험별로 갈린다 — 오답노트·암기 노트와 같은 규약이다
 * (정처기는 접미어가 없다). 두 시험의 진행을 한 통에 담으면 "하루 N개"가 거짓이 된다.
 */
export const examDateKey = (examSlug: string) =>
  examSlug ? `daily.quiz.exam-date.${examSlug}` : "daily.quiz.exam-date";

/** 저장 형식은 `<input type="date">`가 주고받는 "YYYY-MM-DD" 그대로다 */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "YYYY-MM-DD" → 그날 자정의 로컬 `Date`. 날짜가 아니면 `null`.
 *
 * 모양만 보면 안 된다 — `2026-13-99`는 정규식을 통과하고 `new Date(2026, 12, 99)`가
 * 조용히 **다음 해 4월**로 굴러간다. 사람이 고쳐 넣거나 저장값이 손상된 자리에서
 * "시험까지 164일"처럼 그럴듯하게 틀린 수가 나온다. 그래서 돌아온 날짜의 연·월·일이
 * 넣은 값과 같은지 되본다.
 */
function parseDay(iso: string): Date | null {
  if (!ISO_DAY.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const same = dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  return same ? dt : null;
}

export const loadExamDate = (key: string): string => {
  try {
    const v = localStorage.getItem(key) ?? "";
    return parseDay(v) ? v : "";
  } catch {
    return ""; // 시크릿 모드 — 정한 적 없는 것으로 친다
  }
};

export const saveExamDate = (key: string, iso: string) => {
  try {
    if (parseDay(iso)) localStorage.setItem(key, iso);
    else localStorage.removeItem(key);
  } catch {
    /* 저장 불가 환경이면 이 페이지에서만 */
  }
};

/**
 * 오늘부터 시험일까지 남은 날.
 *
 * 자정 기준으로 센다 — 시각까지 넣으면 같은 날 오전과 오후가 다른 수를 말한다.
 * 로컬 달력으로 비교하는 것도 같은 이유다(`Date.parse`는 UTC로 읽어 한국에서 하루 어긋난다).
 * 시험 당일은 `0`, 지난 날짜는 음수다.
 */
export function daysUntil(iso: string, today = new Date()): number | null {
  const target = parseDay(iso);
  if (!target) return null;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

/**
 * 하루 몫 — 남은 분량을 남은 날로 나눠 올린다.
 *
 * 올림이다. 4.2를 4로 내리면 그 계획을 그대로 따른 사람이 시험 전날 남는다.
 * 시험 당일(`days === 0`)은 나눌 날이 없으므로 남은 전부가 오늘 몫이다.
 */
export function perDay(remaining: number, days: number): number {
  if (remaining <= 0) return 0;
  return days <= 0 ? remaining : Math.ceil(remaining / days);
}
