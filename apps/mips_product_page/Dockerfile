# ===== base =====
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl

# ===== prod-deps =====
# Num setup estático (Rsbuild/Vite), geralmente não precisamos de node_modules de produção
# no runner, apenas dos ficheiros estáticos compilados (dist).
# Mas mantemos aqui caso tenhas dependências de servidor específicas.
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Copiamos também os package.json das apps para o pnpm resolver o workspace corretamente
COPY apps/mips_host/package.json ./apps/mips_host/
COPY apps/mips_product_page/package.json ./apps/mips_product_page/
COPY apps/mips_shopping_cart/package.json ./apps/mips_shopping_cart/

RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts --force

# ===== builder =====
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY . .

# Instalar todas as dependências (incluindo devDeps para o build)
RUN NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts || NODE_ENV=development pnpm install --ignore-scripts --force

# --- ARGUMENTOS ---
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

# Gerar Prisma (se necessário para algum script de build, embora o host geralmente seja estático)
RUN pnpm exec prisma generate || true
ENV NEXT_TELEMETRY_DISABLED=1

# --- CORREÇÃO AQUI ---
# 1. Entramos na pasta do HOST (mips_host) que é quem usa rsbuild.
# 2. Corremos o build lá dentro.
RUN cd apps/mips_host && pnpm build

# ===== runner =====
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000
# Instalamos o 'serve' para servir os ficheiros estáticos do Rsbuild
RUN npm install -g serve@14

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# --- CORREÇÃO DE CÓPIA ---
# O output do build do mips_host fica em apps/mips_host/dist
COPY --from=builder /app/apps/mips_host/dist ./dist

# Se tiveres uma pasta public na raiz que queres manter:
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

# Servir a pasta dist
CMD ["serve", "-s", "dist", "-l", "3000"]