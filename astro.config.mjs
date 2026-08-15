import { defineConfig } from "astro/config";

// GitHub Pages 프로젝트 사이트: https://mmyonaa.github.io/quiz/
// (blog 레포와 같은 공식 — 레포명이 곧 base 경로)
export default defineConfig({
  site: "https://mmyonaa.github.io",
  base: "/quiz",
  devToolbar: { enabled: false },
});
