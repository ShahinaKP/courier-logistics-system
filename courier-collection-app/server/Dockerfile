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

# Generate the Prisma client (default output: node_modules/.prisma/client).
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

# Bring over the Prisma client that was generated in the builder stage so we
# don't have to re-download the engines at runtime.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 5000
CMD ["node", "dist/index.js"]
