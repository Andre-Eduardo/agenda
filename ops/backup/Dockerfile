# syntax=docker/dockerfile:1
#
# Backup runner for production: encrypted pg_dump + uploads tarball on a schedule.
# Build from the repository root:
#   docker build -f ops/backup/Dockerfile -t agenda/backup .

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine

# pg_dump/pg_restore must match the major version of the PostgreSQL server (pgvector/pgvector:pg16).
ARG PG_MAJOR=16
RUN apk add --no-cache "postgresql${PG_MAJOR}-client" tar tini

WORKDIR /opt/agenda/ops/backup
COPY ops/backup/agenda-backup.mjs ops/backup/scheduler.mjs ./

ENV BACKUP_DIR=/backups \
    BACKUP_KEY_FILE=/run/secrets/backup_key \
    LOCAL_UPLOAD_DIR=/data/uploads \
    BACKUP_SCHEDULE_UTC=05:00 \
    BACKUP_CHECK_INTERVAL_MINUTES=60 \
    BACKUP_HEALTH_FILE=/tmp/backup-healthy

# Runs as root so it can read the key secret (mode 0600 on the host) and the uploads volume.
HEALTHCHECK --interval=5m --timeout=10s --start-period=2h --retries=1 \
    CMD test -f "$BACKUP_HEALTH_FILE" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "scheduler.mjs"]
