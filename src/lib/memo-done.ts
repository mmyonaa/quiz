/** 외운 카드 기록 — 암기 노트의 "여기까지 외웠다"를 기기에 남긴다(#92).
 *
 * 사이트의 다른 화면은 전부 "풀고 채점하고 쌓인다"인데 암기 노트만 읽기 전용이었다.
 * 가리기는 자기 점검이지 기록이 아니라서, 쉰 장 넘는 카드 중 어디까지 봤는지가 남지 않았다.
 *
 * 채점이 아니라 **자기 선언**이다 — 문항이 없으니 맞고 틀림을 기계가 가릴 수 없다.
 * 그래서 오답노트(wrong-note)의 복습 간격 체계를 빌리지 않고 켜고 끄는 표식 하나로 둔다.
 * 틀린 기록이 아닌 것을 오답노트에 섞으면 "오늘 복습할 오답 N개"의 뜻이 흐려진다.
 *
 * 저장 키는 오답노트와 같은 규약을 쓴다 — 시험별로 갈리고 정처기는 접미어가 없다.
 */
export const doneKey = (examSlug: string) =>
  examSlug ? `daily.quiz.memo-done.${examSlug}` : "daily.quiz.memo-done";

export const loadDone = (key: string): Set<string> => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(v) ? (v as string[]) : []);
  } catch {
    return new Set();
  }
};

export const saveDone = (key: string, done: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...done]));
  } catch {
    /* 저장 불가 환경이면 이 페이지에서만 */
  }
};
