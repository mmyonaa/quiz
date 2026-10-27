/**
 * 문항 제보 — 오답을 발견한 사람이 그것을 돌려줄 길.
 *
 * 발행 게이트가 막는 것은 모양이다(형광펜 개수, 정답 유출, 약어 혼용). 내용이 틀린 것은
 * 푸는 사람만 안다 — 지금 그 사람에게는 알릴 경로가 없어서 발견이 그 자리에서 사라진다.
 *
 * 댓글을 받으려면 서버가 필요하지만 이 사이트는 정적이다. 그래서 이슈 작성 화면을
 * 미리 채워 열어 주는 링크 하나로 대신한다 — 받는 쪽이 이미 일감을 관리하는 자리이고,
 * 보내는 쪽은 GitHub 계정만 있으면 된다.
 *
 * **문항 id를 제목에 박는다.** 제보가 어느 문항인지는 본문의 발문 발췌보다 id가 정확하다 —
 * 발문은 고쳐지지만 id는 남는다.
 */
const NEW_ISSUE = "https://github.com/mmyonaa/quiz/issues/new";

export type Reportable = {
  id: string;
  question: string;
  area?: string;
  topic?: string;
};

/** 발문은 제목이 아니라 본문에 넣는다 — 긴 발문이 제목을 밀어내면 목록에서 못 읽는다 */
const EXCERPT = 300;

/**
 * 제보 이슈 주소 — 제목과 본문을 미리 채운다.
 *
 * 라벨은 붙이지 않는다. 없는 라벨을 쿼리로 넘기면 작성 화면이 경고를 띄우고,
 * 라벨 체계는 받는 쪽이 정할 일이지 보내는 쪽이 정할 일이 아니다.
 */
export function reportUrl(q: Reportable, examLabel: string): string {
  const excerpt = q.question.length > EXCERPT ? `${q.question.slice(0, EXCERPT)}…` : q.question;
  const body = [
    `- 시험: ${examLabel}`,
    `- 문항 id: \`${q.id}\``,
    q.area ? `- 영역: ${q.area}` : "",
    q.topic ? `- 주제: \`${q.topic}\`` : "",
    "",
    "## 발문",
    "",
    "> " + excerpt.replace(/\n/g, "\n> "),
    "",
    "## 무엇이 잘못됐나",
    "",
    "<!-- 정답이 틀렸다 / 해설이 틀렸다 / 선지가 겹친다 / 오타 — 아는 만큼만 적어 주세요 -->",
    "",
  ].join("\n");

  const p = new URLSearchParams({ title: `문항 제보: ${q.id}`, body });
  return `${NEW_ISSUE}?${p}`;
}
