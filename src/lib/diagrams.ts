/** 개념 그림 — 도입부·암기 카드 본문의 "^ 이름" 블록이 가리키는 그림들.
 *
 *  기준은 "그림이 있으면 더 빨리 읽히는가"다. 다만 그림은 강조 층 중 가장 무거우므로
 *  **다른 블록이 이미 받는 자리는 비운다** — 순서(핸드셰이크·절차)는 MdBlocks의 "~ " 흐름,
 *  층(OSI·사다리)은 "# " 스택, 한두 축 대조는 형광펜, 세 축부터는 대조표의 몫이다.
 *  여기 남는 것은 고리 · 비트 자리 · 사슬 · 중첩 · 트리 · 궤적 · 기호 그 자체다.
 *
 *  계산 유형은 그림이 예제 수치를 새로 들여와도 된다(페이지 교체의 참조열, 디스크 헤드의 요청 큐).
 *  본문이 계산법만 말하고 수를 들지 않는 자리에서는 본보기 한 벌이 곧 설명이기 때문이다 —
 *  "본문에 없는 것을 그리지 않는다"는 처음의 규칙이 여기서만 느슨해진다.
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

  "er-symbols": {
    alt: "E-R 다이어그램의 기호 일곱. 개체는 사각형, 관계는 마름모, 속성은 타원이고, 기본키 속성은 타원 안에 밑줄, 다중값 속성은 이중 타원, 유도 속성은 점선 타원, 약한 개체는 이중 사각형이다.",
    caption: "기호가 그대로 출제된다 — 사각형·마름모·타원 셋을 먼저 붙이고 나머지는 그 위의 변형으로 외운다.",
    svg: `<svg viewBox="0 0 360 162" class="dg-svg" focusable="false">
  <g class="dg-box">
    <rect x="37" y="22" width="66" height="32" rx="3" /><text class="dg-xs" x="70" y="38">학생</text>
    <polygon points="180,20 222,38 180,56 138,38" /><text class="dg-xs" x="180" y="38">수강</text>
    <ellipse cx="290" cy="38" rx="38" ry="18" /><text class="dg-xs" x="290" y="38">이름</text>
  </g>
  <text class="dg-sub" x="70" y="72">개체 — 사각형</text>
  <text class="dg-sub" x="180" y="72">관계 — 마름모</text>
  <text class="dg-sub" x="290" y="72">속성 — 타원</text>
  <g class="dg-box">
    <ellipse cx="45" cy="112" rx="34" ry="16" />
    <ellipse cx="135" cy="112" rx="34" ry="16" /><ellipse cx="135" cy="112" rx="26" ry="10" />
    <ellipse class="dg-dot" cx="225" cy="112" rx="34" ry="16" />
    <rect x="279" y="94" width="72" height="36" rx="3" /><rect x="285" y="100" width="60" height="24" rx="2" />
  </g>
  <text class="dg-xs" x="45" y="110">학번</text>
  <path class="dg-line" d="M31 120 H59" />
  <text class="dg-xs" x="135" y="112">전화</text>
  <text class="dg-xs" x="225" y="112">나이</text>
  <text class="dg-xs" x="315" y="112">주문</text>
  <text class="dg-sub" x="45" y="146">기본키 — 밑줄</text>
  <text class="dg-sub" x="135" y="146">다중값 — 이중</text>
  <text class="dg-sub" x="225" y="146">유도 — 점선</text>
  <text class="dg-sub" x="315" y="146">약한 개체</text>
</svg>`,
  },

  "topology-shapes": {
    alt: "네 가지 토폴로지의 모양. 성형은 중앙 장치에 다섯 노드가 모여 붙고, 버스형은 하나의 공용 회선에 네 노드가 매달리며, 링형은 다섯 노드가 원형으로 이어지고, 망형은 다섯 노드가 서로 모두 직접 이어져 회선이 열 개다.",
    caption: "망형만 중계를 거치지 않는다 — 그 대가가 회선 수다. 노드 다섯이면 벌써 `10`개다.",
    svg: `<svg viewBox="0 0 360 228" class="dg-svg" focusable="false">
  <g class="dg-line dg-thin">
    <path d="M90 54 L90 24 M90 54 L122.3 44.7 M90 54 L110 78.3 M90 54 L70 78.3 M90 54 L57.7 44.7" />
    <path d="M226 48 H314 M240 48 V64 M262 48 V64 M284 48 V64 M306 48 V64" />
    <path d="M90 134 L122.3 154.7 M122.3 154.7 L110 188.3 M110 188.3 L70 188.3 M70 188.3 L57.7 154.7 M57.7 154.7 L90 134" />
    <path d="M270 134 L302.3 154.7 M270 134 L290 188.3 M270 134 L250 188.3 M270 134 L237.7 154.7 M302.3 154.7 L290 188.3 M302.3 154.7 L250 188.3 M302.3 154.7 L237.7 154.7 M290 188.3 L250 188.3 M290 188.3 L237.7 154.7 M250 188.3 L237.7 154.7" />
  </g>
  <g class="dg-node">
    <circle cx="90" cy="54" r="8" />
    <circle cx="90" cy="24" r="5" /><circle cx="122.3" cy="44.7" r="5" /><circle cx="110" cy="78.3" r="5" /><circle cx="70" cy="78.3" r="5" /><circle cx="57.7" cy="44.7" r="5" />
    <circle cx="240" cy="68" r="5" /><circle cx="262" cy="68" r="5" /><circle cx="284" cy="68" r="5" /><circle cx="306" cy="68" r="5" />
    <circle cx="90" cy="134" r="5" /><circle cx="122.3" cy="154.7" r="5" /><circle cx="110" cy="188.3" r="5" /><circle cx="70" cy="188.3" r="5" /><circle cx="57.7" cy="154.7" r="5" />
    <circle cx="270" cy="134" r="5" /><circle cx="302.3" cy="154.7" r="5" /><circle cx="290" cy="188.3" r="5" /><circle cx="250" cy="188.3" r="5" /><circle cx="237.7" cy="154.7" r="5" />
  </g>
  <text class="dg-sub" x="90" y="100">성형 — 중앙이 죽으면 전체</text>
  <text class="dg-sub" x="270" y="100">버스형 — 회선 하나에 매달린다</text>
  <text class="dg-sub" x="90" y="212">링형 — 한 방향으로 돈다</text>
  <text class="dg-sub" x="270" y="212">망형 — 회선 n(n-1)/2</text>
</svg>`,
  },

  "perm-umask": {
    alt: "파일 권한 9비트를 세 줄로 견준 그림. 기준값 666은 rw-rw-rw-, umask 027은 그룹의 w와 기타의 rwx 자리를 걷어내고, 그 결과 640은 rw-r-----이 된다.",
    caption: "뺄셈이 아니라 자리마다 걷어내는 것이다 — `umask 027`을 8진으로 빼면 `637`이지만 실제 권한은 `640`이다.",
    svg: `<svg viewBox="0 0 360 150" class="dg-svg" focusable="false">
  <text class="dg-sub" x="99" y="24">소유자</text>
  <text class="dg-sub" x="183" y="24">그룹</text>
  <text class="dg-sub" x="267" y="24">기타</text>
  <text class="dg-sub dg-end" x="52" y="49">기준값</text>
  <rect class="dg-box" x="60" y="36" width="26" height="26" /><text class="dg-xs" x="73" y="49">r</text>
  <rect class="dg-box" x="86" y="36" width="26" height="26" /><text class="dg-xs" x="99" y="49">w</text>
  <rect class="dg-box" x="112" y="36" width="26" height="26" /><text class="dg-xs" x="125" y="49">-</text>
  <rect class="dg-box" x="144" y="36" width="26" height="26" /><text class="dg-xs" x="157" y="49">r</text>
  <rect class="dg-box" x="170" y="36" width="26" height="26" /><text class="dg-xs" x="183" y="49">w</text>
  <rect class="dg-box" x="196" y="36" width="26" height="26" /><text class="dg-xs" x="209" y="49">-</text>
  <rect class="dg-box" x="228" y="36" width="26" height="26" /><text class="dg-xs" x="241" y="49">r</text>
  <rect class="dg-box" x="254" y="36" width="26" height="26" /><text class="dg-xs" x="267" y="49">w</text>
  <rect class="dg-box" x="280" y="36" width="26" height="26" /><text class="dg-xs" x="293" y="49">-</text>
  <text class="dg-seq dg-start" x="316" y="49">666</text>
  <text class="dg-sub dg-end" x="52" y="87">umask</text>
  <rect class="dg-box" x="60" y="74" width="26" height="26" /><text class="dg-xs" x="73" y="87">-</text>
  <rect class="dg-box" x="86" y="74" width="26" height="26" /><text class="dg-xs" x="99" y="87">-</text>
  <rect class="dg-box" x="112" y="74" width="26" height="26" /><text class="dg-xs" x="125" y="87">-</text>
  <rect class="dg-box" x="144" y="74" width="26" height="26" /><text class="dg-xs" x="157" y="87">-</text>
  <rect class="dg-box dg-on" x="170" y="74" width="26" height="26" /><text class="dg-xs" x="183" y="87">w</text>
  <rect class="dg-box" x="196" y="74" width="26" height="26" /><text class="dg-xs" x="209" y="87">-</text>
  <rect class="dg-box dg-on" x="228" y="74" width="26" height="26" /><text class="dg-xs" x="241" y="87">r</text>
  <rect class="dg-box dg-on" x="254" y="74" width="26" height="26" /><text class="dg-xs" x="267" y="87">w</text>
  <rect class="dg-box dg-on" x="280" y="74" width="26" height="26" /><text class="dg-xs" x="293" y="87">x</text>
  <text class="dg-seq dg-start" x="316" y="87">027</text>
  <text class="dg-sub dg-end" x="52" y="125">결과</text>
  <rect class="dg-box" x="60" y="112" width="26" height="26" /><text class="dg-xs" x="73" y="125">r</text>
  <rect class="dg-box" x="86" y="112" width="26" height="26" /><text class="dg-xs" x="99" y="125">w</text>
  <rect class="dg-box" x="112" y="112" width="26" height="26" /><text class="dg-xs" x="125" y="125">-</text>
  <rect class="dg-box" x="144" y="112" width="26" height="26" /><text class="dg-xs" x="157" y="125">r</text>
  <rect class="dg-box" x="170" y="112" width="26" height="26" /><text class="dg-xs" x="183" y="125">-</text>
  <rect class="dg-box" x="196" y="112" width="26" height="26" /><text class="dg-xs" x="209" y="125">-</text>
  <rect class="dg-box" x="228" y="112" width="26" height="26" /><text class="dg-xs" x="241" y="125">-</text>
  <rect class="dg-box" x="254" y="112" width="26" height="26" /><text class="dg-xs" x="267" y="125">-</text>
  <rect class="dg-box" x="280" y="112" width="26" height="26" /><text class="dg-xs" x="293" y="125">-</text>
  <text class="dg-seq dg-start" x="316" y="125">640</text>
</svg>`,
  },

  "memory-fit": {
    alt: "빈 공간 세 곳(20K·15K·30K)이 섞인 메모리 띠. 12K 요청에 대해 최초 적합은 앞쪽 20K, 최적 적합은 담을 수 있는 가장 작은 15K, 최악 적합은 가장 큰 30K를 고른다.",
    caption: "같은 요청이 전략마다 다른 자리에 들어간다 — 최적은 담을 수 있는 가장 작은 곳, 최악은 가장 큰 곳이다.",
    svg: `<svg viewBox="0 0 360 134" class="dg-svg" focusable="false">
  <defs>
    <marker id="mf-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <rect class="dg-chip" x="20" y="14" width="66" height="22" rx="5" />
  <text class="dg-xs" x="53" y="25">요청 12K</text>
  <g class="dg-box">
    <rect x="20" y="50" width="40" height="34" /><rect x="120" y="50" width="40" height="34" /><rect x="205" y="50" width="40" height="34" />
  </g>
  <g class="dg-box dg-on">
    <rect x="60" y="50" width="60" height="34" /><rect x="160" y="50" width="45" height="34" /><rect x="245" y="50" width="90" height="34" />
  </g>
  <text class="dg-xs" x="90" y="67">20K</text>
  <text class="dg-xs" x="182" y="67">15K</text>
  <text class="dg-xs" x="290" y="67">30K</text>
  <text class="dg-2xs" x="40" y="67">사용 중</text>
  <text class="dg-2xs" x="140" y="67">사용 중</text>
  <text class="dg-2xs" x="225" y="67">사용 중</text>
  <g class="dg-line" marker-end="url(#mf-ah)">
    <path d="M90 104 V88" /><path d="M182 104 V88" /><path d="M290 104 V88" />
  </g>
  <text class="dg-sub" x="90" y="118">최초 적합</text>
  <text class="dg-sub" x="182" y="118">최적 적합</text>
  <text class="dg-sub" x="290" y="118">최악 적합</text>
</svg>`,
  },

  "stack-frame": {
    alt: "스택 프레임을 높은 주소부터 쌓아 그린 그림. 위에서부터 복귀 주소, SFP, 카나리, 지역 변수 버퍼가 놓이고, 버퍼에서 넘친 쓰기가 위쪽 복귀 주소까지 올라간다.",
    caption: "버퍼는 위로 넘친다 — 넘친 쓰기가 닿는 곳이 복귀 주소이고, 그 앞을 막아선 것이 카나리다.",
    svg: `<svg viewBox="0 0 360 178" class="dg-svg" focusable="false">
  <defs>
    <marker id="sf-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <rect class="dg-chip" x="100" y="26" width="160" height="30" rx="4" />
  <text class="dg-xs" x="180" y="41">복귀 주소(RET)</text>
  <g class="dg-box">
    <rect x="100" y="60" width="160" height="30" rx="4" /><text class="dg-xs" x="180" y="75">SFP</text>
    <rect x="100" y="94" width="160" height="30" rx="4" /><text class="dg-xs" x="180" y="109">카나리</text>
    <rect x="100" y="128" width="160" height="30" rx="4" /><text class="dg-xs" x="180" y="143">버퍼 char[8]</text>
  </g>
  <path class="dg-line" d="M82 150 V34" marker-end="url(#sf-ah)" />
  <text class="dg-sub dg-end" x="72" y="92">넘친 쓰기</text>
  <text class="dg-sub dg-start" x="270" y="41">높은 주소</text>
  <text class="dg-sub dg-start" x="270" y="143">낮은 주소</text>
</svg>`,
  },

  "ipsec-modes": {
    alt: "IPSec 두 모드의 패킷 배치. 원본은 IP 헤더와 데이터뿐이고, 전송 모드는 원래 IP 헤더를 그대로 둔 채 ESP와 데이터를 보호하며, 터널 모드는 새 IP 헤더로 감싸 원래 헤더까지 보호 범위에 넣는다.",
    caption: "터널 모드는 원래 헤더까지 감싼다 — 그래서 내부 주소가 밖에서 보이지 않고, 게이트웨이 사이의 VPN이 이 모드를 쓴다.",
    svg: `<svg viewBox="0 0 360 224" class="dg-svg" focusable="false">
  <text class="dg-sub dg-end" x="72" y="33">원본</text>
  <g class="dg-box">
    <rect x="80" y="20" width="60" height="26" /><text class="dg-2xs" x="110" y="33">IP 헤더</text>
    <rect x="140" y="20" width="120" height="26" /><text class="dg-2xs" x="200" y="33">데이터</text>
  </g>
  <text class="dg-sub dg-end" x="72" y="93">전송 모드</text>
  <g class="dg-box">
    <rect x="80" y="80" width="60" height="26" /><text class="dg-2xs" x="110" y="93">IP 헤더</text>
  </g>
  <g class="dg-box dg-on">
    <rect x="140" y="80" width="40" height="26" /><text class="dg-2xs" x="160" y="93">ESP</text>
    <rect x="180" y="80" width="120" height="26" /><text class="dg-2xs" x="240" y="93">데이터</text>
  </g>
  <path class="dg-line dg-dash" d="M140 112 V120 H300 V112" />
  <text class="dg-sub" x="220" y="132">보호 범위</text>
  <text class="dg-sub dg-end" x="72" y="165">터널 모드</text>
  <g class="dg-box">
    <rect x="80" y="152" width="70" height="26" /><text class="dg-2xs" x="115" y="165">새 IP 헤더</text>
  </g>
  <g class="dg-box dg-on">
    <rect x="150" y="152" width="40" height="26" /><text class="dg-2xs" x="170" y="165">ESP</text>
    <rect x="190" y="152" width="60" height="26" /><text class="dg-2xs" x="220" y="165">IP 헤더</text>
    <rect x="250" y="152" width="90" height="26" /><text class="dg-2xs" x="295" y="165">데이터</text>
  </g>
  <path class="dg-line dg-dash" d="M150 184 V192 H340 V184" />
  <text class="dg-sub" x="245" y="204">보호 범위 — 원래 헤더까지</text>
</svg>`,
  },

  "ip-header": {
    alt: "IPv4 헤더를 32비트 한 줄씩 다섯 줄로 그린 격자. 첫 줄은 버전·헤더 길이·서비스 타입·전체 길이, 둘째 줄은 식별자·플래그·단편 오프셋, 셋째 줄은 TTL·프로토콜·헤더 체크섬, 넷째와 다섯째 줄은 출발지와 목적지 IP 주소다.",
    caption: "한 줄이 32비트 한 워드다 — 헤더 길이를 워드 단위로 세는 이유가 여기 있고, 체크섬이 덮는 것도 이 격자뿐이다.",
    svg: `<svg viewBox="0 0 360 176" class="dg-svg" focusable="false">
  <text class="dg-sub dg-start" x="20" y="26">비트 0</text><text class="dg-sub" x="180" y="26">16</text><text class="dg-sub dg-end" x="340" y="26">31</text>
  <rect class="dg-box" x="20" y="36" width="40" height="26" /><text class="dg-2xs" x="40" y="49">버전</text>
  <rect class="dg-box" x="60" y="36" width="40" height="26" /><text class="dg-2xs" x="80" y="49">길이</text>
  <rect class="dg-box" x="100" y="36" width="80" height="26" /><text class="dg-xs" x="140" y="49">서비스 타입</text>
  <rect class="dg-box" x="180" y="36" width="160" height="26" /><text class="dg-xs" x="260" y="49">전체 길이</text>
  <rect class="dg-box" x="20" y="62" width="160" height="26" /><text class="dg-xs" x="100" y="75">식별자</text>
  <rect class="dg-box" x="180" y="62" width="30" height="26" /><text class="dg-2xs" x="195" y="75">플래그</text>
  <rect class="dg-box" x="210" y="62" width="130" height="26" /><text class="dg-xs" x="275" y="75">단편 오프셋</text>
  <rect class="dg-box" x="20" y="88" width="80" height="26" /><text class="dg-xs" x="60" y="101">TTL</text>
  <rect class="dg-box" x="100" y="88" width="80" height="26" /><text class="dg-xs" x="140" y="101">프로토콜</text>
  <rect class="dg-box dg-on" x="180" y="88" width="160" height="26" /><text class="dg-xs" x="260" y="101">헤더 체크섬</text>
  <rect class="dg-box" x="20" y="114" width="320" height="26" /><text class="dg-xs" x="180" y="127">출발지 IP 주소</text>
  <rect class="dg-box" x="20" y="140" width="320" height="26" /><text class="dg-xs" x="180" y="153">목적지 IP 주소</text>
</svg>`,
  },

  "disk-head-path": {
    alt: "디스크 헤드의 이동 궤적 두 가지. 현재 53번 실린더에서 출발해 SSTF는 65·37·14·98·122 순으로 가까운 쪽부터 꺾어 다니고, SCAN은 65·98·122를 지나 끝까지 올라갔다가 방향을 바꿔 37·14로 내려온다.",
    caption: "SSTF는 가까운 쪽으로 꺾어 다녀 이동이 짧지만 멀리 있는 요청이 밀린다 — SCAN은 끝까지 훑어 그 밀림을 없앤다.",
    svg: `<svg viewBox="0 0 360 284" class="dg-svg" focusable="false">
  <text class="dg-2xs" x="180" y="14">현재 53 · 요청 98 · 37 · 122 · 14 · 65</text>
  <text class="dg-sub dg-start" x="20" y="34">SSTF — 가까운 것부터</text>
  <path class="dg-tick" d="M30 48 H328.5 M30 44 V52 M109.5 44 V52 M328.5 44 V52" />
  <text class="dg-2xs dg-start" x="30" y="62">0</text>
  <text class="dg-2xs dg-end" x="328.5" y="62">199</text>
  <path class="dg-line" d="M109.5 74 L127.5 87 L85.5 100 L51 113 L177 126 L213 139" />
  <g class="dg-node"><circle cx="109.5" cy="74" r="4" /><circle cx="127.5" cy="87" r="4" /><circle cx="85.5" cy="100" r="4" /><circle cx="51" cy="113" r="4" /><circle cx="177" cy="126" r="4" /><circle cx="213" cy="139" r="4" /></g>
  <text class="dg-2xs dg-start" x="118.5" y="65">53</text><text class="dg-2xs dg-start" x="136.5" y="78">65</text><text class="dg-2xs dg-start" x="94.5" y="91">37</text><text class="dg-2xs dg-start" x="60.0" y="104">14</text><text class="dg-2xs dg-start" x="186.0" y="117">98</text><text class="dg-2xs dg-start" x="222.0" y="130">122</text>
  <text class="dg-sub dg-start" x="20" y="166">SCAN — 한 방향으로 훑고 되돌아온다</text>
  <path class="dg-tick" d="M30 180 H328.5 M30 176 V184 M109.5 176 V184 M328.5 176 V184" />
  <path class="dg-line" d="M109.5 194 L127.5 207 L177 220 L213 233 L328.5 246 L85.5 259 L51 272" />
  <g class="dg-node"><circle cx="109.5" cy="194" r="4" /><circle cx="127.5" cy="207" r="4" /><circle cx="177" cy="220" r="4" /><circle cx="213" cy="233" r="4" /><circle cx="328.5" cy="246" r="4" /><circle cx="85.5" cy="259" r="4" /><circle cx="51" cy="272" r="4" /></g>
  <text class="dg-2xs dg-start" x="118.5" y="185">53</text><text class="dg-2xs dg-start" x="136.5" y="198">65</text><text class="dg-2xs dg-start" x="186.0" y="211">98</text><text class="dg-2xs dg-start" x="222.0" y="224">122</text><text class="dg-2xs dg-end" x="319.5" y="237">199</text><text class="dg-2xs dg-start" x="94.5" y="250">37</text><text class="dg-2xs dg-start" x="60.0" y="263">14</text>
</svg>`,
  },

  "page-trace": {
    alt: "프레임 세 칸에 FIFO로 페이지를 채우는 표. 참조열 7 0 1 2 0 3 0 4에 대해 들어온 순서대로 내보내며, 여덟 번 참조 중 다섯 번째만 적중이고 나머지 일곱 번은 페이지 폴트다.",
    caption: "FIFO는 들어온 순서대로 내보낸다 — 여덟 번 참조에 폴트 일곱, 적중은 한 번뿐이다. 바뀐 칸만 색이 들어 있다.",
    svg: `<svg viewBox="0 0 360 150" class="dg-svg" focusable="false">
  <text class="dg-sub dg-end" x="52" y="28">참조열</text>
  <text class="dg-seq" x="77" y="28">7</text>
  <text class="dg-seq" x="111" y="28">0</text>
  <text class="dg-seq" x="145" y="28">1</text>
  <text class="dg-seq" x="179" y="28">2</text>
  <text class="dg-seq" x="213" y="28">0</text>
  <text class="dg-seq" x="247" y="28">3</text>
  <text class="dg-seq" x="281" y="28">0</text>
  <text class="dg-seq" x="315" y="28">4</text>
  <rect class="dg-box" x="60" y="40" width="272" height="78" rx="5" />
  <path class="dg-tick" d="M94 40 V118 M128 40 V118 M162 40 V118 M196 40 V118 M230 40 V118 M264 40 V118 M298 40 V118 M60 66 H332 M60 92 H332" />
  <text class="dg-sub dg-end" x="52" y="53">프레임 1</text>
  <text class="dg-seq dg-em" x="77" y="53">7</text>
  <text class="dg-seq" x="111" y="53">7</text>
  <text class="dg-seq" x="145" y="53">7</text>
  <text class="dg-seq dg-em" x="179" y="53">2</text>
  <text class="dg-seq" x="213" y="53">2</text>
  <text class="dg-seq" x="247" y="53">2</text>
  <text class="dg-seq" x="281" y="53">2</text>
  <text class="dg-seq dg-em" x="315" y="53">4</text>
  <text class="dg-sub dg-end" x="52" y="79">프레임 2</text>
  <text class="dg-seq dg-em" x="111" y="79">0</text>
  <text class="dg-seq" x="145" y="79">0</text>
  <text class="dg-seq" x="179" y="79">0</text>
  <text class="dg-seq" x="213" y="79">0</text>
  <text class="dg-seq dg-em" x="247" y="79">3</text>
  <text class="dg-seq" x="281" y="79">3</text>
  <text class="dg-seq" x="315" y="79">3</text>
  <text class="dg-sub dg-end" x="52" y="105">프레임 3</text>
  <text class="dg-seq dg-em" x="145" y="105">1</text>
  <text class="dg-seq" x="179" y="105">1</text>
  <text class="dg-seq" x="213" y="105">1</text>
  <text class="dg-seq" x="247" y="105">1</text>
  <text class="dg-seq dg-em" x="281" y="105">0</text>
  <text class="dg-seq" x="315" y="105">0</text>
  <text class="dg-sub dg-end" x="52" y="140">폴트</text>
  <text class="dg-seq dg-em" x="77" y="140">●</text>
  <text class="dg-seq dg-em" x="111" y="140">●</text>
  <text class="dg-seq dg-em" x="145" y="140">●</text>
  <text class="dg-seq dg-em" x="179" y="140">●</text>
  <text class="dg-sub" x="213" y="140">적중</text>
  <text class="dg-seq dg-em" x="247" y="140">●</text>
  <text class="dg-seq dg-em" x="281" y="140">●</text>
  <text class="dg-seq dg-em" x="315" y="140">●</text>
</svg>`,
  },

  "rpo-rto": {
    alt: "장애 발생 시점을 가운데 둔 시간축. 왼쪽은 마지막 백업부터 장애까지로 잃는 데이터의 폭인 RPO이고, 오른쪽은 장애부터 서비스 재개까지로 멈춰 있는 시간인 RTO다.",
    caption: "사고 시점을 가운데 두고 왼쪽이 잃는 데이터(`RPO`), 오른쪽이 멈춘 시간(`RTO`)이다.",
    svg: `<svg viewBox="0 0 360 142" class="dg-svg" focusable="false">
  <defs>
    <marker id="rr-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub" x="80" y="30">마지막 백업</text>
  <text class="dg-sub" x="180" y="30">장애 발생</text>
  <text class="dg-sub" x="290" y="30">서비스 재개</text>
  <path class="dg-line" d="M20 62 H340" marker-end="url(#rr-ah)" />
  <path class="dg-tick" d="M80 44 V80 M290 44 V80" />
  <path class="dg-line" d="M180 40 V84" />
  <g class="dg-node">
    <circle cx="80" cy="62" r="5" /><circle cx="290" cy="62" r="5" />
  </g>
  <path class="dg-line dg-dash" d="M80 96 H180" marker-start="url(#rr-ah)" marker-end="url(#rr-ah)" />
  <path class="dg-line dg-dash" d="M180 96 H290" marker-start="url(#rr-ah)" marker-end="url(#rr-ah)" />
  <text class="dg-sub" x="130" y="114">RPO</text>
  <text class="dg-sub" x="235" y="114">RTO</text>
  <text class="dg-2xs" x="130" y="130">잃어도 되는 데이터</text>
  <text class="dg-2xs" x="235" y="130">멈춰 있어도 되는 시간</text>
</svg>`,
  },

  "array-pointer": {
    alt: "정수 배열 a의 다섯 칸을 늘어놓은 그림. 각 칸에 값과 주소(100·104·108·112·116)가 적혀 있고, 포인터 p는 첫 칸을, p+1은 둘째 칸을 가리켜 주소가 4만큼 커진다.",
    caption: "`p+1`은 1바이트가 아니라 자료형 한 칸이다 — `int`면 주소가 `4`만큼 커진다.",
    svg: `<svg viewBox="0 0 360 162" class="dg-svg" focusable="false">
  <defs>
    <marker id="ap-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-2xs" x="58" y="28">a[0]</text><text class="dg-2xs" x="114" y="28">a[1]</text><text class="dg-2xs" x="170" y="28">a[2]</text><text class="dg-2xs" x="226" y="28">a[3]</text><text class="dg-2xs" x="282" y="28">a[4]</text>
  <g class="dg-box">
    <rect x="30" y="40" width="56" height="38" /><rect x="86" y="40" width="56" height="38" /><rect x="142" y="40" width="56" height="38" /><rect x="198" y="40" width="56" height="38" /><rect x="254" y="40" width="56" height="38" />
  </g>
  <text class="dg-xs" x="58" y="54">10</text><text class="dg-xs" x="114" y="54">20</text><text class="dg-xs" x="170" y="54">30</text><text class="dg-xs" x="226" y="54">40</text><text class="dg-xs" x="282" y="54">50</text>
  <text class="dg-2xs" x="58" y="70">100</text><text class="dg-2xs" x="114" y="70">104</text><text class="dg-2xs" x="170" y="70">108</text><text class="dg-2xs" x="226" y="70">112</text><text class="dg-2xs" x="282" y="70">116</text>
  <g class="dg-line" marker-end="url(#ap-ah)">
    <path d="M58 104 V82" /><path d="M114 104 V82" />
  </g>
  <text class="dg-sub" x="58" y="118">p</text>
  <text class="dg-sub" x="114" y="118">p+1</text>
  <path class="dg-line dg-dash" d="M58 132 V140 H114 V132" />
  <text class="dg-sub" x="86" y="152">주소는 4만큼 커진다</text>
</svg>`,
  },

  "stack-queue-ends": {
    alt: "스택과 큐의 입출구를 견준 그림. 스택은 위쪽 한 끝으로만 push와 pop이 드나들고, 큐는 오른쪽 뒤로 넣어 왼쪽 앞으로 빠진다.",
    caption: "스택은 한쪽 끝만 열려 있고 큐는 양 끝이 열려 있다 — 입구와 출구가 같은가 다른가가 LIFO와 FIFO를 가른다.",
    svg: `<svg viewBox="0 0 360 276" class="dg-svg" focusable="false">
  <defs>
    <marker id="sq-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub" x="155" y="26">push</text>
  <text class="dg-sub" x="205" y="26">pop</text>
  <g class="dg-line" marker-end="url(#sq-ah)">
    <path d="M155 36 V62" /><path d="M205 62 V36" />
  </g>
  <g class="dg-box">
    <rect x="135" y="70" width="90" height="28" /><rect x="135" y="98" width="90" height="28" /><rect x="135" y="126" width="90" height="28" />
  </g>
  <text class="dg-xs" x="180" y="84">C — top</text>
  <text class="dg-xs" x="180" y="112">B</text>
  <text class="dg-xs" x="180" y="140">A</text>
  <text class="dg-sub" x="180" y="174">스택 — 한쪽 끝(top)만 열린다</text>
  <g class="dg-box">
    <rect x="105" y="210" width="50" height="28" /><rect x="155" y="210" width="50" height="28" /><rect x="205" y="210" width="50" height="28" /><rect x="255" y="210" width="50" height="28" />
  </g>
  <text class="dg-xs" x="130" y="224">A</text><text class="dg-xs" x="180" y="224">B</text><text class="dg-xs" x="230" y="224">C</text><text class="dg-xs" x="280" y="224">D</text>
  <g class="dg-line" marker-end="url(#sq-ah)">
    <path d="M345 224 H310" /><path d="M100 224 H64" />
  </g>
  <text class="dg-sub dg-end" x="352" y="200">enqueue — rear</text>
  <text class="dg-sub dg-start" x="58" y="200">dequeue — front</text>
  <text class="dg-sub" x="180" y="262">큐 — 뒤로 넣고 앞에서 뺀다</text>
</svg>`,
  },

  "hash-bucket": {
    alt: "해시 테이블의 버킷 일곱 칸. 키 8은 1번, 20은 6번 칸에 들어가고, 3번 칸으로 몰린 17·24·31은 옆으로 이어 붙은 연결 리스트가 된다.",
    caption: "해시 값이 곧 자리다 — 같은 자리로 온 것을 옆으로 이어 붙이면 체이닝, 빈 칸을 찾아 옮기면 개방 주소법이다.",
    svg: `<svg viewBox="0 0 360 206" class="dg-svg" focusable="false">
  <defs>
    <marker id="hb-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub" x="150" y="18">h(k) = k mod 7</text>
  <g class="dg-box">
    <rect x="120" y="30" width="60" height="22" /><rect x="120" y="52" width="60" height="22" /><rect x="120" y="74" width="60" height="22" />
    <rect x="120" y="118" width="60" height="22" /><rect x="120" y="140" width="60" height="22" /><rect x="120" y="162" width="60" height="22" />
  </g>
  <rect class="dg-box dg-on" x="120" y="96" width="60" height="22" />
  <text class="dg-2xs dg-end" x="112" y="41">0</text><text class="dg-2xs dg-end" x="112" y="63">1</text><text class="dg-2xs dg-end" x="112" y="85">2</text><text class="dg-2xs dg-end" x="112" y="107">3</text><text class="dg-2xs dg-end" x="112" y="129">4</text><text class="dg-2xs dg-end" x="112" y="151">5</text><text class="dg-2xs dg-end" x="112" y="173">6</text>
  <text class="dg-xs" x="150" y="63">8</text>
  <text class="dg-xs" x="150" y="107">17</text>
  <text class="dg-xs" x="150" y="173">20</text>
  <g class="dg-box">
    <rect x="202" y="96" width="54" height="22" rx="4" /><rect x="278" y="96" width="54" height="22" rx="4" />
  </g>
  <text class="dg-xs" x="229" y="107">24</text>
  <text class="dg-xs" x="305" y="107">31</text>
  <g class="dg-line" marker-end="url(#hb-ah)">
    <path d="M180 107 H198" /><path d="M256 107 H274" />
  </g>
  <text class="dg-sub" x="267" y="138">체이닝 — 같은 자리를 잇는다</text>
</svg>`,
  },

  "gantt-chart": {
    alt: "같은 작업 셋(P1 7 · P2 4 · P3 1, 모두 0에 도착)을 FCFS와 SJF로 돌린 간트 차트. FCFS는 도착 순서대로 P1·P2·P3를 처리해 평균 대기가 6이고, SJF는 짧은 것부터 P3·P2·P1을 처리해 평균 대기가 2다.",
    caption: "짧은 것을 먼저 보내면 뒤에 선 모두의 기다림이 줄어든다 — 같은 작업 셋에 평균 대기가 `6`에서 `2`로 바뀐다.",
    svg: `<svg viewBox="0 0 360 196" class="dg-svg" focusable="false">
  <text class="dg-sub" x="180" y="20">P1 7 · P2 4 · P3 1 — 모두 0에 도착</text>
  <text class="dg-sub dg-end" x="34" y="59">FCFS</text>
  <g class="dg-box">
    <rect x="40" y="46" width="168" height="26" /><rect x="208" y="46" width="96" height="26" />
  </g>
  <rect class="dg-box dg-on" x="304" y="46" width="24" height="26" />
  <text class="dg-xs" x="124" y="59">P1</text><text class="dg-xs" x="256" y="59">P2</text><text class="dg-2xs" x="316" y="59">P3</text>
  <text class="dg-2xs" x="40" y="84">0</text><text class="dg-2xs" x="208" y="84">7</text><text class="dg-2xs" x="304" y="84">11</text><text class="dg-2xs" x="328" y="84">12</text>
  <text class="dg-sub" x="180" y="102">평균 대기 (0+7+11)/3 = 6</text>
  <text class="dg-sub dg-end" x="34" y="137">SJF</text>
  <rect class="dg-box dg-on" x="40" y="124" width="24" height="26" />
  <g class="dg-box">
    <rect x="64" y="124" width="96" height="26" /><rect x="160" y="124" width="168" height="26" />
  </g>
  <text class="dg-2xs" x="52" y="137">P3</text><text class="dg-xs" x="112" y="137">P2</text><text class="dg-xs" x="244" y="137">P1</text>
  <text class="dg-2xs" x="40" y="162">0</text><text class="dg-2xs" x="64" y="162">1</text><text class="dg-2xs" x="160" y="162">5</text><text class="dg-2xs" x="328" y="162">12</text>
  <text class="dg-sub" x="180" y="180">평균 대기 (0+1+5)/3 = 2</text>
</svg>`,
  },

  "dirty-read": {
    alt: "두 트랜잭션의 시간선. T1이 값을 바꾼 뒤 아직 커밋하지 않은 사이에 T2가 그 값을 읽고, T1은 그 뒤 롤백해 T2가 읽은 값은 존재한 적 없는 값이 된다.",
    caption: "커밋 전 값을 읽은 뒤 그 트랜잭션이 되돌아가면, T2가 손에 쥔 값은 존재한 적 없는 값이 된다.",
    svg: `<svg viewBox="0 0 360 176" class="dg-svg" focusable="false">
  <defs>
    <marker id="dr-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub dg-end" x="30" y="56">T1</text>
  <path class="dg-line" d="M40 56 H336" marker-end="url(#dr-ah)" />
  <g class="dg-box">
    <rect x="56" y="44" width="104" height="24" rx="4" /><rect x="234" y="44" width="86" height="24" rx="4" />
  </g>
  <text class="dg-2xs" x="108" y="56">UPDATE 잔액</text>
  <text class="dg-2xs" x="277" y="56">ROLLBACK</text>
  <text class="dg-sub dg-end" x="30" y="132">T2</text>
  <path class="dg-line" d="M40 132 H336" marker-end="url(#dr-ah)" />
  <rect class="dg-chip" x="150" y="120" width="86" height="24" rx="4" />
  <text class="dg-2xs" x="193" y="132">SELECT 잔액</text>
  <path class="dg-line dg-dash" d="M193 118 V70" marker-end="url(#dr-ah)" />
  <text class="dg-sub dg-start" x="204" y="96">아직 커밋되지 않은 값</text>
  <text class="dg-2xs dg-end" x="336" y="160">시간 →</text>
</svg>`,
  },

  "dmz-layout": {
    alt: "방화벽 두 겹 사이에 DMZ를 둔 구성. 인터넷에서 방화벽을 지나면 웹·메일 서버가 놓인 DMZ가 있고, 그 다음 방화벽을 한 겹 더 지나야 내부망에 닿는다.",
    caption: "DMZ는 방화벽 둘 사이의 완충지다 — 밖에서 닿아야 하는 서버를 내부망과 같은 자리에 두지 않는다.",
    svg: `<svg viewBox="0 0 360 134" class="dg-svg" focusable="false">
  <g class="dg-box">
    <rect x="6" y="52" width="52" height="34" rx="4" /><text class="dg-2xs" x="32" y="69">인터넷</text>
    <rect x="302" y="52" width="52" height="34" rx="4" /><text class="dg-2xs" x="328" y="69">내부망</text>
  </g>
  <g class="dg-chip">
    <rect x="70" y="46" width="44" height="46" rx="4" /><text class="dg-2xs" x="92" y="69">방화벽</text>
    <rect x="246" y="46" width="44" height="46" rx="4" /><text class="dg-2xs" x="268" y="69">방화벽</text>
  </g>
  <rect class="dg-box" x="126" y="34" width="108" height="70" rx="6" />
  <text class="dg-2xs" x="180" y="46">DMZ</text>
  <g class="dg-box">
    <rect x="132" y="56" width="46" height="30" rx="4" /><text class="dg-2xs" x="155" y="71">웹</text>
    <rect x="182" y="56" width="46" height="30" rx="4" /><text class="dg-2xs" x="205" y="71">메일</text>
  </g>
  <path class="dg-line" d="M58 69 H70 M114 69 H126 M234 69 H246 M290 69 H302" />
  <text class="dg-sub" x="180" y="122">밖에서 닿는 것만 DMZ에 둔다</text>
</svg>`,
  },

  "mitm-arp": {
    alt: "정상 경로와 ARP 스푸핑 경로를 견준 그림. 정상일 때는 피해자에서 게이트웨이로 곧장 가지만, 스푸핑이 걸리면 피해자의 트래픽이 공격자를 거쳐 게이트웨이로 흐른다.",
    caption: "거짓 ARP 응답 한 번이면 경로가 한 칸 꺾인다 — 공격자가 그대로 흘려보내므로 양쪽은 눈치채지 못한다.",
    svg: `<svg viewBox="0 0 360 220" class="dg-svg" focusable="false">
  <defs>
    <marker id="ma-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub" x="180" y="22">정상</text>
  <g class="dg-box">
    <rect x="30" y="36" width="56" height="28" rx="4" /><text class="dg-2xs" x="58" y="50">피해자</text>
    <rect x="274" y="36" width="56" height="28" rx="4" /><text class="dg-2xs" x="302" y="50">게이트웨이</text>
  </g>
  <path class="dg-line" d="M90 50 H270" marker-end="url(#ma-ah)" />
  <text class="dg-sub" x="180" y="104">ARP 스푸핑 — "그 IP의 MAC은 나다"</text>
  <g class="dg-box">
    <rect x="30" y="120" width="56" height="28" rx="4" /><text class="dg-2xs" x="58" y="134">피해자</text>
    <rect x="274" y="120" width="56" height="28" rx="4" /><text class="dg-2xs" x="302" y="134">게이트웨이</text>
  </g>
  <rect class="dg-chip" x="146" y="174" width="68" height="28" rx="4" />
  <text class="dg-2xs" x="180" y="188">공격자</text>
  <g class="dg-line" marker-end="url(#ma-ah)">
    <path d="M70 152 L168 170" /><path d="M192 170 L290 152" />
  </g>
</svg>`,
  },

  "pki-trust": {
    alt: "PKI 신뢰 구조 두 가지. 계층형은 루트 CA 아래로 하위 CA와 사용자가 뻗는 나무이고, 메시형은 대등한 CA 셋이 서로를 상호 인증해 삼각형으로 이어진다.",
    caption: "계층형은 위가 무너지면 전체가 흔들리고, 메시형은 피해가 국지적인 대신 경로 찾기가 복잡해진다.",
    svg: `<svg viewBox="0 0 360 186" class="dg-svg" focusable="false">
  <defs>
    <marker id="pk-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <g class="dg-line dg-thin">
    <path d="M90 44 L54 68" /><path d="M90 44 L126 68" />
    <path d="M54 94 L42 114" /><path d="M54 94 L66 114" /><path d="M126 94 L114 114" /><path d="M126 94 L138 114" />
  </g>
  <g class="dg-chip">
    <rect x="66" y="22" width="48" height="22" rx="4" /><text class="dg-2xs" x="90" y="33">루트 CA</text>
  </g>
  <g class="dg-box">
    <rect x="30" y="72" width="48" height="22" rx="4" /><text class="dg-2xs" x="54" y="83">하위 CA</text>
    <rect x="102" y="72" width="48" height="22" rx="4" /><text class="dg-2xs" x="126" y="83">하위 CA</text>
  </g>
  <g class="dg-node">
    <circle cx="42" cy="120" r="6" /><circle cx="66" cy="120" r="6" /><circle cx="114" cy="120" r="6" /><circle cx="138" cy="120" r="6" />
  </g>
  <g class="dg-line dg-thin" marker-start="url(#pk-ah)" marker-end="url(#pk-ah)">
    <path d="M262 46 L242 74" /><path d="M278 46 L298 74" /><path d="M258 88 L282 88" />
  </g>
  <g class="dg-box">
    <rect x="246" y="24" width="48" height="22" rx="4" /><text class="dg-2xs" x="270" y="35">CA</text>
    <rect x="210" y="76" width="48" height="22" rx="4" /><text class="dg-2xs" x="234" y="87">CA</text>
    <rect x="282" y="76" width="48" height="22" rx="4" /><text class="dg-2xs" x="306" y="87">CA</text>
  </g>
  <text class="dg-sub" x="90" y="158">계층형 — 경로가 단순하다</text>
  <text class="dg-sub" x="270" y="158">메시형 — 서로 상호 인증</text>
</svg>`,
  },

  "txn-states": {
    alt: "트랜잭션의 상태 전이. 활동에서 부분 완료를 거쳐 완료로 가거나, 활동이나 부분 완료에서 실패로 떨어져 철회로 간다.",
    caption: "완료로 가는 길은 하나뿐이고 어디서 넘어지든 철회로 모인다 — 절반만 반영되는 자리는 없다.",
    svg: `<svg viewBox="0 0 360 164" class="dg-svg" focusable="false">
  <defs>
    <marker id="tx-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <g class="dg-line" marker-end="url(#tx-ah)">
    <path d="M97 40 H141" /><path d="M217 40 H261" />
    <path d="M60 56 L104 104" /><path d="M176 56 L140 104" />
    <path d="M157 120 H226" />
  </g>
  <g class="dg-box">
    <rect x="25" y="26" width="72" height="28" rx="4" /><text class="dg-xs" x="61" y="40">활동</text>
    <rect x="145" y="26" width="72" height="28" rx="4" /><text class="dg-2xs" x="181" y="40">부분 완료</text>
    <rect x="85" y="106" width="72" height="28" rx="4" /><text class="dg-xs" x="121" y="120">실패</text>
  </g>
  <g class="dg-chip">
    <rect x="265" y="26" width="72" height="28" rx="4" /><text class="dg-xs" x="301" y="40">완료</text>
    <rect x="229" y="106" width="72" height="28" rx="4" /><text class="dg-xs" x="265" y="120">철회</text>
  </g>
</svg>`,
  },

  "index-cluster": {
    alt: "클러스터드 인덱스와 넌클러스터드 인덱스의 배치. 클러스터드는 테이블의 행 자체가 키 순서로 줄 서 있고, 넌클러스터드는 키만 따로 정렬해 두고 화살표로 흩어진 행을 가리킨다.",
    caption: "클러스터드는 테이블 자체를 줄 세우므로 하나뿐이고, 넌클러스터드는 따로 선 뒤 행을 가리킨다.",
    svg: `<svg viewBox="0 0 360 216" class="dg-svg" focusable="false">
  <defs>
    <marker id="ic-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
    </marker>
  </defs>
  <text class="dg-sub" x="180" y="20">클러스터드 — 테이블 자체가 키 순서</text>
  <g class="dg-box dg-on">
    <rect x="50" y="32" width="52" height="26" /><rect x="102" y="32" width="52" height="26" /><rect x="154" y="32" width="52" height="26" /><rect x="206" y="32" width="52" height="26" /><rect x="258" y="32" width="52" height="26" />
  </g>
  <text class="dg-xs" x="76" y="45">1</text><text class="dg-xs" x="128" y="45">2</text><text class="dg-xs" x="180" y="45">3</text><text class="dg-xs" x="232" y="45">4</text><text class="dg-xs" x="284" y="45">5</text>
  <text class="dg-sub" x="180" y="94">넌클러스터드 — 따로 서서 행을 가리킨다</text>
  <g class="dg-chip">
    <rect x="50" y="106" width="52" height="26" /><rect x="102" y="106" width="52" height="26" /><rect x="154" y="106" width="52" height="26" /><rect x="206" y="106" width="52" height="26" /><rect x="258" y="106" width="52" height="26" />
  </g>
  <text class="dg-xs" x="76" y="119">1</text><text class="dg-xs" x="128" y="119">2</text><text class="dg-xs" x="180" y="119">3</text><text class="dg-xs" x="232" y="119">4</text><text class="dg-xs" x="284" y="119">5</text>
  <text class="dg-2xs dg-end" x="44" y="119">인덱스</text>
  <g class="dg-line dg-thin" marker-end="url(#ic-ah)">
    <path d="M76 134 L128 170" /><path d="M128 134 L232 170" /><path d="M180 134 L76 170" /><path d="M232 134 L284 170" /><path d="M284 134 L180 170" />
  </g>
  <g class="dg-box">
    <rect x="50" y="174" width="52" height="26" /><rect x="102" y="174" width="52" height="26" /><rect x="154" y="174" width="52" height="26" /><rect x="206" y="174" width="52" height="26" /><rect x="258" y="174" width="52" height="26" />
  </g>
  <text class="dg-xs" x="76" y="187">3</text><text class="dg-xs" x="128" y="187">1</text><text class="dg-xs" x="180" y="187">5</text><text class="dg-xs" x="232" y="187">2</text><text class="dg-xs" x="284" y="187">4</text>
  <text class="dg-2xs dg-end" x="44" y="187">테이블</text>
</svg>`,
  },
};
