# ===== base =====
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8
RUN apk add --no-cache libc6-compat curl

# ===== prod-deps =====
FROM base AS prod-deps
WORKDIR /app
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts --force

# ===== builder =====
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts || NODE_ENV=development pnpm install --ignore-scripts --force

COPY . .

# --- FIX STARTS HERE ---
# We define the argument (passed from gcloud)
ARG REACT_APP_API_BASE
# We set it as an environment variable so rsbuild can see it
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
# If your code uses VITE_BACKEND_API_URL instead, uncomment the line below:
#ENV VITE_BACKEND_API_URL=$REACT_APP_API_BASE
# --- FIX ENDS HERE ---

RUN pnpm exec prisma generate || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN find node_modules -type f -name "rsbuild" -exec chmod +x {} \; || true

# Now when rsbuild runs, it sees the URL and "bakes" it into the JS
RUN pnpm exec -- rsbuild build || pnpm run build
RUN mkdir -p .next public || true

# ===== runner =====
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g serve@14
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "-c", "if [ -d ./dist ]; then serve -s dist -l $PORT; elif [ -d ./public ]; then serve -s public -l $PORT; else pnpm start; fi"]