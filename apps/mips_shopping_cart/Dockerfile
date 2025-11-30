# apps/mips_host/Dockerfile (mínimo, copia prisma antes de instalar)
FROM node:25-alpine3.21

# Instala pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copia ficheiros de package/lock (para cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# MÍNIMA ADIÇÃO: copia o prisma da root para que prisma generate funcione no postinstall
COPY prisma ./prisma

# (Opcional) Se a app tiver package.json próprio na subpasta e queres aproveitar cache:
# COPY apps/mips_host/package.json ./apps/mips_host/package.json

# Instala dependências (postinstall agora encontra prisma/schema.prisma)
RUN pnpm install --frozen-lockfile --ignore-scripts 

# Copia o resto do código
COPY . .

# Garante que, se por algum motivo o schema estiver, faz generate sem falhar
RUN if [ -f ./prisma/schema.prisma ]; then pnpm prisma generate --schema=./prisma/schema.prisma || true; fi

ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
