# apps/mips_product_page/Dockerfile
# Multi-stage Dockerfile (pnpm workspace) — rsbuild executado dentro de apps/mips_product_page

# ===== base =====
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl bash

# ===== prod-deps =====
FROM base AS prod-deps
WORKDIR /app
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# copiar ficheiros essenciais PARA PROD (inclui workspace file para compatibilidade)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# instalar só deps de produção
RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts --force

# ===== builder =====
FROM base AS builder
WORKDIR /app

# garantir que binários locais são acháveis
ENV PATH=/app/node_modules/.bin:$PATH
ENV PATH=$PATH:/root/.local/share/pnpm/global/5/node_modules/.bin

# ---- IMPORTANTE: copia primeiro os ficheiros do workspace para que pnpm detecte o monorepo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# instalar todas as deps no workspace (hoisting) — necessário para rsbuild e plugins
# evita correr postinstall scripts problemáticos com --ignore-scripts
RUN NODE_ENV=development pnpm -w install --frozen-lockfile --ignore-scripts --shamefully-hoist || \
    NODE_ENV=development pnpm -w install --ignore-scripts --force --shamefully-hoist

# agora copia o resto do código (após instalar para aproveitar cache)
COPY . .

# setar envs que o rsbuild pode precisar
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=${REACT_APP_API_BASE}

# gerar prisma client se existir (não falha)
RUN pnpm exec prisma generate || true

ENV NEXT_TELEMETRY_DISABLED=1

# permissões (por via das dúvidas)
RUN find node_modules -type f -name "rsbuild" -exec chmod +x {} \; || true

# Debug: listar bins no contexto do workspace
RUN echo ">>> workspace node_modules/.bin contents:" && ls -la node_modules/.bin || true

# Debug: listar ficheiros do microfrontend (confirmar que src existe)
RUN echo ">>> apps/mips_product_page tree (top-level):" && ls -la apps/mips_product_page || true
RUN echo ">>> apps/mips_product_page/src (if exists):" && ls -la apps/mips_product_page/src || true

# Se o plugin gerou tsconfigs em node_modules/.federation, tenta rodar tsc (não fatal)
RUN for f in node_modules/.federation/tsconfig*.json; do \
      if [ -f "$f" ]; then \
        echo "Running tsc for $f"; \
        npx tsc --project "$f" || true; \
      fi; \
    done

# --- executa o rsbuild a partir do diretório do microfrontend ---
RUN cd apps/mips_product_page && pnpm exec -- rsbuild --version || true
RUN cd apps/mips_product_page && pnpm exec -- rsbuild build

# garantir diretórios esperados no local do microfrontend para o runner copiar (mesmo que vazios)
RUN mkdir -p apps/mips_product_page/dist \
 && mkdir -p apps/mips_product_page/public \
 && mkdir -p apps/mips_product_page/.next \
 && mkdir -p /app/node_modules/.prisma \
 && mkdir -p /app/prisma

# ===== runner =====
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g serve@14
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# copiar node_modules de produção
COPY --from=prod-deps /app/node_modules ./node_modules

# copiar artefactos de build gerados pelo builder (paths ajustados)
COPY --from=builder /app/apps/mips_product_page/dist ./dist
COPY --from=builder /app/apps/mips_product_page/public ./public
COPY --from=builder /app/apps/mips_product_page/.next ./.next

# copiar prisma client/schema se necessário
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "-c", "if [ -d ./dist ]; then serve -s dist -l $PORT -C; elif [ -d ./public ]; then serve -s public -l $PORT -C; else pnpm start; fi"]
