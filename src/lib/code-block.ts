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

    코드 블록에는 언어 라벨과 복사 버튼이 선다 — 단, 문항이 `lang`을 적어 둔 블록에만이다.
    제시문의 다수는 언어가 없다(정의 불릿·㉠㉡ 짝·트리 그림·패킷 덤프·수식), 그 자리에
    "SHELL" 같은 라벨이 서면 없는 것보다 나쁘고 복사할 것도 없다.

    빌드 타임(개념 노트)과 브라우저(문제 풀이·리뷰·마이페이지)가 같은 화면을 그려야 하므로
    md()와 같은 이유로 여기 하나에 둔다. 버튼을 누른 뒤의 일도 같은 이유로 여기 있다
    (`mountCodeCopy`). */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ESC[c]);

/** 영문 두 칸을 차지하는 글자 — 한글·한자·전각 기호. CSS가 이들만 `2ch` 칸에 세운다. */
const WIDE =
  /[ᄀ-ᇿ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣ힰ-퟿豈-﫿︰-﹏！-｠￠-￦]/g;

/** 칸 구분선 — `-------+--------+-----` 꼴. 이 줄 하나가 "이 덩어리는 표다"라는 표식이다
    (C의 비트 연산 `a | b`처럼 파이프만 든 코드를 표로 오인하지 않게 하는 자도 이것이다). */
const SEP = /^[-+| ]*-{3,}[-+| ]*$/;

const cells = (row: string) => row.split("|").map((c) => c.trim());

/** 공백 둘 이상으로 칸을 벌린 줄 — 이 줄은 칸을 맞춰 놓은 것이다.
    한 줄이라도 있으면 그 덩어리는 "줄을 맞춰 놓은 블록"이다. */
const PADDED = /\S {2,}\S/;

/** 산문 줄 — 한글이 들었고 코드 구두점(`;` `{` `}` `=` `<` `>`)도 SQL 머리말도 없는 줄.
    문제에 주어진 조건·특징 서술이 코드 블록 안에 같이 온다(`- 스스로를 복제해 …`).
    `<pre>`는 줄을 접지 않아 긴 한글 문장이 판 밖으로 구르는데, 산문은 접히는 것이 맞다. */
const PROSE = (line: string) =>
  /[가-힣]/.test(line) &&
  !/[;{}=<>]/.test(line) &&
  // 큰따옴표는 이 데이터에서 코드·JSON의 것이다 — 한글 서술은 작은따옴표를 쓴다(`'컴퓨터공학'인`)
  !/"/.test(line) &&
  !/^\s*(SELECT|FROM|WHERE|GROUP|ORDER|HAVING|INSERT|UPDATE|DELETE|GRANT|REVOKE|CREATE|ALTER|DROP)\b/i.test(line);

/** 코드 덩어리.

    줄을 맞춰 놓은 블록에서만 한글을 두 칸에 세운다 — 평범한 SQL 한 줄(`SELECT 이름 FROM 학생`)
    까지 칸에 넣으면 맞출 것도 없이 글자 사이만 벌어진다.

    산문 줄은 인라인 span으로 감싼다 — 줄바꿈(`\n`)은 pre의 것으로 그대로 두고 그 줄 안에서만
    접히게 하는 방법이다. 블록으로 만들면 줄을 스스로 끝내 버려 앞뒤의 `\n`과 겹치고, 덩어리
    사이의 빈 줄이 사라진다. */
/** 이 줄의 한글이 칸 자리를 미는가 — 마지막으로 벌려 놓은 공백보다 **앞에** 한글이 있을 때다.
    `SELECT 이름, 점수`나 `  FROM 학생`의 한글은 뒤에 칸이 없어 아무것도 밀지 않는다.
    반대로 `2301    CS101     김교수     A`의 `김교수`는 뒤의 칸을 민다 — 첫 공백만 보면 놓친다. */
const shiftsColumns = (line: string) => {
  const run = / {2,}\S/g;
  let last = -1;
  for (let m = run.exec(line); m; m = run.exec(line)) last = m.index;
  return last >= 0 && /[가-힣]/.test(line.slice(0, last));
};

const codeChunk = (text: string, lang?: string) => {
  const lines = text.split("\n");
  const padded = lines.map((l) => PADDED.test(l));
  const out = lines
    .map((line, i) => {
      // 칸을 벌려 놓은 줄은 산문이 아니다 — 맞춰 둔 칸이 접히면 무너진다. 판정은 줄마다 한다
      // (덩어리로 보면 SQL 들여쓰기 한 줄이 그 블록의 산문 접기를 통째로 끈다).
      // 이웃이 칸을 벌려 놓았으면 그 줄도 같은 격자의 일부다 — 한 줄만 접으면 격자가 깨진다
      // (`릴레이션 EMPLOYEE : 차수 4` 아래에 `릴레이션 PROJECT  : 차수 3`이 오는 자리).
      const prose = PROSE(line) && !padded[i] && !padded[i - 1] && !padded[i + 1];
      const body = shiftsColumns(line) ? esc(line).replace(WIDE, (c) => `<span class="kr">${c}</span>`) : esc(line);
      return prose ? `<span class="tx">${body}</span>` : body;
    })
    .join("\n");
  // 언어가 적힌 블록만 머리줄(라벨·복사 버튼)을 받는다 — 트리 그림·조건 불릿·패킷 덤프에는
  // 복사할 것이 없고, 라벨은 틀리면 없는 것보다 나쁘다(`lang`은 추정하지 않고 적어 둔 값이다).
  //
  // 머리줄은 코드 **위에 겹치지 않고 한 줄을 차지한다.** 코드 블록은 긴 줄을 접지 않고
  // 가로로 굴리는데(`overflow-x: auto`), 그 안에 띄워 둔 것은 스크롤을 따라 함께 움직여
  // 코드 위로 올라온다 — 390px에서 블록 셋 중 둘이 가로로 구르고 버튼이 184px까지 밀렸다.
  // 제자리에 남는 것은 흐름 안에 선 블록의 `sticky`뿐이다(CSS의 `.code-head`).
  //
  // 본문은 <code>가 받는다 — 복사할 때 pre의 글자를 통째로 읽으면 머리줄의 "SQL"과 "복사"가
  // 코드 앞에 섞인다.
  const head = lang
    ? `<span class="code-head"><span class="code-lang">${lang}</span>` +
      `<button type="button" class="code-copy" data-copy-code aria-label="코드 복사"><span class="code-copy-label">복사</span></button></span>`
    : "";
  return `<pre class="q-code mono"${lang ? ` data-lang="${lang}"` : ""}>${head}<code>${out}</code></pre>`;
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
export const codeHtml = (code: string, lang?: string) => {
  const chunks = code.split("\n\n").map((c) => ({ text: c, table: asTable(c) }));
  if (!chunks.some((c) => c.table)) return codeChunk(code, lang);

  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) out.push(codeChunk(buf.join("\n\n"), lang));
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

/** 복사 버튼을 살린다 — 코드 블록이 서는 화면마다 한 번 부른다.

    버튼마다 리스너를 달지 않고 문서가 위임으로 받는다. 런너·리뷰·마이페이지는 문항이
    바뀔 때마다 블록을 다시 그리므로(innerHTML), 버튼에 직접 단 리스너라면 그릴 때마다
    다시 달아야 한다 — 한 자리만 빠뜨려도 그 화면의 버튼이 조용히 죽는다.

    클립보드는 거절될 수 있다(보안 컨텍스트가 아닌 주소, 권한 차단). 실패를 성공처럼
    보이면 복사된 줄 알고 붙여 넣게 되므로 버튼이 실패했다고 말한다. */
export const mountCodeCopy = () => {
  let revert = 0;
  document.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-copy-code]");
    const label = btn?.querySelector(".code-copy-label");
    if (!btn || !label) return;
    const code = btn.closest("pre")?.querySelector("code")?.textContent ?? "";
    let ok = true;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      ok = false;
    }
    label.textContent = ok ? "복사됨" : "복사 실패";
    btn.classList.toggle("copied", ok);
    btn.classList.toggle("failed", !ok);
    clearTimeout(revert);
    revert = window.setTimeout(() => {
      label.textContent = "복사";
      btn.classList.remove("copied", "failed");
    }, 1400);
  });
};
