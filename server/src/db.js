import { PrismaClient } from "@prisma/client";

// Vercel 서버리스 환경에서 PrismaClient 인스턴스가 중복 생성되는 것을 방지합니다.
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
