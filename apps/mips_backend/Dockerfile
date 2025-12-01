FROM node:22-alpine

# 1. Instalar dependências do SO
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@8

WORKDIR /app

# 2. Copiar definições do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# 3. Copiar package.json do backend
COPY apps/mips_backend/package.json ./apps/mips_backend/

# 4. [CORREÇÃO] Instalar dependências IGNORANDO scripts (postinstall)
# Isso impede que o 'prisma generate' tente rodar antes da hora
RUN pnpm install --frozen-lockfile --ignore-scripts

# 5. Copiar o Schema do Prisma
# Só AGORA o schema existe dentro do container
COPY prisma ./prisma

# 6. Gerar o cliente Prisma MANUALMENTE
# Agora funciona porque:
# a) O prisma CLI foi instalado no passo 4
# b) O schema foi copiado no passo 5
RUN pnpm exec prisma generate --schema=./prisma/schema.prisma

# 7. Copiar o código fonte do backend
COPY apps/mips_backend ./apps/mips_backend

# 8. Workdir final
WORKDIR /app/apps/mips_backend

ENV NODE_ENV=development
ENV PORT=3003

EXPOSE 3003

CMD ["pnpm", "dev"]