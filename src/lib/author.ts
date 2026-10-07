/**
 * 만든 사람 정보 단일 출처 — daily.mcp 블로그의 site/src/lib/author.ts와 같은 모양이다.
 * 두 사이트가 같은 사람의 것이라 about 머리가 같은 값을 보여야 한다.
 *
 * 이메일은 봇 스크래핑을 피해 평문으로 두지 않고 user/domain으로 쪼갠 뒤
 * 클라이언트 스크립트가 mailto로 조립한다(블로그와 같은 수법).
 */
export const AUTHOR = {
  name: "Hyona Lim",
  avatar: "https://github.com/mmyonaa.png",
  portfolio: "https://mmyonaa.github.io",
  portfolioLabel: "mmyonaa.github.io",
  github: "https://github.com/mmyonaa",
  linkedin: "https://www.linkedin.com/in/hyona-lim-a3a626319/",
  mailUser: "apddfhsajrwk",
  mailDomain: "gmail.com",
} as const;
