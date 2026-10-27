/**
 * 주제별 최종 수정일 — 손으로 적지 않고 git 이력에서 뽑는다.
 *
 * 노트가 언제 갱신됐는지를 화면이 말하려면 날짜가 필요한데, 그 날짜를 데이터에 적어 두면
 * 가장 먼저 낡는 값이 된다(고치면서 날짜를 같이 고치는 사람은 없다). about 페이지의 숫자를
 * 전부 빌드 타임에 세는 것과 같은 이유로 여기도 센다.
 *
 * **파일 하나에 주제 수십 개가 들어 있어 파일 mtime으로는 갈 수 없다.** `git log -S'"<키>"'`도
 * 안 된다 — 그건 키가 **추가·삭제된** 커밋을 주지 내용이 바뀐 날이 아니다(`cpu-scheduling`에
 * 걸면 실제 수정일이 아니라 주제가 처음 들어온 날이 나온다).
 *
 * 그래서 각 파일의 커밋을 오래된 것부터 훑으며 **주제별 내용이 달라진 마지막 시점**을 적는다.
 *
 * **세 파일을 다 본다.** 한 주제 페이지에는 도입부와 필기 카드와 실기 카드가 함께 서므로,
 * 도입부만 보면 문항이 열 개 늘어난 주제가 "오래 안 고친 글"로 보인다. 읽는 쪽이 이 날짜에서
 * 알고 싶은 것은 "이 화면의 내용이 최근 것인가"이지 "도입부 문자열이 바뀌었는가"가 아니다.
 *
 * 다만 `topic-notes.json`에서는 `intro`만 본다 — `post`는 주간 블로그 싱크가 기계적으로 채우므로
 * (`blog-sync.mjs --link`) 그것까지 수정으로 세면 사람이 손대지 않은 주제의 날짜가 움직인다.
 */
import { execFileSync } from "node:child_process";

/** 문항 파일은 배열이라 주제로 묶는다 — 순서가 바뀐 것만으로 수정일이 움직이지 않게 정렬한다 */
const byTopic = (arr) => {
  const m = {};
  for (const q of arr) (m[q.topic] ??= []).push(JSON.stringify(q));
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.sort().join(" ")]));
};

/** 파일 → 그 시점 내용을 주제별 문자열로 접는 함수. 값이 달라진 날이 그 주제의 수정일이다 */
const FILES = {
  "src/data/topic-notes.json": (o) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v?.intro ?? ""])),
  "src/data/questions.json": byTopic,
  "src/data/practical.json": byTopic,
};

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20 }).trim();

/**
 * 주제 키 → "YYYY-MM-DD"인 객체. 뽑을 수 없으면 **빈 객체**를 돌려준다.
 *
 * 못 뽑는 자리에서 날짜를 지어내지 않는 것이 이 함수의 요점이다. 특히 **얕은 클론**이
 * 위험하다 — `actions/checkout`은 기본이 깊이 1이라 그대로 두면 커밋이 하나만 보이고
 * 주제 전부가 "배포한 날"을 최종 수정일로 달게 된다. 그럴듯해서 아무도 못 알아챈다.
 * 날짜가 없는 화면은 한 줄이 비어 보일 뿐이지만 틀린 날짜는 거짓말이라, 의심스러우면 비운다.
 * (운영 배포는 `deploy.yml`이 `fetch-depth: 0`으로 전체 이력을 받아 온다.)
 *
 * 빌드 타임에 한 번 도는 비용은 커밋 `89`개 기준 `1`초 안쪽이다(2026-10-27 실측).
 */
let cached;

export function topicUpdatedMap() {
  // 라우트마다 다시 훑으면 안 된다 — 영역·과목 페이지가 22개 라우트를 내므로
  // 한 번에 1초가 22초가 된다. 빌드 한 번에 한 번만 센다.
  if (cached) return cached;
  try {
    if (git(["rev-parse", "--is-shallow-repository"]) === "true") return {};

    const updated = {};
    for (const [file, shape] of Object.entries(FILES)) {
      // 오래된 것부터 — 뒤에 오는 커밋이 앞의 값을 덮어써 자연히 '마지막'이 남는다
      const log = git(["log", "--reverse", "--format=%H%x09%as", "--", file]);
      if (!log) continue;

      const seen = {};
      for (const line of log.split("\n")) {
        const [sha, date] = line.split("\t");
        let cur;
        try {
          cur = shape(JSON.parse(git(["show", `${sha}:${file}`])));
        } catch {
          continue; // 그 시점에 파일이 깨졌거나 아직 지금 꼴이 아니었다면 건너뛴다
        }
        for (const [key, body] of Object.entries(cur)) {
          if (seen[key] === body) continue;
          seen[key] = body;
          // 세 파일을 각각 훑으므로 가장 나중 날짜가 그 주제의 수정일이다
          if (!updated[key] || updated[key] < date) updated[key] = date;
        }
      }
    }
    cached = updated;
    return cached;
  } catch {
    cached = {};
    return cached; // git이 없거나(배포 산출물만 받은 트리) 실행할 수 없는 환경
  }
}
