# syntax=docker/dockerfile:1
#
# Production image for @agenda-app/app (static SPA served by nginx).
# Build from the repository root (pnpm workspace):
#   docker build -f apps/web/Dockerfile -t agenda/web .
#
# By default the SPA calls the API on its own origin (/api), and nginx proxies
# /api, /uploads and /socket.io to API_UPSTREAM. Set VITE_API_URL only when the
# API lives on another origin.

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.29.0
ARG NGINX_VERSION=1.27-alpine

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install -g --no-fund --no-audit "pnpm@${PNPM_VERSION}"
WORKDIR /repo

FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --store-dir /pnpm/store

FROM fetch AS build
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
COPY . .
# "@agenda-app/app..." also installs (and builds, via postinstall) the generated API client.
RUN pnpm install --offline --frozen-lockfile --store-dir /pnpm/store --filter "@agenda-app/app..." \
    && pnpm -F @agenda-app/app build

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runtime
ENV API_UPSTREAM=http://server:3000 \
    CLIENT_MAX_BODY_SIZE=25m
COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
