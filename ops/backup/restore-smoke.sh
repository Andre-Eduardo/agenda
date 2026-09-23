#!/usr/bin/env bash
set -euo pipefail

workspace=$(mktemp -d)
container="agenda-backup-smoke-$(basename "$workspace")"
cleanup() {
    docker rm -f "$container" >/dev/null 2>&1 || true
    rm -rf "$workspace"
}
trap cleanup EXIT

mkdir "$workspace/backups" "$workspace/uploads" "$workspace/restore-uploads"
chmod 700 "$workspace/backups"
printf 'synthetic-clinical-file\n' > "$workspace/uploads/sample.txt"
openssl rand -hex 32 > "$workspace/key"
chmod 600 "$workspace/key"

docker run --rm -d --network none --name "$container" \
    -e POSTGRES_HOST_AUTH_METHOD=trust pgvector/pgvector:pg16 >/dev/null
for attempt in {1..30}; do
    if docker exec "$container" sh -c '[ "$(cat /proc/1/comm)" = postgres ]' >/dev/null 2>&1 && \
        docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
    sleep 1
done
docker exec "$container" pg_isready -U postgres >/dev/null
docker exec "$container" createdb -U postgres source
docker exec "$container" createdb -U postgres restore_probe
docker exec "$container" psql -U postgres -d source -v ON_ERROR_STOP=1 \
    -c "CREATE TABLE backup_probe (value text NOT NULL); INSERT INTO backup_probe VALUES ('synthetic-row');" >/dev/null

cat > "$workspace/pg_dump" <<'EOF'
#!/bin/sh
exec docker exec "$RESTORE_TEST_CONTAINER" pg_dump -U postgres -d source -Fc --no-owner --no-privileges
EOF
cat > "$workspace/pg_restore" <<'EOF'
#!/bin/sh
exec docker exec -i "$RESTORE_TEST_CONTAINER" pg_restore -U postgres -d restore_probe \
    --exit-on-error --single-transaction --no-owner --no-privileges
EOF
chmod 700 "$workspace/pg_dump" "$workspace/pg_restore"

export RESTORE_TEST_CONTAINER="$container"
export BACKUP_DIR="$workspace/backups"
export BACKUP_KEY_FILE="$workspace/key"
export DATABASE_URL='postgresql://postgres@localhost:5432/source'
export LOCAL_UPLOAD_DIR="$workspace/uploads"
export PG_DUMP_BIN="$workspace/pg_dump"
export PG_RESTORE_BIN="$workspace/pg_restore"
export RESTORE_DATABASE_URL='postgresql://postgres@localhost:5432/restore_probe'
export RESTORE_UPLOAD_DIR="$workspace/restore-uploads"

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
node "$script_dir/agenda-backup.mjs" backup
node "$script_dir/agenda-backup.mjs" check
backup_name=$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n')
export BACKUP_PATH="$BACKUP_DIR/$backup_name"
node "$script_dir/agenda-backup.mjs" restore

row=$(docker exec "$container" psql -U postgres -d restore_probe -Atqc 'SELECT value FROM backup_probe LIMIT 1')
[[ "$row" == 'synthetic-row' ]]
[[ $(cat "$RESTORE_UPLOAD_DIR/sample.txt") == 'synthetic-clinical-file' ]]
printf 'Isolated PostgreSQL and file restore passed.\n'
