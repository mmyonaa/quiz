#!/usr/bin/env node
/**
 * 화면 폭 가드 — 글 블록에 읽기 폭 상한이 다시 들어오는 것을 막는다.
 *
 * 세 번 같은 자리에서 터졌다. `--measure`(42rem)를 산문 블록마다 손으로 걸어 두었는데,
 * 판은 셸 폭(77.5rem)이라 글만 672px에서 꺾이고 옆의 표·격자·괘선은 끝까지 갔다 —
 * 오른쪽이 300~530px 빈 채로 줄이 바뀌니 "가로 길이가 잘못 잡힌" 것으로 읽힌다.
 *
 * #110이 패널 쪽을 걷으면서 about만 남겼고("판 자체가 산문인 긴 글"), 그 예외가 다음 차례로
 * 터졌다(#118). 규칙을 CSS 주석에만 두면 다음 사람이 반대 내용을 적은 다른 주석을 읽는다.
 *
 * 그래서 토큰 자체를 지우고 이 가드를 둔다. **폭은 판(열)이 정하고 글이 정하지 않는다.**
 * 그림처럼 진짜로 묶어야 하는 것은 제 크기를 px로 적는다(.orbit-stage: 480px) — 읽기 폭
 * 토큰을 되살려 쓰지 않는다. 되살리려면 이 가드도 함께 고친다.
 */
import { readFileSync } from "node:fs";

const CSS = "src/styles/global.css";
/** 선언(`--measure: …`)과 사용(`var(--measure)`)만 본다 — 왜 걷었는지 적은 주석은 남겨야 한다 */
const BANNED = /(^|[^-\w])--measure(-wide)?\s*:|var\(\s*--measure(-wide)?\s*[),]/;

// 주석을 지우고 센다. 주석 안의 토큰 이름까지 막으면 '다시 걸지 말라'는 설명을 쓸 수 없다.
const raw = readFileSync(CSS, "utf8");
const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const hits = stripped
  .split("\n")
  .map((line, i) => ({ n: i + 1, line }))
  .filter(({ line }) => BANNED.test(line));

if (hits.length) {
  console.error(
    `\n[style-guard] 읽기 폭 토큰(--measure)이 ${CSS}에 ${hits.length}곳 있습니다.\n` +
      `글의 폭은 판(열)이 정하고 글이 정하지 않습니다 — 산문에 상한을 걸면 옆 블록만 끝까지 가서\n` +
      `오른쪽이 빈 채로 줄이 바뀝니다. 그림처럼 진짜로 묶어야 하는 것은 px로 제 크기를 적습니다.\n`,
  );
  hits.forEach(({ n, line }) => console.error(`  ${CSS}:${n}  ${line.trim()}`));
  console.error("");
  process.exit(1);
}
console.log("[style-guard] 글 블록에 읽기 폭 상한 없음 — 폭은 판이 정한다.");
