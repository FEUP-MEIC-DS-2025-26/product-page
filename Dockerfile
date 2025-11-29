# ==========================================
# 1. BASE (Tem de ser o primeiro!)
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
# Instalar pnpm, openssl (para prisma) e curl
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl openssl

# ==========================================
# 2. BUILDER (Construção da App)
# ==========================================
FROM base AS builder-web
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Copiar ficheiros de configuração do workspace
COPY apps/mips_host/package.json ./apps/mips_host/
COPY apps/mips_product_page/package.json ./apps/mips_product_page/
COPY apps/mips_shopping_cart/package.json ./apps/mips_shopping_cart/
COPY apps/mips_backend/package.json ./apps/mips_backend/

# Copiar tudo
COPY . .

# Instalar dependências (incluindo devDeps)
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts --force

# --- CORREÇÃO PRISMA ---
# 1. Instalar versão 6 globalmente para não conflituar com a v7
RUN npm install -g prisma@6
# 2. Definir URL dummy para o generate passar
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
# 3. Gerar cliente
RUN prisma generate

# Argumentos de Build
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV NEXT_TELEMETRY_DISABLED=1

# --- CORREÇÃO DO BUILD (Rsbuild) ---
# O mips_host não está na raiz, está em apps/mips_host.
# E ele gera uma pasta 'dist', não '.next'.
RUN cd apps/mips_host && pnpm build

# ==========================================
# 3. RUNNER (Imagem Final)
# ==========================================
FROM base AS runner-web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Como o Rsbuild gera estáticos, usamos o 'serve' em vez de 'node server.js'
RUN npm install -g serve@14

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# --- CORREÇÃO DE CÓPIA ---
# Copiar apenas a pasta dist gerada pelo Rsbuild no passo anterior
COPY --from=builder-web /app/apps/mips_host/dist ./dist

# Ajustar permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Comando para servir os ficheiros estáticos
CMD ["serve", "-s", "dist", "-l", "3000"]