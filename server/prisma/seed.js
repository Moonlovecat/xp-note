import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth.js";
import { buildSeedReviews, gameRequests, games, users } from "../src/mockData.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.reviewScore.deleteMany();
  await prisma.review.deleteMany();
  await prisma.gameRequest.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("password123");
  const createdUsers = [];

  for (const user of users) {
    const created = await prisma.user.create({
      data: {
        ...user,
        passwordHash
      }
    });
    createdUsers.push(created);
  }

  await prisma.game.createMany({ data: games });

  const reviews = buildSeedReviews(createdUsers);
  for (const review of reviews) {
    const { scores, ...reviewData } = review;
    const scoreRelation = scores.length ? { scores: { create: scores } } : {};
    await prisma.review.create({
      data: {
        ...reviewData,
        createdAt: new Date(reviewData.createdAt),
        ...scoreRelation
      }
    });
  }

  for (let index = 0; index < gameRequests.length; index += 1) {
    const request = gameRequests[index];
    await prisma.gameRequest.create({
      data: {
        ...request,
        userId: createdUsers[index % createdUsers.length].id
      }
    });
  }

  console.log(`Seeded ${games.length} games, ${createdUsers.length} users, ${reviews.length} reviews.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
