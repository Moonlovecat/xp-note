FROM node:20-bookworm-slim

# 보안 및 필요한 라이브러리 설치
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. 서버 의존성 설치
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

# 2. Prisma 설정 및 생성
COPY server/prisma ./prisma
RUN npx prisma generate

# 3. 소스 코드 및 프론트엔드 파일 복사
WORKDIR /app
COPY server/src ./server/src
COPY index.html ./
COPY weenai_*.html ./

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "src/server.js"]
