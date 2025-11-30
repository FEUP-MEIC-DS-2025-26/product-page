# ==========================================
# 1. BASE
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
# CRÍTICO: openssl é obrigatório para o Prisma
RUN apk add --no-cache libc6-compat curl openssl

# ==========================================
# 2. BUILDER
# ==========================================
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Copiar package.json de TODAS as apps para o pnpm resolver o workspace corretamente
COPY apps/mips_host/package.json ./apps/mips_host/
COPY apps/mips_product_page/package.json ./apps/mips_product_page/
COPY apps/mips_shopping_cart/package.json ./apps/mips_shopping_cart/
COPY apps/mips_backend/package.json ./apps/mips_backend/

# Copiar o resto do código
COPY . .

# Instalar dependências
RUN NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts || NODE_ENV=development pnpm install --ignore-scripts --force

# --- CONFIGURAÇÃO PRISMA ---
# 1. URL Dummy para passar a validação do schema
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
# 2. Instalar Prisma v6 globalmente (para evitar a v7 incompatível)
RUN npm install -g prisma@6
# 3. Gerar o cliente Prisma
RUN prisma generate

# Argumentos de Build
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV NEXT_TELEMETRY_DISABLED=1

# --- BUILD DO PRODUCT PAGE (AQUI ESTÁ A MUDANÇA) ---
# Entramos na pasta do mips_product_page e corremos o build lá
RUN cd apps/mips_product_page && pnpm build

# ==========================================
# 3. RUNNER
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Instalamos o 'serve' para servir o site estático
RUN npm install -g serve@14

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# --- CORREÇÃO DE CÓPIA ---
# Agora copiamos a pasta dist do PRODUCT PAGE, não do Host
COPY --from=builder /app/apps/mips_product_page/dist ./dist

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "-c", "if [ -d ./dist ]; then serve -s dist -l $PORT -C; elif [ -d ./public ]; then serve -s public -l $PORT -C; else pnpm start; fi"]
