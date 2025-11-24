#####################################################
# 3. Builder do web (precisa de TODAS as dependências)
#####################################################
FROM base AS builder-web
WORKDIR /app

# Copiar package + lock e instalar *todas* as deps (dev + prod)
COPY package.json pnpm-lock.yaml ./
# força NODE_ENV=development apenas para a instalação (assegura devDeps)
RUN NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts || \
    NODE_ENV=development pnpm install --ignore-scripts --force

# Agora copiar o resto do código
COPY . .

# Correr o prisma generate (se existir)
RUN pnpm exec prisma generate || true

# Desabilitar telemetry do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build do Next.js
RUN pnpm run build

#####################################################
# 4. Runner do web (A imagem final)
#####################################################
FROM base AS runner-web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar APENAS as dependências de PRODUÇÃO (do stage prod-deps)
COPY --from=prod-deps /app/node_modules ./node_modules

# Copiar os artefactos do BUILD (do stage builder-web)
# Copiamos .next e public — isto funciona quer uses standalone quer não.
COPY --from=builder-web /app/public ./public
COPY --from=builder-web /app/.next ./.next
COPY --from=builder-web /app/.next/static ./.next/static || true

# Copiar o cliente prisma gerado e o schema
COPY --from=builder-web /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder-web /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Entrypoint que usa server.js se existir (standalone), senão usa pnpm start
CMD ["sh","-c","if [ -f server.js ]; then node server.js; else pnpm start; fi"]
