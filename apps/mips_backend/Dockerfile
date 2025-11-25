# Usa uma versão compatível com o teu projeto
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm e dependências de sistema necessárias para o Prisma (OpenSSL é crucial em Alpine)
RUN npm install -g pnpm@8 \
    && apk add --no-cache libc6-compat openssl

# 1. Copiar os ficheiros de dependências DO BACKEND
# Baseado na tua imagem, tens o pnpm-lock.yaml dentro da pasta, por isso copiamos também.
COPY apps/mips_backend/package.json apps/mips_backend/pnpm-lock.yaml ./

# 2. Instalar dependências do projeto
RUN pnpm install --force

# 3. [CRÍTICO] Forçar a instalação do Prisma CLI
# Como estamos num ambiente isolado Docker e o prisma provavelmente está na raiz do monorepo,
# temos de o instalar manualmente aqui para o comando 'generate' funcionar.
RUN pnpm add -D prisma

# 4. Copiar a pasta prisma da RAIZ para dentro do contentor
COPY prisma ./prisma

# 5. Copiar o resto do código fonte do backend
COPY apps/mips_backend/. .

# 6. Gerar o cliente Prisma
RUN npx prisma generate

# Configurações finais
ENV NODE_ENV=development
ENV PORT=3003
EXPOSE 3003

CMD ["pnpm", "dev"]