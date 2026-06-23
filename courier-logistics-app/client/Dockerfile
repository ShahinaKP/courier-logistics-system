# syntax=docker/dockerfile:1

###############################################################################
# Builder: install deps and produce the static Vite build.
###############################################################################
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* vars at build time. Because the API is called from the
# user's browser, this must point at the host-published server port, not at an
# internal Docker hostname. Override via the build arg if your ports differ.
ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

###############################################################################
# Runtime: serve the static build with nginx (SPA fallback for react-router).
###############################################################################
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
