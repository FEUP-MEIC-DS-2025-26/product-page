FROM node:25-alpine3.21

# Install pnpm
RUN npm install -g pnpm@8

# Set workdir
WORKDIR /app

# Copy pnpm files
COPY package.json pnpm-lock.yaml ./

# --- CORREÇÃO 1: Copiar a pasta prisma ANTES do install ---
COPY prisma ./prisma

# --- CORREÇÃO 2: URL Dummy para o Prisma validar o schema durante o build ---
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/product-page?schema=public"

# Install dependencies (agora o script postinstall já encontra o schema)
RUN pnpm install --force 

# Copy source code
COPY . .

# Rsbuild/Vite dev servers need this to be accessible
ENV HOST=0.0.0.0
EXPOSE 3002

# Ajusta se o script não for "dev" ou usar outra porta
CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "3002"]