/**
 * 풀이 기록 — 날짜별로 "몇 문항 풀어 몇 개 맞혔나"만 남긴다.
 *
 * 홈의 최근 일주일 띠와 연속 일수가 이 값을 읽는다. 무엇을 틀렸는지는 오답노트가
 * 이미 문항 단위로 갖고 있으므로 여기서는 세지 않는다 — 같은 사실을 두 곳에 적으면
 * 둘이 어긋나는 날이 온다.
 *
 * 저장 키는 오답노트와 같은 규칙으로 시험별로 갈린다(정처기는 접미어 없음).
 */
export type Day = { n: number; ok: number };
/** "YYYY-MM-DD" → 그날의 합계 */
export type History = Record<string, Day>;

/** 홈이 보는 창은 일주일이다 — 무한히 쌓을 이유가 없어 90일에서 자른다 */
const KEEP_DAYS = 90;

/** 로컬 날짜 키 — UTC로 찍으면 한국 시간 오전 9시 전에 푼 문항이 '어제'로 간다 */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function loadHistory(key: string): History {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as History) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {}; // 시크릿 모드·손상된 값 — 기록이 없는 것으로 친다
  }
}

export function saveHistory(key: string, h: History) {
  try {
    const keys = Object.keys(h).sort().slice(-KEEP_DAYS);
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(keys.map((k) => [k, h[k]]))));
  } catch {
    /* 저장 실패는 조용히 넘긴다 — 기록은 학습의 부산물이지 학습을 막을 이유가 아니다 */
  }
}

/**
 * 채점이 끝난 뒤 오늘 몫에 더한다. 무응답은 풀지 않은 것이므로 n에서 뺀 값을 넘긴다.
 *
 * 음수도 받는다 — 실기는 채점이 끝난 뒤에도 자가 채점으로 정답 수가 오르내리므로,
 * 같은 세션을 두 번 세지 않으려면 "지난번에 적은 것과의 차이"를 넘길 수 있어야 한다.
 */
export function recordDay(key: string, n: number, ok: number) {
  if (n === 0 && ok === 0) return;
  const h = loadHistory(key);
  const today = dayKey();
  const d = h[today] ?? { n: 0, ok: 0 };
  h[today] = { n: Math.max(0, d.n + n), ok: Math.max(0, d.ok + ok) };
  saveHistory(key, h);
}

/** 최근 days일 — 오늘이 마지막. 푼 적 없는 날도 빈칸으로 자리를 지킨다(빠진 날이 보여야 기록이다) */
export function recentDays(h: History, days = 7) {
  const base = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (days - 1 - i));
    const key = dayKey(d);
    return { date: d, key, ...(h[key] ?? { n: 0, ok: 0 }) };
  });
}

/**
 * 연속 일수 — 오늘 아직 안 풀었으면 어제까지의 연속을 센다.
 * 하루가 다 가기도 전에 "연속 0일"로 깎으면 기록이 사람을 재촉하는 장치가 된다.
 */
export function streakDays(h: History) {
  const d = new Date();
  if (!h[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (h[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/**
 * 홈의 학습 기록 띠를 그린다 — 필기 홈과 실기 홈이 같은 모양을 쓰므로 한 벌만 둔다.
 *
 * box 안에서 `[data-role="sum"]`(요약 한 줄)과 `[data-role="days"]`(날짜 칸)을 찾는다.
 * 기록이 아예 없으면 box를 통째로 접는다 — 빈 출석부는 아무 말도 하지 않는다.
 */
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function paintHistory(key: string, box: HTMLElement | null) {
  if (!box) return;
  const sum = box.querySelector<HTMLElement>('[data-role="sum"]');
  const days = box.querySelector<HTMLElement>('[data-role="days"]');
  if (!sum || !days) return;

  const week = recentDays(loadHistory(key), 7);
  const solved = week.reduce((acc, d) => acc + d.n, 0);
  box.hidden = solved === 0;
  if (box.hidden) return;

  const ok = week.reduce((acc, d) => acc + d.ok, 0);
  const streak = streakDays(loadHistory(key));
  sum.textContent = [
    streak ? `연속 ${streak}일` : "",
    `이번 주 ${solved}문항`,
    `정답률 ${Math.round((ok / solved) * 100)}%`,
  ]
    .filter(Boolean)
    .join(" · ");

  // 막대는 그 주의 최대치를 기준으로 재되 하루 10문항을 바닥으로 둔다 —
  // 한 번 100문항을 풀면 나머지 엿새가 전부 바닥에 깔리는 것을 막는다.
  const max = Math.max(10, ...week.map((d) => d.n));
  days.innerHTML = week
    .map((d, i) => {
      const on = d.n > 0;
      const h = on ? Math.max(14, Math.round((d.n / max) * 100)) : 0;
      return `<li class="hday${on ? " on" : ""}${i === week.length - 1 ? " today" : ""}">
          <span class="hday-n mono">${on ? d.n : "·"}</span>
          <i class="hday-bar" style="--h:${h}%"></i>
          <span class="hday-w">${WEEKDAYS[d.date.getDay()]}</span>
        </li>`;
    })
    .join("");
}
