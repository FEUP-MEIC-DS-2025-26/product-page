FROM node:22-alpine

WORKDIR /app

# 1. Instalar pnpm e dependências de sistema
RUN npm install -g pnpm@8 \
    && apk add --no-cache libc6-compat openssl

# 2. Copiar os ficheiros de dependências
COPY apps/mips_backend/package.json apps/mips_backend/pnpm-lock.yaml ./

# 3. Instalar dependências do projeto
RUN pnpm install --force

# 4. Instalar a CLI do Prisma GLOBALMENTE
RUN npm install -g prisma

# 5. Copiar a pasta prisma da raiz
COPY prisma ./prisma

# 6. Copiar o resto do código fonte
COPY apps/mips_backend/. .

# --- AQUI ESTÁ A TUA ALTERAÇÃO ---
# Usamos o teu URL. O Prisma vai ler "postgresql" e ficar feliz.
# O host "db" não existe durante o build, mas o generate não tenta conectar, por isso funciona.
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/product-page?schema=public"

# 7. Gerar o cliente Prisma
RUN prisma generate

# ... Resto das configurações ...
ENV NODE_ENV=development
ENV PORT=3003
EXPOSE 3003

CMD ["pnpm", "dev"]