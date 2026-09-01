# CLAUDE.md

## 작업 관리

일감은 GitHub Project([quiz project](https://github.com/users/mmyonaa/projects/6)) 단위로 진행한다.
착수 시 Todo → In Progress, 완료 시 Done + 완료일 갱신, 진행 기록은 이슈 코멘트나 커밋 메시지로 남긴다.

## 기록

사용자에게 보이는 변경(기능·수정·UI)은 코드와 같은 흐름에서 `CHANGELOG.md`의 `[Unreleased]`에
남긴다 — 추가/수정/변경 중 맞는 절에, 무엇이 어떻게 잘못돼 있었고 왜 그렇게 고쳤는지까지.
기능·구조·개발/배포 절차가 바뀌면 `README.md`가 아직 맞는지 함께 확인한다
(문항 수·시험 형식 값처럼 숫자로 적힌 서술이 특히 어긋나기 쉽다).
