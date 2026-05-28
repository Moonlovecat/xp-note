import { fieldLabels } from "./reviewCriteria.js";

export function averageRating(reviews) {
  if (!reviews.length) return null;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

export function reviewCounts(reviews) {
  return {
    total: reviews.length,
    critique: reviews.filter(review => review.type === "critique").length,
    review: reviews.filter(review => review.type === "review").length
  };
}

export function scoreObject(review) {
  if (review.type === "review") return {};

  const scores = {};
  for (const score of review.scores || []) {
    scores[score.criterionKey] = score.value;
  }

  const recommendation = Array.isArray(review.tags)
    ? review.tags.find(tag => typeof tag === "string" && tag.startsWith("추천:"))
    : null;
  if (recommendation) {
    scores.recommendation = recommendation.slice(3);
  }

  return scores;
}

export function serializeReview(review, currentUserId = null) {
  return {
    id: review.id,
    gameId: review.gameId,
    userId: review.userId,
    userName: review.user?.nickname || review.userName || "Unknown",
    type: review.type,
    rating: review.rating,
    headline: review.headline || "",
    comment: review.comment,
    tags: Array.isArray(review.tags) ? review.tags.filter(tag => !String(tag).startsWith("추천:")) : [],
    playtimeHours: review.playtimeHours,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    isMine: currentUserId ? review.userId === currentUserId : false,
    scores: scoreObject(review)
  };
}

export function scoreAverages(reviews) {
  const buckets = new Map();
  for (const review of reviews) {
    if (review.type !== "critique") continue;
    for (const score of review.scores || []) {
      const bucket = buckets.get(score.criterionKey) || {
        key: score.criterionKey,
        label: score.criterionLabel || fieldLabels[score.criterionKey] || score.criterionKey,
        values: []
      };
      bucket.values.push(score.value);
      buckets.set(score.criterionKey, bucket);
    }
  }

  return [...buckets.values()]
    .map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      value: bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length
    }))
    .sort((a, b) => b.value - a.value);
}

export function ratingDistribution(reviews) {
  const distribution = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  for (const review of reviews) {
    const bucket = String(Math.max(1, Math.min(5, Math.floor(review.rating))));
    distribution[bucket] += 1;
  }
  return distribution;
}

export function serializeGame(game) {
  const counts = reviewCounts(game.reviews || []);
  return {
    id: game.id,
    title: game.title,
    platform: game.platform,
    maker: game.maker,
    year: game.year,
    genre: game.genre,
    summary: game.summary,
    cover: game.cover,
    icon: game.icon,
    averageRating: averageRating(game.reviews || []),
    reviewCount: counts.total,
    critiqueCount: counts.critique,
    regularReviewCount: counts.review
  };
}

export function serializeGameRequest(request) {
  return {
    id: request.id,
    title: request.title,
    platform: request.platform,
    year: request.year,
    reason: request.reason,
    status: request.status,
    createdAt: request.createdAt,
    userName: request.user?.nickname
  };
}
