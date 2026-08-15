# quiz

> 정보처리기사 필기 빈출 개념을 4지선다로 풀고, 즉시 채점과 오답 해설을 받는 정적 연습장.
> [daily.mcp](https://mmyonaa.github.io/blog/) 블로그의 자매 프로젝트 — 문제의 해설이 블로그의 개념 글로 이어진다.

**사이트**: https://mmyonaa.github.io/quiz/

## 구조

서버 없이 동작한다. 문제·정답·해설을 빌드 타임에 HTML로 굽고, 출제·채점은 브라우저 안에서 끝난다.

- **문제 은행**: `src/data/questions.json` — 콘텐츠 컬렉션 + zod 스키마(`src/content.config.ts`)가 발행 게이트. 스키마 위반 문제는 빌드가 실패한다.
- **문제 원칙**: 기출 복제가 아닌 자체 제작 문항. 각 문제는 `relatedPost`로 개념을 다룬 블로그 글에 연결된다.
- **영역**: 운영체제 · 네트워크 · 데이터베이스 · 소프트웨어공학 · 정보보안

## 개발

```bash
npm install
npm run dev     # http://localhost:4322/quiz/ (블로그 dev 4321과 분리)
npm run build
```

## 배포

main push 시 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages로 배포한다.

## 라이선스

- **코드**: MIT
- **문제·해설**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko)
