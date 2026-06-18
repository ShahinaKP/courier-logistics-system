FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache netcat-openbsd

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache netcat-openbsd

COPY package.json ./
RUN npm install --omit=dev

COPY --from=base /app/dist ./dist
COPY --from=base /app/generated ./generated
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 5001

CMD ["node", "dist/index.js"]
