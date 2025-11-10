# Product Page — Monorepo seed

This repository was converted into a monorepo layout.

## Quickstart (developer)

1. Install dependencies:
```bash
npm install
```

2. Start Postgres:
```bash
docker-compose up -d
cp .env.example .env
```

3. Prisma (if using):
```bash
cd apps/web
npm install
npx prisma generate
npx prisma migrate dev --name init
```

4. Start web dev server from the repo root:
```bash
npm run dev:web
```

## Structure

- `apps/web` — Next.js application (existing project)
- `packages/*` — shared packages (empty now)
- `docker-compose.yml` — local Postgres
- `.env.example` — example environment variables

## Notes

- Branch naming: `feature/<issue>-short-desc`
- Commit convention: Conventional Commits
- Create small PRs and request reviews.
