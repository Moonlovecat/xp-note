const INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];

export function koreanInitials(value) {
  return String(value ?? "").split("").map(char => {
    const code = char.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return char.toLowerCase();
    return INITIALS[Math.floor((code - 0xac00) / 588)];
  }).join("");
}

function compact(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, "");
}

export function matchesGameSearch(game, query) {
  const normalizedQuery = compact(query);
  if (!normalizedQuery) return true;

  const text = `${game.title} ${game.genre} ${game.maker} ${game.platform || ""}`.toLowerCase();
  const initials = koreanInitials(text);
  return compact(text).includes(normalizedQuery) || compact(initials).includes(normalizedQuery);
}
