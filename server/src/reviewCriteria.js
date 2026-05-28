export const commonCriteria = [
  { key: "value", label: "가성비" },
  { key: "graphics", label: "그래픽" },
  { key: "ost", label: "OST" },
  { key: "control", label: "조작 직관성" },
  { key: "immersion", label: "몰입도" }
];

export const critiqueCriteria = [
  { key: "gameplay", label: "게임성" },
  { key: "strategy", label: "전략성" },
  { key: "optimization", label: "최적화/버그" },
  { key: "story", label: "스토리/세계관" },
  { key: "difficulty", label: "난이도" },
  { key: "sfx", label: "효과음" }
];

export const reviewCriteria = [
  { key: "fun", label: "재미" },
  { key: "accessibility", label: "접근성" },
  { key: "lowFatigue", label: "피로감 낮음" },
  { key: "replayable", label: "안 질리는가" }
];

export const fieldLabels = [...commonCriteria, ...critiqueCriteria, ...reviewCriteria].reduce((labels, field) => {
  labels[field.key] = field.label;
  return labels;
}, {});

export function fieldsForReviewType(type) {
  return [...commonCriteria, ...(type === "critique" ? critiqueCriteria : reviewCriteria)];
}
