# ===== base =====
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl

# ===== prod-deps =====
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Copiar package.json das apps para o pnpm resolver o workspace
COPY apps/mips_host/package.json ./apps/mips_host/
COPY apps/mips_product_page/package.json ./apps/mips_product_page/
COPY apps/mips_shopping_cart/package.json ./apps/mips_shopping_cart/

RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts --force

# ===== builder =====
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY . .

# Instalar todas as dependências (incluindo devDeps)
RUN NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts || NODE_ENV=development pnpm install --ignore-scripts --force

# Argumentos de Build
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

# Prisma generate (se necessário)
RUN pnpm exec prisma generate || true
ENV NEXT_TELEMETRY_DISABLED=1

# --- BUILD DO HOST ---
# Entramos na pasta do host e corremos o build lá.
# O Rsbuild vai gerar tudo dentro de apps/mips_host/dist
RUN cd apps/mips_host && pnpm build

# ===== runner =====
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000

# Instalamos o 'serve' para servir o site estático
RUN npm install -g serve@14

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# --- CORREÇÃO: Copiar APENAS a pasta dist ---
# O rsbuild já incluiu os assets públicos aqui dentro.
COPY --from=builder /app/apps/mips_host/dist ./dist

# (Linha removida: COPY --from=builder /app/public ./public)

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

# Servir a pasta dist na porta 3000
CMD ["serve", "-s", "dist", "-l", "3000"]