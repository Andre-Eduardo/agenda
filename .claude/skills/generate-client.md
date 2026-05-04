---
name: generate-client
description: Regenerate the @agenda-app/client package from the server OpenAPI spec
user_invocable: true
---

# Generate API Client

Regenerate o pacote `@agenda-app/client` após mudanças na API do servidor.

## Steps

1. Gerar o `openapi.json` a partir dos decorators NestJS:
   ```bash
   pnpm -F @agenda-app/server openapi:generate
   ```

2. Regenerar os hooks React Query / serviços Axios via Orval:
   ```bash
   pnpm -F @agenda-app/client generate
   ```

3. Se a geração tiver sucesso, rodar typecheck para garantir que não surgiram erros de tipo:
   ```bash
   pnpm -F @agenda-app/app typecheck
   ```

4. Reportar quais serviços/modelos foram adicionados ou alterados verificando o git diff em `packages/client/src/`.

## Important

- Nunca edite manualmente arquivos dentro de `packages/client/src/` — eles são auto-gerados pelo Orval.
- Se a geração falhar, verifique se o servidor compila primeiro: `pnpm -F @agenda-app/server build`
