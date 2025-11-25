FROM node:22-alpine

WORKDIR /app

# 1. Instalar pnpm e dependências de sistema (OpenSSL é obrigatório para o Prisma em Alpine)
RUN npm install -g pnpm@8 \
    && apk add --no-cache libc6-compat openssl

# 2. Copiar os ficheiros de dependências
COPY apps/mips_backend/package.json apps/mips_backend/pnpm-lock.yaml ./

# 3. Instalar dependências do projeto
RUN pnpm install --force

# 4. --- CORREÇÃO CRÍTICA ---
# Instalar a CLI do Prisma GLOBALMENTE usando npm.
# Isto evita o erro "MODULE_NOT_FOUND" do npx/pnpm e garante que o comando 'prisma' existe no PATH.
RUN npm install -g prisma

# 5. Copiar a pasta prisma da raiz
COPY prisma ./prisma

# 6. Copiar o resto do código fonte
COPY apps/mips_backend/. .

# 7. Gerar o cliente Prisma
# Agora corremos 'prisma generate' diretamente (sem npx e sem pnpm exec)
RUN prisma generate

# Configurações finais
ENV NODE_ENV=development
ENV PORT=3003
EXPOSE 3003

CMD ["pnpm", "dev"]