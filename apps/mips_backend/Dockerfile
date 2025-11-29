FROM node:22-alpine

WORKDIR /app

# 1. Instalar dependências de sistema
RUN npm install -g pnpm@8 \
    && apk add --no-cache libc6-compat openssl

# 2. Copiar os ficheiros de dependências
COPY apps/mips_backend/package.json apps/mips_backend/pnpm-lock.yaml ./

# 3. Instalar dependências do projeto
RUN pnpm install --force

# 4. --- CORREÇÃO AQUI ---
# Fixar a versão do Prisma na versão 6 (igual à do package.json)
# para evitar que ele instale a v7.0.0 que é incompatível com o teu schema atual.
RUN npm install -g prisma@6

# 5. Copiar a pasta prisma da raiz
COPY prisma ./prisma

# 6. Copiar o resto do código fonte
COPY apps/mips_backend/. .

# URL dummy para o build
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/product-page?schema=public"

# 7. Gerar o cliente Prisma
RUN prisma generate

# Configurações finais
ENV NODE_ENV=development
ENV PORT=3003
EXPOSE 3003

CMD ["pnpm", "dev"]