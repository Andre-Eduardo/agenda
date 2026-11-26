# syntax=docker/dockerfile:1
#
# Production image for @agenda-app/server.
# Build from the repository root (pnpm workspace):
#   docker build -f apps/server/Dockerfile -t agenda/server .

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.29.0

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
# openssl is required by the Prisma engines on Alpine.
RUN apk add --no-cache openssl \
    && npm install -g --no-fund --no-audit "pnpm@${PNPM_VERSION}"
WORKDIR /repo

# Download every package from the lockfile into the store (cached while the lockfile is unchanged).
FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --store-dir /pnpm/store

FROM fetch AS build
COPY . .
RUN pnpm install --offline --frozen-lockfile --store-dir /pnpm/store --filter @agenda-app/server \
    && pnpm -F @agenda-app/server build

FROM fetch AS prod-deps
COPY . .
RUN pnpm install --offline --frozen-lockfile --prod --store-dir /pnpm/store --filter @agenda-app/server

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_TYPE=LOCAL \
    LOCAL_UPLOAD_DIR=/data/uploads \
    RUN_MIGRATIONS=true
WORKDIR /app/apps/server

# Keep the pnpm layout (root virtual store + package symlinks) so relative links keep working.
COPY --from=prod-deps /repo/node_modules /app/node_modules
COPY --from=prod-deps /repo/apps/server/node_modules ./node_modules
COPY --from=build /repo/apps/server/dist ./dist
COPY apps/server/package.json ./package.json
COPY apps/server/prisma ./prisma
# Agent prompts are read at runtime relative to the working directory.
COPY apps/server/src/ai/agents/prompts ./src/ai/agents/prompts
COPY --chmod=0755 apps/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /data/uploads && chown -R node:node /data
VOLUME ["/data/uploads"]
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
