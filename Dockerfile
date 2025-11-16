#####################################################
# 1. Base image
#####################################################
FROM node:22-alpine AS base

# Instalar pnpm@8 e 'serve' para servir a build estática
RUN npm install -g pnpm@8 serve
RUN apk add --no-cache libc6-compat curl

#####################################################
# 2. Dependências de PRODUÇÃO (para a imagem final)
#####################################################
FROM base AS prod-deps
WORKDIR /app
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# ficheiros de raiz (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar APENAS deps de produção e IGNORAR scripts (como o prisma generate)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

#####################################################
# 3. Builder (precisa de TODAS as dependências)
#####################################################
FROM base AS builder-web
WORKDIR /app

# 1) Copiar TODO o código (inclui apps/mips_product_page)
COPY . .

# 2) Instalar TODAS as dependências (incluindo dev-deps como rsbuild, prisma, etc.)
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3) Gerar o Prisma Client (se a app usar DB; se não usar, também não faz mal)
RUN pnpm exec prisma generate

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 4) Build do mips_product_page com rsbuild
WORKDIR /app/apps/mips_product_page
RUN pnpm run build
# → Isto cria /app/apps/mips_product_page/dist

#####################################################
# 4. Runner (imagem final)
#####################################################
FROM base AS runner-web
WORKDIR /app
ENV NODE_ENV=production

# Cloud Run injeta PORT (normalmente 8080)
# se quiseres podes pôr default:
ENV PORT=8080

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar APENAS as dependências de PRODUÇÃO (do stage prod-deps)
COPY --from=prod-deps /app/node_modules ./node_modules

# Copiar a build estática do rsbuild (dist)
COPY --from=builder-web /app/apps/mips_product_page/dist ./dist

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

# Servir a pasta dist na porta definida em $PORT (Cloud Run usa 8080)
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
