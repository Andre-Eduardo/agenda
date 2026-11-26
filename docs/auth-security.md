# Segurança de autenticação

Resumo das proteções de sessão, cadastro e acesso a arquivos. Variáveis de ambiente detalhadas em
`apps/server/.env.example` (seção "Segurança").

## Segredos de sessão

`COOKIE_SECRET` (assinatura dos cookies) e `AUTH_TOKEN_SECRET` (assinatura do JWT) são
obrigatórios em produção, com pelo menos 32 caracteres e diferentes do valor de desenvolvimento.
A validação roda em `EnvConfigService.load()`, então o processo falha no startup em vez de subir
com um segredo conhecido. Fora de produção, se ausentes, caem no valor fixo de desenvolvimento.

Trocar qualquer um dos dois derruba todas as sessões abertas.

## Rate limit

`@RateLimit()` (`application/@shared/rate-limit`) marca a rota; o `RateLimitGuard` global, que roda
antes do `AuthGuard`, conta em janelas fixas em memória e responde 429 com `Retry-After`.

| Rota | Limites |
|------|---------|
| `POST /auth/sign-in` | 20/min por IP · 10 a cada 15 min por username |
| `POST /auth/password-reset/request` | 10 a cada 15 min por IP · 3 a cada 15 min por e-mail |
| `POST /auth/password-reset/confirm` | 10 a cada 15 min por IP |
| `POST /user/sign-up` | 10/h por IP |

Atrás de proxy, configure `TRUST_PROXY` para o IP do cliente chegar ao guard e ao audit log.
Os contadores são por instância; ao escalar horizontalmente, mova o store para Redis.

## Swagger

Desligado por padrão em produção (`SWAGGER_ENABLED`). Em desenvolvimento o `openapi.json`
continua sendo gerado.

## Cadastro

`POST /user/sign-up` cria um usuário `GlobalRole.OWNER`, que pode abrir clínicas. O acesso é
controlado por `SIGN_UP_MODE`:

- `open`: qualquer um (padrão fora de produção, usado pelos testes BDD);
- `invite`: exige `inviteCode` igual a `SIGN_UP_INVITE_CODE`;
- `closed`: recusado com 403 (padrão em produção).

Membros da equipe são criados por um gestor da clínica em `POST /clinic-members/accounts`, que cria
o usuário com `GlobalRole.NONE` e o vínculo na mesma transação. `POST /clinics` recusa usuários
`GlobalRole.NONE`, então um membro não consegue abrir uma clínica própria.

## Recuperação de senha

1. `POST /auth/password-reset/request {email}` responde 204 sempre, exista ou não a conta.
   Se existir, envia por SES um link `${WEB_APP_URL}/auth/reset-password?token=...`.
2. O token é um JWT com escopo `RECOVERY` (não serve como sessão) e a claim `pwd`, uma
   impressão digital do hash atual da senha (`ObfuscatedPassword.fingerprint()`).
3. `POST /auth/password-reset/confirm {token, newPassword}` valida assinatura, validade, escopo
   e a impressão digital. Como a nova senha tem novo salt, o link funciona uma vez só e qualquer
   link anterior morre quando a senha muda.

Sem `MAIL_FROM_ADDRESS`, nada é enviado; fora de produção o link aparece no log.

Limitação: sessões JWT já emitidas continuam válidas até expirar depois da troca de senha.

## Arquivos locais (`/uploads`)

Com `STORAGE_TYPE=local`, os arquivos em `LOCAL_UPLOAD_DIR` são servidos por
`infrastructure/storage/protected-uploads.handler.ts`, montado em `setupApp`, só para quem tem
cookie de sessão válido (escopo `AUTH`). Antes eram servidos publicamente pelo
`ServeStaticModule`. A checagem é de autenticação, não de clínica: os nomes são UUIDv7, mas um
usuário de outra clínica com a URL ainda conseguiria baixar o arquivo.
