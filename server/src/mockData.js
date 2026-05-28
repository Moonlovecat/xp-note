import { fieldsForReviewType } from "./reviewCriteria.js";

export const games = [
  { id: 1, icon: "🗡", title: "젤다의 전설: 야생의 숨결", platform: "Nintendo Switch", maker: "닌텐도", year: 2017, genre: "어드벤처", cover: "linear-gradient(145deg,#1f6f52,#9ac36b)", summary: "탐험과 물리 상호작용을 중심으로 오픈월드 문법을 넓힌 대표작입니다." },
  { id: 2, icon: "👑", title: "젤다의 전설: 왕국의 눈물", platform: "Nintendo Switch", maker: "닌텐도", year: 2023, genre: "어드벤처", cover: "linear-gradient(145deg,#31595d,#d3c36b)", summary: "조립과 실험 중심의 시스템으로 전작의 자유도를 더 확장한 오픈월드 게임입니다." },
  { id: 3, icon: "🎩", title: "슈퍼 마리오 오디세이", platform: "Nintendo Switch", maker: "닌텐도", year: 2017, genre: "플랫포머", cover: "linear-gradient(145deg,#b51d2a,#f3a03d)", summary: "캡처 액션과 왕국 탐험을 결합한 3D 마리오 대표작입니다." },
  { id: 4, icon: "🏝", title: "모여봐요 동물의 숲", platform: "Nintendo Switch", maker: "닌텐도", year: 2020, genre: "시뮬레이션", cover: "linear-gradient(145deg,#2b9873,#f1cf76)", summary: "섬 생활, 수집, 꾸미기를 천천히 쌓아가는 생활형 게임입니다." },
  { id: 5, icon: "🏎", title: "마리오 카트 8 디럭스", platform: "Nintendo Switch", maker: "닌텐도", year: 2017, genre: "레이싱", cover: "linear-gradient(145deg,#1565c0,#4fc3f7)", summary: "누구나 쉽게 시작할 수 있는 파티 레이싱 게임입니다." },
  { id: 6, icon: "🦑", title: "스플래툰 3", platform: "Nintendo Switch", maker: "닌텐도", year: 2022, genre: "슈터", cover: "linear-gradient(145deg,#5d2ca3,#cddc39)", summary: "영역 싸움과 빠른 팀 전투를 잉크 액션으로 풀어낸 슈터입니다." },
  { id: 7, icon: "👊", title: "슈퍼 스매시브라더스 얼티밋", platform: "Nintendo Switch", maker: "닌텐도", year: 2018, genre: "격투", cover: "linear-gradient(145deg,#263238,#ff7043)", summary: "방대한 캐릭터와 파티성을 갖춘 플랫폼 격투 게임입니다." },
  { id: 8, icon: "🚀", title: "메트로이드 드레드", platform: "Nintendo Switch", maker: "닌텐도", year: 2021, genre: "액션", cover: "linear-gradient(145deg,#004d40,#26a69a)", summary: "긴장감 있는 추격과 정교한 맵 탐색을 결합한 2D 액션 게임입니다." },
  { id: 9, icon: "⚔", title: "파이어 엠블렘: 풍화설월", platform: "Nintendo Switch", maker: "닌텐도", year: 2019, genre: "SRPG", cover: "linear-gradient(145deg,#542b70,#d36a9f)", summary: "전술 전투와 학원 생활, 분기 서사가 결합된 전략 RPG입니다." },
  { id: 10, icon: "🌿", title: "제노블레이드 크로니클스 3", platform: "Nintendo Switch", maker: "닌텐도", year: 2022, genre: "RPG", cover: "linear-gradient(145deg,#1d3f75,#80cbc4)", summary: "대규모 필드와 파티 전투, 장편 서사를 갖춘 JRPG입니다." },
  { id: 11, icon: "🌟", title: "별의 커비: 디스커버리", platform: "Nintendo Switch", maker: "닌텐도", year: 2022, genre: "액션", cover: "linear-gradient(145deg,#ad3f72,#f8bbd0)", summary: "부드러운 난이도와 변신 액션이 강점인 3D 커비 게임입니다." },
  { id: 12, icon: "🌱", title: "피크민 4", platform: "Nintendo Switch", maker: "닌텐도", year: 2023, genre: "전략", cover: "linear-gradient(145deg,#33691e,#aed581)", summary: "작은 피크민 부대를 지휘해 수집과 전투를 진행하는 전략 어드벤처입니다." },
  { id: 13, icon: "👻", title: "루이지의 맨션 3", platform: "Nintendo Switch", maker: "닌텐도", year: 2019, genre: "어드벤처", cover: "linear-gradient(145deg,#1b5e20,#7e57c2)", summary: "호텔 탐험과 퍼즐, 유령 포획 액션을 결합한 어드벤처입니다." },
  { id: 14, icon: "💪", title: "링 피트 어드벤처", platform: "Nintendo Switch", maker: "닌텐도", year: 2019, genre: "피트니스", cover: "linear-gradient(145deg,#0d47a1,#66bb6a)", summary: "운동 동작을 RPG 진행과 연결한 체감형 피트니스 게임입니다." },
  { id: 15, icon: "🎾", title: "닌텐도 스위치 스포츠", platform: "Nintendo Switch", maker: "닌텐도", year: 2022, genre: "스포츠", cover: "linear-gradient(145deg,#006064,#ffca28)", summary: "모션 조작으로 여러 스포츠를 가볍게 즐기는 파티 게임입니다." },
  { id: 16, icon: "⚡", title: "포켓몬스터 레전드: 아르세우스", platform: "Nintendo Switch", maker: "포켓몬컴퍼니", year: 2022, genre: "RPG", cover: "linear-gradient(145deg,#455a64,#81c784)", summary: "포획과 탐험 흐름을 크게 바꾼 오픈 필드 포켓몬 RPG입니다." },
  { id: 17, icon: "🔴", title: "포켓몬스터 스칼렛/바이올렛", platform: "Nintendo Switch", maker: "포켓몬컴퍼니", year: 2022, genre: "RPG", cover: "linear-gradient(145deg,#8e1b2d,#7e57c2)", summary: "오픈월드 구조로 확장된 메인라인 포켓몬 게임입니다." },
  { id: 18, icon: "🐱", title: "슈퍼 마리오 3D 월드+분노의 요새", platform: "Nintendo Switch", maker: "닌텐도", year: 2021, genre: "플랫포머", cover: "linear-gradient(145deg,#c62828,#ffb74d)", summary: "협동 플레이와 짧은 스테이지 구성이 강한 3D 플랫포머입니다." },
  { id: 19, icon: "🎉", title: "슈퍼 마리오 파티", platform: "Nintendo Switch", maker: "닌텐도", year: 2018, genre: "파티", cover: "linear-gradient(145deg,#6a1b9a,#ffca28)", summary: "보드게임식 진행과 미니게임을 중심으로 한 로컬 파티 게임입니다." },
  { id: 20, icon: "🔬", title: "피크민 3 디럭스", platform: "Nintendo Switch", maker: "닌텐도", year: 2020, genre: "전략", cover: "linear-gradient(145deg,#2e7d32,#ff8a65)", summary: "자원 회수와 시간 관리가 핵심인 피크민 시리즈의 디럭스 버전입니다." }
];

export const users = [
  { email: "critique01@example.com", nickname: "하이랄평론가" },
  { email: "review01@example.com", nickname: "주말플레이어" },
  { email: "system@example.com", nickname: "시스템리뷰어" },
  { email: "mario@example.com", nickname: "마리오입문자" },
  { email: "party@example.com", nickname: "파티게임러" },
  { email: "racing@example.com", nickname: "레이싱체커" },
  { email: "strategy@example.com", nickname: "전략파" },
  { email: "fitness@example.com", nickname: "홈트게이머" },
  { email: "cozy@example.com", nickname: "느긋한섬주민" },
  { email: "action@example.com", nickname: "액션체커" }
];

const critiqueComments = [
  "시스템 간 상호작용이 분명해서 오래 플레이해도 판단할 거리가 계속 생깁니다.",
  "조작 반응과 레벨 설계가 안정적이며, 반복 플레이에서 장점이 더 잘 보입니다.",
  "난이도 곡선은 다소 호불호가 있지만 전략적 선택지를 꾸준히 제공합니다.",
  "최적화와 피드백이 좋아서 핵심 루프를 신뢰하고 파고들 수 있습니다."
];

const reviewComments = [
  "처음 잡아도 흐름을 이해하기 쉽고 짧게 즐겨도 만족감이 있었습니다.",
  "분위기와 조작감이 좋아서 피곤한 날에도 부담 없이 켜기 좋았습니다.",
  "친구나 가족에게 추천하기 좋은 편이고, 진입 장벽이 높지 않습니다.",
  "반복 콘텐츠가 자연스럽게 이어져서 생각보다 오래 붙잡게 됩니다."
];

function clampScore(value) {
  return Math.max(1, Math.min(5, value));
}

export function buildSeedReviews(userRows) {
  const reviews = [];

  games.forEach((game, gameIndex) => {
    for (let offset = 0; offset < 5; offset += 1) {
      const type = offset % 2 === 0 ? "critique" : "review";
      const user = userRows[(gameIndex + offset) % userRows.length];
      const base = 3.5 + ((gameIndex + offset) % 4) * 0.5;
      const rating = Math.min(5, base);
      const fields = type === "critique" ? fieldsForReviewType(type) : [];
      const scores = fields.map((field, fieldIndex) => ({
        criterionKey: field.key,
        criterionLabel: field.label,
        value: clampScore(Math.round(rating + ((fieldIndex + offset) % 3) - 1))
      }));
      const tagBase = type === "critique" ? ["평론", "전략", "완성도"] : ["입문", "체감", "추천"];

      reviews.push({
        userId: user.id,
        gameId: game.id,
        type,
        rating,
        headline: type === "critique" ? `${game.title}의 구조적 완성도` : `${game.title}을 가볍게 즐긴 소감`,
        comment: `${game.title}은 ${type === "critique" ? critiqueComments[(gameIndex + offset) % critiqueComments.length] : reviewComments[(gameIndex + offset) % reviewComments.length]}`,
        tags: tagBase,
        playtimeHours: 8 + ((gameIndex + 1) * (offset + 2)) % 120,
        helpfulCount: (gameIndex * 7 + offset * 5) % 80,
        createdAt: new Date(Date.UTC(2026, 3 + ((gameIndex + offset) % 2), 1 + ((gameIndex * 3 + offset) % 28), 9 + offset)).toISOString(),
        scores
      });
    }
  });

  return reviews;
}

export const gameRequests = [
  { title: "슈퍼 마리오브라더스 원더", platform: "Nintendo", year: 2023, reason: "팀원 플레이 경험이 많아 초기 리뷰 후보로 좋습니다.", status: "pending" },
  { title: "옥토패스 트래블러 II", platform: "Nintendo", year: 2023, reason: "JRPG 리뷰 템플릿을 검증하기 좋습니다.", status: "pending" },
  { title: "페르소나 5 더 로열", platform: "Nintendo", year: 2022, reason: "스토리/세계관 평가 항목의 비교군이 됩니다.", status: "approved" },
  { title: "동킹콩 바나나자", platform: "Nintendo", year: 2025, reason: "최신 닌텐도 타이틀 확장 후보입니다.", status: "pending" },
  { title: "하데스", platform: "Nintendo", year: 2020, reason: "비닌텐도 제작사의 스위치 게임 비교에 유용합니다.", status: "pending" }
];
