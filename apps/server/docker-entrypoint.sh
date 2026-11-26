#!/bin/sh
# Entrypoint for the production server image.
# Applies pending Prisma migrations (unless RUN_MIGRATIONS=false) and then starts the given command.
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
    ./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
fi

if [ "${STORAGE_TYPE:-LOCAL}" = "LOCAL" ]; then
    mkdir -p "${LOCAL_UPLOAD_DIR:-/data/uploads}"
fi

exec "$@"
