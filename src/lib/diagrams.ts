/** 개념 그림 — 도입부·암기 카드 본문의 "^ 이름" 블록이 가리키는 그림들.
 *
 *  그림은 강조 층 중에서도 가장 무겁다. 그래서 글로 되는 것은 두지 않는다 —
 *  순서(핸드셰이크·절차)는 MdBlocks의 "~ " 흐름이, 층(OSI·사다리)은 "# " 스택이,
 *  한두 축 대조는 형광펜이, 세 축부터는 대조표가 이미 받는다. 여기 남는 것은
 *  **2D가 아니면 안 되는 것**뿐이다: 고리 · 비트 자리 · 사슬 · 중첩 · 트리.
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
 *  **한 그림은 여러 주제가 같이 쓴다.** 두 시험에 같은 개념이 서는 자리가 많아서다
 *  (서브넷 비트 · 키 쌍 교차). 암기 카드 한 장이 두 시험에 서는 것과 같은 선택이다 —
 *  그림을 시험마다 복사해 두면 한쪽만 고쳐져 같은 개념이 화면마다 달라진다.
 *
 *  칠하는 어휘는 공용이다(CSS는 global.css의 ".dg-" 묶음) —
 *    dg-line  선(화살표). dg-dash를 함께 주면 점선·옅은 선이 된다
 *    dg-node  주체를 나타내는 알맹이(프로세스·트리 노드) — 강조색 테두리
 *    dg-box   거쳐 가는 것·담기는 것(자원·블록·비트 띠) — 무채 면
 *    dg-chip  외울 값이 적힌 쪽지(키 이름·기본키) — 강조색 면
 *    dg-tick  눈금선 · dg-sub 곁 글씨 · dg-xs 더 작은 글씨 · dg-lg 알맹이 글자 · dg-em 짚는 글자
 *  마커 id는 그림마다 접두어를 둔다 — 한 페이지에 그림이 여럿 서면 id가 부딪힌다.
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
  <g class="dg-line dg-dash" marker-end="url(#dl-ah)">
    <path d="M206.0 61.0 L246.5 84.4" />
    <path d="M245.8 220.0 L205.3 243.4" />
    <path d="M88.2 175.0 L88.2 121.0" />
  </g>
  <g class="dg-line" marker-end="url(#dl-ah)">
    <path d="M271.8 120.0 L271.8 174.0" />
    <path d="M155.5 243.9 L115.0 220.5" />
    <path d="M112.7 84.9 L153.2 61.5" />
  </g>
  <text class="dg-sub" x="180" y="152">환형 대기</text>
  <g class="dg-node">
    <circle cx="180" cy="46" r="26" /><text class="dg-lg" x="180" y="46">P1</text>
    <circle cx="271.8" cy="205" r="26" /><text class="dg-lg" x="271.8" y="205">P2</text>
    <circle cx="88.2" cy="205" r="26" /><text class="dg-lg" x="88.2" y="205">P3</text>
  </g>
  <g class="dg-box">
    <rect x="250.8" y="82" width="42" height="34" rx="6" /><text class="dg-lg" x="271.8" y="99">R1</text>
    <rect x="159" y="241" width="42" height="34" rx="6" /><text class="dg-lg" x="180" y="258">R2</text>
    <rect x="67.2" y="82" width="42" height="34" rx="6" /><text class="dg-lg" x="88.2" y="99">R3</text>
  </g>
  <path class="dg-line dg-dash" d="M66 306 L96 306" marker-end="url(#dl-ah)" />
  <text class="dg-sub dg-start" x="104" y="307">요청(대기)</text>
  <path class="dg-line" d="M196 306 L226 306" marker-end="url(#dl-ah)" />
  <text class="dg-sub dg-start" x="234" y="307">점유(할당)</text>
</svg>`,
  },

  /** 32비트 띠의 경계 — 자릿수를 세는 일이라 글자로는 매번 다시 센다.
      /26을 본보기로 잡는다(두 시험의 도입부가 모두 그 수치로 계산을 보인다). */
  "subnet-bits": {
    alt: "IPv4 32비트를 가로 띠로 그린 그림. 앞 26비트는 네트워크부, 뒤 6비트는 호스트부이고, 호스트부 6비트가 전부 0이면 네트워크 주소, 전부 1이면 브로드캐스트 주소다.",
    caption: "경계를 긋는 것은 마스크의 `1`이 끝나는 자리다 — 호스트 6비트 `64`개에서 양 끝 둘을 빼 `62`대가 남는다.",
    svg: `<svg viewBox="0 0 360 152" class="dg-svg" focusable="false">
  <text class="dg-sub" x="153" y="24">네트워크부 — 마스크가 1</text>
  <text class="dg-sub" x="297" y="24">호스트부</text>
  <rect class="dg-box dg-on" x="36" y="40" width="234" height="22" />
  <rect class="dg-box" x="270" y="40" width="54" height="22" />
  <path class="dg-tick" d="M45 40 V62 M54 40 V62 M63 40 V62 M72 40 V62 M81 40 V62 M90 40 V62 M99 40 V62 M108 40 V62 M117 40 V62 M126 40 V62 M135 40 V62 M144 40 V62 M153 40 V62 M162 40 V62 M171 40 V62 M180 40 V62 M189 40 V62 M198 40 V62 M207 40 V62 M216 40 V62 M225 40 V62 M234 40 V62 M243 40 V62 M252 40 V62 M261 40 V62 M279 40 V62 M288 40 V62 M297 40 V62 M306 40 V62 M315 40 V62" />
  <path class="dg-line" d="M270 32 V70" />
  <text class="dg-sub" x="153" y="80">26비트 — /26</text>
  <text class="dg-sub" x="297" y="80">6비트 — 2⁶ = 64</text>
  <rect class="dg-box" x="270" y="94" width="54" height="20" />
  <path class="dg-tick" d="M279 94 V114 M288 94 V114 M297 94 V114 M306 94 V114 M315 94 V114" />
  <text class="dg-xs" x="274.5" y="104">0</text><text class="dg-xs" x="283.5" y="104">0</text><text class="dg-xs" x="292.5" y="104">0</text><text class="dg-xs" x="301.5" y="104">0</text><text class="dg-xs" x="310.5" y="104">0</text><text class="dg-xs" x="319.5" y="104">0</text>
  <text class="dg-sub dg-end" x="258" y="104">전부 0 → 네트워크 주소</text>
  <rect class="dg-box" x="270" y="118" width="54" height="20" />
  <path class="dg-tick" d="M279 118 V138 M288 118 V138 M297 118 V138 M306 118 V138 M315 118 V138" />
  <text class="dg-xs" x="274.5" y="128">1</text><text class="dg-xs" x="283.5" y="128">1</text><text class="dg-xs" x="292.5" y="128">1</text><text class="dg-xs" x="301.5" y="128">1</text><text class="dg-xs" x="310.5" y="128">1</text><text class="dg-xs" x="319.5" y="128">1</text>
  <text class="dg-sub dg-end" x="258" y="128">전부 1 → 브로드캐스트</text>
</svg>`,
  },

  /** 키 쌍의 주인이 쓰임에 따라 갈리는 자리 — 두 시험 모두 여기에 형광펜을 들고 있다.
      표로 세우면 거는 키와 푸는 키가 서로 남남으로 보인다. 한 쌍이 양 끝에 걸쳐 있다는
      것이 외울 전부라, 쌍을 괄호로 묶어 보여 준다. */
  "key-pair-cross": {
    alt: "송신자에서 수신자로 가는 두 줄기. 기밀성(암호화)은 수신자 공개키로 걸어 수신자 개인키로 풀고, 인증·부인방지(서명)는 송신자 개인키로 걸어 송신자 공개키로 푼다. 각 줄기의 두 키는 같은 사람의 키 쌍이다.",
    caption: "거는 키와 푸는 키는 늘 한 사람의 쌍이다 — 기밀성은 받는 사람 쌍, 서명은 보내는 사람 쌍.",
    svg: `<svg viewBox="0 0 360 184" class="dg-svg" focusable="false">
  <defs>
    <marker id="kp-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub dg-start" x="6" y="14">송신자</text>
  <text class="dg-sub dg-end" x="354" y="14">수신자</text>
  <text class="dg-sub" x="180" y="40">기밀성 — 암호화</text>
  <path class="dg-line" d="M62 60 H298" marker-end="url(#kp-ah)" />
  <rect class="dg-chip" x="70" y="50" width="86" height="20" rx="5" />
  <text class="dg-xs" x="113" y="60">수신자 공개키</text>
  <rect class="dg-chip" x="204" y="50" width="86" height="20" rx="5" />
  <text class="dg-xs" x="247" y="60">수신자 개인키</text>
  <path class="dg-line dg-dash" d="M113 74 V82 H247 V74" />
  <text class="dg-sub" x="180" y="94">수신자의 키 쌍</text>
  <text class="dg-sub" x="180" y="124">인증·부인방지 — 서명</text>
  <path class="dg-line" d="M62 144 H298" marker-end="url(#kp-ah)" />
  <rect class="dg-chip" x="70" y="134" width="86" height="20" rx="5" />
  <text class="dg-xs" x="113" y="144">송신자 개인키</text>
  <rect class="dg-chip" x="204" y="134" width="86" height="20" rx="5" />
  <text class="dg-xs" x="247" y="144">송신자 공개키</text>
  <path class="dg-line dg-dash" d="M113 158 V166 H247 V158" />
  <text class="dg-sub" x="180" y="178">송신자의 키 쌍</text>
</svg>`,
  },

  /** CBC의 사슬 — ECB와 갈리는 지점이 "물려 있다"는 모양 자체다.
      앞 블록의 암호문이 다음 블록의 XOR로 되돌아 들어가는 선이 이 그림의 주인공이다. */
  "cbc-chain": {
    alt: "CBC 모드의 블록 세 개. 각 블록은 평문을 XOR한 뒤 암호화해 암호문을 낸다. 첫 블록의 XOR에는 초기화 벡터 IV가 들어가고, 둘째부터는 앞 블록의 암호문이 되돌아 들어간다.",
    caption: "앞 블록의 암호문이 다음 블록으로 되돌아 물린다 — 그래서 암호화는 순차적이고, 첫 자리는 `IV`가 메운다.",
    svg: `<svg viewBox="0 0 360 192" class="dg-svg" focusable="false">
  <defs>
    <marker id="cbc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <g class="dg-box">
    <rect x="82" y="18" width="56" height="24" rx="5" /><text class="dg-lg" x="110" y="30">P1</text>
    <rect x="172" y="18" width="56" height="24" rx="5" /><text class="dg-lg" x="200" y="30">P2</text>
    <rect x="262" y="18" width="56" height="24" rx="5" /><text class="dg-lg" x="290" y="30">P3</text>
    <rect x="82" y="96" width="56" height="26" rx="5" /><text class="dg-xs" x="110" y="109">암호화</text>
    <rect x="172" y="96" width="56" height="26" rx="5" /><text class="dg-xs" x="200" y="109">암호화</text>
    <rect x="262" y="96" width="56" height="26" rx="5" /><text class="dg-xs" x="290" y="109">암호화</text>
    <rect x="8" y="60" width="46" height="20" rx="5" /><text class="dg-xs" x="31" y="70">IV</text>
  </g>
  <g class="dg-chip">
    <rect x="82" y="150" width="56" height="24" rx="5" /><text class="dg-lg" x="110" y="162">C1</text>
    <rect x="172" y="150" width="56" height="24" rx="5" /><text class="dg-lg" x="200" y="162">C2</text>
    <rect x="262" y="150" width="56" height="24" rx="5" /><text class="dg-lg" x="290" y="162">C3</text>
  </g>
  <g class="dg-node">
    <circle cx="110" cy="70" r="11" /><text class="dg-lg" x="110" y="70">⊕</text>
    <circle cx="200" cy="70" r="11" /><text class="dg-lg" x="200" y="70">⊕</text>
    <circle cx="290" cy="70" r="11" /><text class="dg-lg" x="290" y="70">⊕</text>
  </g>
  <g class="dg-line" marker-end="url(#cbc-ah)">
    <path d="M110 42 V55" /><path d="M200 42 V55" /><path d="M290 42 V55" />
    <path d="M110 81 V94" /><path d="M200 81 V94" /><path d="M290 81 V94" />
    <path d="M110 122 V148" /><path d="M200 122 V148" /><path d="M290 122 V148" />
    <path d="M54 70 H97" />
  </g>
  <g class="dg-line dg-dash" marker-end="url(#cbc-ah)">
    <path d="M138 162 H155 V70 H187" />
    <path d="M228 162 H245 V70 H277" />
  </g>
</svg>`,
  },

  /** 키의 중첩 — 슈퍼키 ⊇ 후보키이고 기본키·대체키는 그 안의 갈래다.
      "⊇"를 글로 읽으면 네 이름이 나란한 네 종류처럼 보인다. 담긴 모양으로 세운다. */
  "key-nesting": {
    alt: "세 겹 상자. 가장 바깥이 유일성만 만족하는 슈퍼키, 그 안이 최소성까지 만족하는 후보키, 가장 안쪽에 후보키를 나눠 가진 기본키와 대체키가 나란히 놓인다.",
    caption: "안으로 들어갈수록 조건이 하나씩 붙는다 — 기본키와 대체키는 후보키를 나눠 가진 것이지 다른 종류가 아니다.",
    svg: `<svg viewBox="0 0 360 170" class="dg-svg" focusable="false">
  <rect class="dg-box" x="14" y="28" width="332" height="128" rx="10" />
  <text class="dg-sub dg-start" x="28" y="44">슈퍼키 — 유일성</text>
  <rect class="dg-box" x="34" y="56" width="292" height="86" rx="9" />
  <text class="dg-sub dg-start" x="48" y="72">후보키 — 유일성 + 최소성</text>
  <rect class="dg-chip" x="52" y="86" width="130" height="44" rx="7" />
  <text class="dg-lg" x="117" y="102">기본키</text>
  <text class="dg-xs" x="117" y="118">대표로 뽑은 하나</text>
  <rect class="dg-chip" x="194" y="86" width="114" height="44" rx="7" />
  <text class="dg-lg" x="251" y="102">대체키</text>
  <text class="dg-xs" x="251" y="118">나머지 후보키</text>
</svg>`,
  },

  /** 순회 세 가지 — 트리 한 그루에 세 줄의 결과를 붙인다.
      외울 것은 "루트를 언제 보느냐"이므로 세 줄에서 루트 A의 자리만 짚는다. */
  "tree-traversal-order": {
    alt: "루트 A 아래 B와 C, 그 아래 D·E·F·G가 달린 이진 트리. 전위 순회는 A B D E C F G, 중위 순회는 D B E A F C G, 후위 순회는 D E B F G C A 순서이며 루트 A의 자리가 각각 맨 앞·가운데·맨 뒤다.",
    caption: "세 줄에서 루트 A의 자리만 앞·가운데·뒤로 옮겨 간다 — 이름의 전·중·후가 곧 그 자리다.",
    svg: `<svg viewBox="0 0 360 220" class="dg-svg" focusable="false">
  <g class="dg-line">
    <path d="M167.1 37.5 L116.9 74.5" /><path d="M192.9 37.5 L243.1 74.5" />
    <path d="M95.0 97.2 L74.9 126.8" /><path d="M113.0 97.2 L131.1 126.8" />
    <path d="M247.0 97.2 L227.0 126.8" /><path d="M265.0 97.2 L285.1 126.8" />
  </g>
  <g class="dg-node">
    <circle cx="180" cy="28" r="16" /><text class="dg-lg" x="180" y="28">A</text>
    <circle cx="104" cy="84" r="16" /><text class="dg-lg" x="104" y="84">B</text>
    <circle cx="256" cy="84" r="16" /><text class="dg-lg" x="256" y="84">C</text>
    <circle cx="66" cy="140" r="16" /><text class="dg-lg" x="66" y="140">D</text>
    <circle cx="142" cy="140" r="16" /><text class="dg-lg" x="142" y="140">E</text>
    <circle cx="218" cy="140" r="16" /><text class="dg-lg" x="218" y="140">F</text>
    <circle cx="294" cy="140" r="16" /><text class="dg-lg" x="294" y="140">G</text>
  </g>
  <text class="dg-sub dg-start" x="112" y="176">전위</text>
  <text class="dg-seq dg-start" x="146" y="176"><tspan class="dg-em">A</tspan> B D E C F G</text>
  <text class="dg-sub dg-start" x="112" y="194">중위</text>
  <text class="dg-seq dg-start" x="146" y="194">D B E <tspan class="dg-em">A</tspan> F C G</text>
  <text class="dg-sub dg-start" x="112" y="212">후위</text>
  <text class="dg-seq dg-start" x="146" y="212">D E B F G C <tspan class="dg-em">A</tspan></text>
</svg>`,
  },
};
