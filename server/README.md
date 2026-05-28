# XP Note Server Prototype

Express + PostgreSQL + Prisma + JWT API for XP Note, a Korean console game review MVP that separates critique-style analysis from review-style play impressions.

## Local Run

```powershell
cd server
npm install
docker compose up -d
npm run db:push
npm run db:seed
npm start
```

Open `http://localhost:3000`.

Seeded mock users all use the password `password123`.

For a temporary public URL that works outside the same Wi-Fi, see `../SHARE.md`.

## Tests

```powershell
npm test -- --run
```

Run API integration tests against the local seeded database:

```powershell
$env:DATABASE_URL='postgresql://weenai:weenai@localhost:5432/weenai?schema=public'
$env:RUN_DB_TESTS='1'
npm test -- --run
```

Run the frontend smoke test while the server is running:

```powershell
npm run smoke:frontend
```

The smoke test writes a mobile screenshot to `server/tests/artifacts/frontend-smoke-mobile.png`.
