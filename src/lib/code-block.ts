/** 문항 코드 블록(`code`)을 화면에 세운다 — 표는 진짜 표로, 나머지는 코드 블록으로.

    코드 블록은 고정폭 글꼴(ui-monospace·SFMono·Menlo)로 서는데 **이 글꼴들에는 한글이 없다.**
    한글만 시스템 한국어 글꼴로 떨어지고 그 폭이 영문의 1.437배다(14px에서 12.11px 대 8.43px, 실측).
    `|`와 `-`로 그린 ASCII 표는 한글이 영문의 정확히 2배라고 전제하고 칸을 맞춘 것이라, 한 줄에
    든 한글 수가 줄마다 다르면 칸이 어긋난다 — 릴레이션 표 6문항이 그랬다.

    글꼴로는 못 고친다. `size-adjust`는 자간이 아니라 글자 자체를 같이 키워(한글만 39% 크게)
    영문과 크기가 어긋나고, 한글 고정폭 글꼴(D2Coding 류)은 웹폰트로 받아야 하는데 이 사이트는
    웹폰트를 하나도 싣지 않는다. 그래서 **표는 표로 세운다** — 칸을 맞추는 일이 글꼴이 아니라
    표 자체의 몫이 되고, 좁은 화면에서 세로로 펴지는 규칙(.cmp)도 따라온다.

    표가 아닌 덩어리(SQL문·수식·키 값 목록)는 코드 블록으로 남는다. 그중 **공백으로 줄을 맞춰
    놓은 블록**(자산 가치/노출 계수/연간 발생률)만 한글을 영문 두 칸(`2ch`) 폭에 세워 칸을 맞춘다 —
    맞출 것이 없는 줄까지 칸에 넣으면 글자 사이만 벌어진다.

    빌드 타임(개념 노트)과 브라우저(문제 풀이·리뷰·마이페이지)가 같은 화면을 그려야 하므로
    md()와 같은 이유로 여기 하나에 둔다. */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ESC[c]);

/** 영문 두 칸을 차지하는 글자 — 한글·한자·전각 기호. CSS가 이들만 `2ch` 칸에 세운다. */
const WIDE =
  /[ᄀ-ᇿ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣ힰ-퟿豈-﫿︰-﹏！-｠￠-￦]/g;

/** 칸 구분선 — `-------+--------+-----` 꼴. 이 줄 하나가 "이 덩어리는 표다"라는 표식이다
    (C의 비트 연산 `a | b`처럼 파이프만 든 코드를 표로 오인하지 않게 하는 자도 이것이다). */
const SEP = /^[-+| ]*-{3,}[-+| ]*$/;

const cells = (row: string) => row.split("|").map((c) => c.trim());

/** 공백 둘 이상으로 칸을 벌린 줄 — "이 덩어리는 줄을 맞춰 놓은 것"이라는 표식이다. */
const ALIGNED = /\S {2,}\S/;

/** 코드 덩어리. 줄을 맞춰 놓은 블록에서만 한글을 두 칸에 세운다 — 평범한 SQL 한 줄
    (`SELECT 이름 FROM 학생`)까지 칸에 넣으면 맞출 것도 없이 글자 사이만 벌어진다. */
const codeChunk = (text: string) => {
  const body = esc(text);
  return `<pre class="q-code mono">${ALIGNED.test(text) ? body.replace(WIDE, (c) => `<span class="kr">${c}</span>`) : body}</pre>`;
};

/** 표 덩어리를 세운다 — 구분선 바로 윗줄이 머리글, 그 위는 캡션(`[학생]`), 아래는 값이다.
    칸 수가 줄마다 다르면 표로 보지 않고 코드 블록으로 되돌린다(잘못 세운 표보다 낫다). */
const tableChunk = (lines: string[]) => {
  const si = lines.findIndex((l) => SEP.test(l));
  const head = cells(lines[si - 1]);
  const body = lines.slice(si + 1).map(cells);
  if (si < 1 || head.length < 2 || body.some((r) => r.length !== head.length)) return null;
  const caption = lines.slice(0, si - 1).join(" ").trim();

  // 머리글은 data-h로도 간다 — 좁은 화면에서 표가 세로로 펴질 때 각 칸이 제 머리글을 달고 선다
  const th = head.map((c) => `<th>${esc(c)}</th>`).join("");
  const rows = body
    .map(
      (r) =>
        `<tr><th scope="row" data-h="${esc(head[0])}">${esc(r[0])}</th>` +
        r
          .slice(1)
          .map((c, i) => `<td data-h="${esc(head[i + 1])}"><span class="cv">${esc(c)}</span></td>`)
          .join("") +
        `</tr>`,
    )
    .join("");

  return (
    `<div class="cmp-wrap"><table class="cmp cmp-wide q-cmp">` +
    (caption ? `<caption>${esc(caption)}</caption>` : "") +
    `<thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`
  );
};

/** 표 덩어리면 표 HTML, 아니면 null */
const asTable = (chunk: string) => {
  const lines = chunk.split("\n").filter((l) => l.trim());
  const looksTable = lines.some((l) => SEP.test(l)) && lines.filter((l) => l.includes("|")).length >= 2;
  return looksTable ? tableChunk(lines) : null;
};

/** 코드 블록 하나를 HTML로.

    표가 없으면 **통째로 한 판**이다 — 빈 줄은 코드 안의 빈 줄일 뿐이다. 빈 줄마다 판을
    나누면 `#include` 한 줄과 함수 본문이 서로 다른 상자에 앉아 한 프로그램이 셋으로 보인다
    (빈 줄이 든 코드 블록이 229개 중 68개다).

    표가 있을 때만 빈 줄이 경계가 된다(릴레이션 표 + SQL문이 한 블록에 온다). 그때도 표가
    아닌 이웃끼리는 다시 빈 줄로 이어 붙여 한 판에 담는다. */
export const codeHtml = (code: string) => {
  const chunks = code.split("\n\n").map((c) => ({ text: c, table: asTable(c) }));
  if (!chunks.some((c) => c.table)) return codeChunk(code);

  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) out.push(codeChunk(buf.join("\n\n")));
    buf = [];
  };
  for (const c of chunks) {
    if (c.table) {
      flush();
      out.push(c.table);
    } else buf.push(c.text);
  }
  flush();
  return out.join("");
};
