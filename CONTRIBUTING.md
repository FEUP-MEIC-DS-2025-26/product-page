# Contributing

Welcome — this repository is a monorepo. Quick rules:

- Use **npm workspaces**. After cloning run:
  ```bash
  npm install
  ```
- Start the dev server for web:
  ```bash
  npm run dev:web
  ```
- Branch naming: `feature/<issue>-short-desc`.
- Commit messages: Conventional Commits (feat, fix, chore, docs, style, refactor, test).
- PRs: small, include description, link the issue, request reviewers (CODEOWNERS will suggest).
- Run database locally with:
  ```bash
  docker-compose up -d
  cp .env .env
  ```
- Prisma:
  - Location: `prisma/` inside the web app (if present).
  - Generate client: `npx prisma generate`
  - Run migrations: `npx prisma migrate dev --name init`
