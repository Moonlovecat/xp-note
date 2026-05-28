import { describe, expect, it } from "vitest";
import { scoreAverages, scoreObject } from "../src/serializers.js";

describe("serializers", () => {
  it("hides item scores on simple review records", () => {
    const scores = scoreObject({
      type: "review",
      scores: [
        { criterionKey: "fun", criterionLabel: "재미", value: 5 }
      ],
      tags: ["리뷰", "체감", "추천:입문자"]
    });

    expect(scores).toEqual({});
  });

  it("calculates score averages from critique scores only", () => {
    const averages = scoreAverages([
      {
        type: "review",
        scores: [
          { criterionKey: "fun", criterionLabel: "재미", value: 5 }
        ]
      },
      {
        type: "critique",
        scores: [
          { criterionKey: "gameplay", criterionLabel: "게임성", value: 4 },
          { criterionKey: "strategy", criterionLabel: "전략성", value: 2 }
        ]
      },
      {
        type: "critique",
        scores: [
          { criterionKey: "gameplay", criterionLabel: "게임성", value: 2 }
        ]
      }
    ]);

    expect(averages).toEqual([
      { key: "gameplay", label: "게임성", value: 3 },
      { key: "strategy", label: "전략성", value: 2 }
    ]);
  });
});
