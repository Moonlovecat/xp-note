import { describe, expect, it } from "vitest";
import { koreanInitials, matchesGameSearch } from "../src/search.js";

describe("Korean search helpers", () => {
  it("builds initial consonant strings for Korean titles", () => {
    expect(koreanInitials("피크민 4")).toBe("ㅍㅋㅁ 4");
    expect(koreanInitials("포켓몬스터")).toBe("ㅍㅋㅁㅅㅌ");
    expect(koreanInitials("마리오 카트")).toBe("ㅁㄹㅇ ㅋㅌ");
  });

  it("matches games by initial consonants", () => {
    const game = {
      title: "피크민 4",
      genre: "전략",
      maker: "닌텐도"
    };

    expect(matchesGameSearch(game, "ㅍㅋㅁ")).toBe(true);
    expect(matchesGameSearch(game, "닌텐도")).toBe(true);
    expect(matchesGameSearch(game, "ㅁㄹㅇ")).toBe(false);
  });
});
