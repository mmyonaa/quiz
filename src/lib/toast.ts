/**
 * 화면 하단 알약 토스트 — 저장·해제처럼 화면이 바뀌지 않는 동작의 피드백.
 * 페이지마다 마크업을 두지 않도록 첫 호출 때 요소를 만들어 재사용한다.
 */
let el: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = (msg: string) => {
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status"); // 스크린리더에도 읽히도록
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    el!.hidden = true;
  }, 2200);
};
