/**
 * 오답노트 — 틀린 문항을 기기에 쌓고, 다시 볼 시점을 간격 반복으로 미룬다.
 *
 * 필기 연습 결과(`[...exam]/index.astro`)와 개념 노트의 확인 문제(`NoteTopics.astro`)가
 * 같은 통을 쓴다. 두 곳이 같은 규칙을 쓰게 하려고 여기로 뺐다 — 한쪽만 고치면
 * "어디서 틀렸느냐"에 따라 노트가 달리 움직인다.
 *
 * 서버·계정 없이 localStorage만 쓴다(기기 로컬 전용). 로그인 사용자의 DB 오답 기록은
 * 이것과 별개로, 계정 단위 영구 기록을 담당한다.
 */

export type NoteItem = {
  n: number; // 틀린 횟수 — 누적이라 줄지 않는다
  at: number; // 마지막으로 틀린 시각
  due?: number; // 다음에 다시 볼 시각. 없으면 오늘 몫으로 친다(이 기능 이전에 쌓인 저장분)
  s?: number; // 통과 단계 — STEPS의 인덱스. 없으면 0
};
export type Note = Record<string, NoteItem>;

const DAY = 24 * 60 * 60 * 1000;

/**
 * 맞힐 때마다 이만큼(일) 미룬다. 마지막을 통과하면 노트에서 졸업한다.
 * 한 번 맞혔다고 바로 지우면 "안다"고 치는 셈이라 며칠 뒤 같은 문항을 다시 틀린다 —
 * 간격을 두고 세 번 맞혀야 나간다.
 */
export const STEPS = [1, 3, 7];

/** 저장 키는 시험별로 갈린다 — 정처기는 접미어가 없어 기존 저장분을 그대로 잇는다 */
export const noteKey = (examSlug: string) =>
  examSlug ? `daily.quiz.wrong-note.v1.${examSlug}` : "daily.quiz.wrong-note.v1";

export const loadNote = (key: string): Note => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Note;
  } catch {
    return {};
  }
};

export const saveNote = (key: string, note: Note) => {
  try {
    localStorage.setItem(key, JSON.stringify(note));
  } catch {
    /* 시크릿 모드 등 저장 불가 환경은 조용히 무시 — 풀이는 그대로 진행된다 */
  }
};

/** 오늘 다시 볼 몫인가 — due가 없는 항목(이 기능 이전 저장분)은 오늘 몫이다 */
export const isDue = (it: NoteItem, now = Date.now()) => (it.due ?? 0) <= now;

/** 오늘 다시 볼 문항 id — 오래 밀린 것부터 */
export const dueIds = (note: Note, now = Date.now()) =>
  Object.keys(note)
    .filter((id) => isDue(note[id], now))
    .sort((a, b) => (note[a].due ?? 0) - (note[b].due ?? 0));

/** 틀렸다 — 노트에 담고 간격을 처음으로 되돌린다 */
export const markWrong = (note: Note, id: string, now = Date.now()) => {
  note[id] = { n: (note[id]?.n ?? 0) + 1, at: now, s: 0, due: now + STEPS[0] * DAY };
};

/**
 * 맞혔다 — 다음 단계로 미루고, 마지막 단계를 통과하면 노트에서 지운다.
 * 노트에 없던 문항이면 아무 일도 하지 않는다.
 */
export const markRight = (
  note: Note,
  id: string,
  now = Date.now(),
): "none" | "spaced" | "cleared" => {
  const prev = note[id];
  if (!prev) return "none";
  const s = (prev.s ?? 0) + 1;
  if (s >= STEPS.length) {
    delete note[id];
    return "cleared";
  }
  note[id] = { ...prev, s, due: now + STEPS[s] * DAY };
  return "spaced";
};

/** 다음 복습까지 남은 날 — 배너 문구용. 오늘 몫이면 0 */
export const daysUntil = (it: NoteItem, now = Date.now()) =>
  Math.max(0, Math.ceil(((it.due ?? 0) - now) / DAY));
