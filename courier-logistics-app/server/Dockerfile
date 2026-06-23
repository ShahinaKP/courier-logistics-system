# syntax=docker/dockerfile:1

###############################################################################
# Builder: install all deps, generate the Prisma client, compile TypeScript.
###############################################################################
FROM node:22-slim AS builder
WORKDIR /app

# OpenSSL is required by the Prisma engines.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# This schema generates the client into ./generated/prisma (custom output).
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

###############################################################################
# Runtime: production deps only + compiled output + generated Prisma client.
###############################################################################
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# The generated client lives outside node_modules at ./generated/prisma and is
# imported by the compiled code via a relative path, so copy it across.
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 5001
CMD ["node", "dist/index.js"]
