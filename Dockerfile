# syntax=docker/dockerfile:1

# ---- build: Quartz -> static files + generated CSP ----
FROM node:22.16.0-bookworm-slim@sha256:048ed02c5fd52e86fda6fbd2f6a76cf0d4492fd6c6fee9e2c463ed5108da0e34 AS build
WORKDIR /site
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV QUARTZ_ENV=production
RUN npx quartz build && node deploy/csp.mjs public /csp.conf

# ---- serve: unprivileged nginx, static files only ----
FROM nginxinc/nginx-unprivileged:1.31.6-alpine-slim@sha256:ac4d9c7e457c6510b95ac72dd84b27f7cc68ecb9a83fbd44f05a6460cf08aba4
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /csp.conf /etc/nginx/snippets/csp.conf
COPY --from=build /site/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
