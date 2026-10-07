/** 개념 그림 — 도입부의 "^ 이름" 블록이 가리키는 그림들.
 *
 *  그림은 강조 층 중에서도 가장 무겁다. 그래서 글로 되는 것은 두지 않는다 —
 *  순서(핸드셰이크·절차)는 MdBlocks의 "~ " 흐름이, 층(OSI·사다리)은 "# " 스택이,
 *  한두 축 대조는 형광펜이 이미 받는다. 여기 남는 것은 **2D가 아니면 안 되는 것**뿐이다:
 *  고리(환형 대기), 중첩·트리(B-트리 분할), 비트 자리(서브넷), 교차(공개키 쌍).
 *
 *  래스터 이미지가 아니라 손으로 쓴 인라인 SVG인 이유 —
 *    · 빌드가 읽는다. 이름이 틀리면 content.config.ts가 막는다(PNG는 아무도 못 본다).
 *    · 테마를 따라온다. 색은 전부 토큰(var(--text) 등)이라 다크에서 따로 둘 그림이 없다.
 *    · 고칠 수 있다. 라벨 하나가 바뀌면 한 글자 diff다.
 *  about 페이지의 궤도 다이어그램(#107)이 이미 같은 방식이다.
 *
 *  alt는 눈으로 못 보는 쪽에 주는 구조 설명이고, caption은 이 그림에서 들고 갈 한 줄이다.
 *  그림은 본문을 대체하지 않는다 — 도입부는 그림 없이도 완결되고, 그림은 같은 내용을
 *  2D로 겹쳐 보여 주기만 한다(가리기·검색·스크린리더가 글에 기대고 있다).
 *
 *  마커 id는 그림 이름을 접두어로 둔다 — 한 페이지에 그림이 여럿 서면 id가 부딪힌다.
 */
export type Diagram = { alt: string; caption: string; svg: string };

export const DIAGRAMS: Record<string, Diagram> = {
  /** 자원 할당 그래프의 고리 — 프로세스 셋·자원 셋이 한 바퀴 물린 모양.
      점선(요청)과 실선(점유)이 번갈아 돌아야 고리가 닫힌다는 것이 이 그림의 전부다. */
  "deadlock-cycle": {
    alt: "프로세스 P1·P2·P3와 자원 R1·R2·R3가 번갈아 놓인 고리. P1은 R1을 요청하고 R1은 P2가 점유, P2는 R2를 요청하고 R2는 P3가 점유, P3는 R3를 요청하고 R3는 P1이 점유해 한 바퀴가 닫힌다.",
    caption: "화살표가 한 바퀴 닫히면 환형 대기다 — 어느 한 화살표든 끊으면 교착은 생기지 않는다.",
    svg: `<svg viewBox="0 0 360 322" class="dg-svg" focusable="false">
  <defs>
    <marker id="dl-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <g class="dg-wait" marker-end="url(#dl-ah)">
    <path d="M206.0 61.0 L246.5 84.4" />
    <path d="M245.8 220.0 L205.3 243.4" />
    <path d="M88.2 175.0 L88.2 121.0" />
  </g>
  <g class="dg-hold" marker-end="url(#dl-ah)">
    <path d="M271.8 120.0 L271.8 174.0" />
    <path d="M155.5 243.9 L115.0 220.5" />
    <path d="M112.7 84.9 L153.2 61.5" />
  </g>
  <text class="dg-center" x="180" y="152">환형 대기</text>
  <g class="dg-proc">
    <circle cx="180" cy="46" r="26" /><text x="180" y="46">P1</text>
    <circle cx="271.8" cy="205" r="26" /><text x="271.8" y="205">P2</text>
    <circle cx="88.2" cy="205" r="26" /><text x="88.2" y="205">P3</text>
  </g>
  <g class="dg-res">
    <rect x="250.8" y="82" width="42" height="34" rx="6" /><text x="271.8" y="99">R1</text>
    <rect x="159" y="241" width="42" height="34" rx="6" /><text x="180" y="258">R2</text>
    <rect x="67.2" y="82" width="42" height="34" rx="6" /><text x="88.2" y="99">R3</text>
  </g>
  <g class="dg-legend">
    <path class="dg-wait" d="M66 306 L96 306" marker-end="url(#dl-ah)" />
    <text x="104" y="307">요청(대기)</text>
    <path class="dg-hold" d="M196 306 L226 306" marker-end="url(#dl-ah)" />
    <text x="234" y="307">점유(할당)</text>
  </g>
</svg>`,
  },
};
