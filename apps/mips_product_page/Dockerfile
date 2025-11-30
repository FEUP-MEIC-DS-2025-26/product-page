# apps/mips_product_page/Dockerfile
# Multi-stage Dockerfile (pnpm workspace)

# ===== base =====
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl bash

# ===== prod-deps (Dependências de Produção) =====
FROM base AS prod-deps
WORKDIR /app
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# [CORREÇÃO CRITICA]
# Copiamos TUDO primeiro para que o pnpm veja os package.json das apps
COPY . .

# Instalamos as dependências de produção. 
# Como copiámos tudo, o pnpm vai ler o apps/mips_product_page/package.json e instalar o que precisa.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts --force

# ===== builder (Construção) =====
FROM base AS builder
WORKDIR /app

# Setup de Variáveis de Ambiente
ENV PATH=/app/node_modules/.bin:$PATH
ENV PATH=$PATH:/root/.local/share/pnpm/global/5/node_modules/.bin
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=${REACT_APP_API_BASE}
ENV NEXT_TELEMETRY_DISABLED=1

# [CORREÇÃO CRITICA]
# Novamente, copiamos tudo ANTES de instalar para garantir que as devDependencies (rsbuild) são instaladas
COPY . .

# Instalar todas as dependências (incluindo devDependencies como rsbuild)
RUN NODE_ENV=development pnpm -w install --frozen-lockfile --ignore-scripts --shamefully-hoist || \
    NODE_ENV=development pnpm -w install --ignore-scripts --force --shamefully-hoist

# Gerar Prisma Client (se aplicável)
RUN pnpm exec prisma generate || true

# Permissões de execução (safety check)
RUN find node_modules -type f -name "rsbuild" -exec chmod +x {} \; || true

# Debug: Confirmar que o rsbuild existe agora
RUN ls -la node_modules/.bin/rsbuild || echo "rsbuild not found in root bin"

# Tentar compilar TS configs federados se existirem
RUN for f in node_modules/.federation/tsconfig*.json; do \
      if [ -f "$f" ]; then \
        echo "Running tsc for $f"; \
        npx tsc --project "$f" || true; \
      fi; \
    done

# --- BUILD ---
# Agora o comando deve funcionar porque o install viu o package.json da app
RUN cd apps/mips_product_page && pnpm exec -- rsbuild --version
RUN cd apps/mips_product_page && pnpm exec -- rsbuild build

# Preparar pastas para o runner
RUN mkdir -p apps/mips_product_page/dist \
 && mkdir -p apps/mips_product_page/public \
 && mkdir -p apps/mips_product_page/.next \
 && mkdir -p /app/node_modules/.prisma \
 && mkdir -p /app/prisma

# ===== runner (Imagem Final Otimizada) =====
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g serve@14
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# [CORREÇÃO] Usar --chown=nextjs:nodejs DIRETAMENTE no COPY
# Isto evita correr o comando lento "chown -R" depois

# Copiar node_modules de produção
COPY --chown=nextjs:nodejs --from=prod-deps /app/node_modules ./node_modules

# Copiar os artefactos da build
COPY --chown=nextjs:nodejs --from=builder /app/apps/mips_product_page/dist ./dist
COPY --chown=nextjs:nodejs --from=builder /app/apps/mips_product_page/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/apps/mips_product_page/.next ./.next

# Copiar Prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma

# Remover o comando "RUN chown -R..." pois o COPY já tratou disso
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "-c", "if [ -d ./dist ]; then serve -s dist -l $PORT -C; elif [ -d ./public ]; then serve -s public -l $PORT -C; else pnpm start; fi"]