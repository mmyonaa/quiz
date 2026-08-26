# quiz

> 정보처리기사 필기 빈출 개념을 4지선다로 풀고, 즉시 채점과 오답 해설을 받는 정적 연습장.
> [daily.mcp](https://mmyonaa.github.io/blog/) 블로그의 자매 프로젝트 — 문제의 해설이 블로그의 개념 글로 이어진다.

**사이트**: https://mmyonaa.github.io/quiz/

## 기능

- **연습 모드**: 영역·문항 수·난이도를 골라 출제, 즉시 채점과 해설
- **모의고사 모드**: 실제 시험 비중의 100문항·150분 타이머, 과목별 과락(40점)/평균 60점 합격 판정
- **오답노트**: 오답 자동 누적, 오답만 다시 풀기, 정답 시 자동 제거
- **개념 노트**(`/notes`): 해설을 영역·주제별로 모아 읽는 페이지 — 주제마다 개념 정의로 시작하는 도입부, 그 아래 시험 포인트 해설과 정답을 가린 확인 문제, 블로그 개념 글 링크
- **계정·개인화**(Supabase): Google 로그인, 문제·개념 저장(북마크), 오답 자동 기록, 마이페이지 보관함

## 구조

서버 없이 동작한다. 문제·정답·해설을 빌드 타임에 HTML로 굽고, 출제·채점은 브라우저 안에서 끝난다.
유저 데이터(북마크·오답 기록)만 Supabase에 저장하며 RLS로 사용자별 격리한다.

- **문제 은행**: `src/data/questions.json` — 콘텐츠 컬렉션 + zod 스키마(`src/content.config.ts`)가 발행 게이트. 스키마 위반 문제는 빌드가 실패한다.
- **문제 원칙**: 기출 복제가 아닌 자체 제작 문항. 전 문항 하/중/상 난이도 라벨.
- **개념 주제**: `src/data/topic-notes.json`이 주제의 단일 정의 — 영역·제목·자족적 도입부·연결할 블로그 글(선택). 문항은 `topic`으로 주제에 속하고, 없는 주제를 쓰면 빌드가 실패한다. 주제는 블로그와 분리돼 있어 글이 없어도 도입부로 완결된다.
- **영역**: 운영체제 · 네트워크 · 데이터베이스 · 소프트웨어공학 · 정보보안 · 프로그래밍
- **블로그 동기화**: `scripts/blog-sync.mjs` — prebuild 링크 검증·제목 자동화(`--check`), 죽은 링크·글 개정·문항 커버리지 갭·글 연결 갭 주간 리포트(`--report`)

## 개발

```bash
npm install
cp .env.example .env   # Supabase URL·anon key (없어도 문제 풀이는 동작)
npm run dev            # http://localhost:4322/quiz/ (블로그 dev 4321과 분리)
npm run build
```

## 배포

main push 시 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages로 배포한다.
Supabase 키는 Actions 시크릿(`SUPABASE_URL`, `SUPABASE_ANON_KEY`)으로 주입된다.

## 버전

[유의적 버전](https://semver.org/lang/ko/)을 따르며, 변경 기록은 [CHANGELOG.md](CHANGELOG.md)에 남긴다.
일감 관리는 [GitHub Project](https://github.com/users/mmyonaa/projects/6)에서 한다.

## 라이선스

- **코드**: MIT
- **문제·해설**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko)
