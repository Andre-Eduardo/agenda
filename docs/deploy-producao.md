# Deploy em produção (Docker Compose)

**Estado:** stack genérica, sem provedor de hospedagem definido. Roda em qualquer
VM/servidor com Docker Engine 24+ e Docker Compose v2.24+.

## Visão geral

`deploy/docker-compose.prod.yml` sobe cinco serviços:

| Serviço | Imagem (Dockerfile) | Papel |
| --- | --- | --- |
| `postgres` | `pgvector/pgvector:pg16` | Banco. Volume `postgres-data`. Sem porta publicada. |
| `server` | `apps/server/Dockerfile` | API NestJS (Node 24, pnpm 11). Aplica as migrations ao iniciar. |
| `web` | `apps/web/Dockerfile` | SPA servida por nginx (sem root). Faz proxy de `/api`, `/uploads` e `/socket.io` para o `server`. |
| `backup` | `ops/backup/Dockerfile` | Agenda o `ops/backup/agenda-backup.mjs` (backup diário + verificação de hora em hora). |
| `caddy` | `caddy:2.8-alpine` | Opcional (`--profile tls`): HTTPS com certificado automático. |

O navegador só fala com o `web` (mesma origem), então cookies de sessão e
chamadas `/api` funcionam sem CORS. O `server` e o `postgres` ficam em rede
interna.

## Primeiro deploy

```sh
cd deploy
cp .env.example .env              # variáveis do compose (senha do banco, backup, domínio)
cp server.env.example server.env  # variáveis da aplicação (segredos, URL pública, IA, Asaas)
mkdir -p secrets backups
openssl rand -hex 32 > secrets/backup.key && chmod 600 secrets/backup.key
chmod 700 backups
# preencha .env e server.env (POSTGRES_PASSWORD, COOKIE_SECRET, AUTH_TOKEN_SECRET, PUBLIC_BASE_URL...)

docker compose -f docker-compose.prod.yml up -d --build                 # atrás de um proxy/LB próprio
docker compose -f docker-compose.prod.yml --profile tls up -d --build   # com HTTPS via Caddy
```

- Sem proxy próprio e sem Caddy, publique o web direto: `WEB_PUBLISH=0.0.0.0:80`.
- Com Caddy, mantenha `WEB_PUBLISH` em `127.0.0.1:8080`, aponte o DNS de `DOMAIN`
  para o servidor e libere as portas 80 e 443.
- `PUBLIC_BASE_URL` deve ser a origem pública (ex.: `https://agenda.clinica.com.br`).
- As variáveis `AGENT_*` em `server.env` são lidas na inicialização; o server não
  sobe se faltar alguma.

## Atualização

```sh
git pull
cd deploy && docker compose -f docker-compose.prod.yml up -d --build
```

O `server` roda `prisma migrate deploy` antes de iniciar (`RUN_MIGRATIONS=true`).
Se a migration falhar, o contêiner encerra e o anterior já foi parado: confira
`docker compose logs server`. Para aplicar migrations manualmente, use
`RUN_MIGRATIONS=false` e rode
`docker compose run --rm server ./node_modules/.bin/prisma migrate deploy`.
Faça um backup manual antes de migrations destrutivas (ver abaixo).

Com registro de imagens, defina `IMAGE_REGISTRY`/`IMAGE_TAG`, rode
`docker compose build && docker compose push` no CI e `docker compose pull && docker compose up -d`
no servidor.

## Health checks

| Endpoint | Uso |
| --- | --- |
| `GET /api/health/live` | Processo no ar (liveness). Não toca no banco. |
| `GET /api/health` | Processo e banco respondendo (readiness). `503` se o banco cair. |
| `GET /healthz` (web) | nginx no ar. |

São públicos, não exigem login e ficam fora do OpenAPI. Os `HEALTHCHECK` das
imagens e o `depends_on` do compose usam esses endpoints; aponte o load balancer
para `/api/health`.

## Uploads persistentes

- `STORAGE_TYPE=LOCAL` (padrão): arquivos em `/data/uploads`, no volume Docker
  `uploads`. Recriar contêineres não apaga os arquivos; `docker compose down -v`
  apaga. O volume entra no backup.
- `STORAGE_TYPE=S3`: defina `STORAGE_S3_*` em `server.env`. Para provedores
  compatíveis (MinIO, Cloudflare R2, DigitalOcean Spaces, Backblaze B2) use
  `STORAGE_S3_ENDPOINT` e, se necessário, `STORAGE_S3_FORCE_PATH_STYLE=true`.
  Nesse modo o job de backup recusa rodar (o bucket precisa de versionamento e
  replicação próprios, ver [runbook](backup-restore-runbook.md)); desative o
  serviço `backup` ou mantenha só o banco coberto por outro meio.

## Backup em produção

O serviço `backup` executa `agenda-backup.mjs backup` todo dia em
`BACKUP_SCHEDULE_UTC` (padrão 05:00 UTC = 02:00 em Brasília), roda `check` depois
de cada backup e a cada `BACKUP_CHECK_INTERVAL_MINUTES`, e faz um backup ao
iniciar (desative com `BACKUP_RUN_ON_START=false`). Os jobs nunca se sobrepõem.
O contêiner fica `unhealthy` quando o último `check` falha, e `BACKUP_ALERT_URL`
recebe as falhas.

- `BACKUP_HOST_DIR` deve apontar para um disco ou montagem **fora** do host
  principal (volume de bloco separado, NFS, montagem rclone de um bucket com
  imutabilidade). O padrão `./backups` serve só para testes.
- A chave (`secrets/backup.key`) precisa de modo `0600` e de cópia guardada
  fora do servidor. Sem ela não há restauração.
- Backup manual: `docker compose -f docker-compose.prod.yml exec backup node agenda-backup.mjs backup`.
- Restauração e ensaio: [backup-restore-runbook.md](backup-restore-runbook.md).

## CI (Jenkins)

O `Jenkinsfile` usa `Dockerfile.build` (Node 24, pnpm 11, Docker CLI), instala com
`pnpm install --frozen-lockfile` (todas as dependências são públicas), roda
typecheck, lint, testes unitários, testes dos scripts de backup e integração
(Postgres com pgvector), build e, na `master`, constrói as três imagens.
