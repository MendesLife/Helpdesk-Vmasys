# Multi-stage Dockerfile para produção do VMASYS HelpDesk
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Instalação de dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Compilação do App Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita telemetria durante o build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 3. Imagem final enxuta de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Cria diretório de uploads com permissão
RUN mkdir -p ./uploads && chown -R nextjs:nodejs ./uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copia saída standalone gerada pelo Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
