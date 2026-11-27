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

### Cadastro do autônomo

`POST /onboarding/solo` cria numa transação o usuário (`GlobalRole.OWNER`), a conta `SOLO`, o membro
OWNER + PROFESSIONAL, o registro profissional e a assinatura inicial (`STARTER`). Exige
`acceptTerms: true` e grava `Clinic.termsAcceptedAt` e `termsVersion`. Mesmo rate limit do sign-up
(10/h por IP). O acesso segue `SIGN_UP_SOLO_MODE` (mesmos valores; omitido, vale `SIGN_UP_MODE`), o que
permite abrir só o autônomo em produção. Tela: `/auth/sign-up`.

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

## Usuário global de suporte (multiclínica)

Equivalente ao usuário de suporte do plexter: entra em qualquer clínica para avaliar a
configuração sem estar cadastrado como funcionário dela.

- **Quem é:** um usuário com `GlobalRole.SUPPORT`. Só um `SUPER_ADMIN` cria e revoga esses
  usuários (`/admin/support-users`, permissão `support-user:manage`). Revogar volta o papel para
  `NONE`, e como o `AuthGuard` confere o papel global a cada request de um acesso de suporte, o
  usuário perde as clínicas na hora, mesmo com a sessão aberta.
- **Como entra:** `POST /support-access/clinics/:clinicId` (permissão `support-access:enter`, que
  só `SUPPORT` e `SUPER_ADMIN` têm). Como toda ação aqui precisa de um `ClinicMember` (autoria e
  auditoria), a primeira entrada cria um vínculo técnico (`ClinicMember.supportAccess = true`)
  sem papel de clínica. Ele não aparece na equipe, não ocupa vaga da licença e não entra no token
  no login: o usuário sempre escolhe a clínica de forma explícita. Se o usuário já é funcionário
  da clínica, entra pelo vínculo normal.
- **O que pode fazer:** só ler, sem dados clínicos (`SUPPORT_PERMISSIONS` em `GlobalAuthorizer`).
  Prontuário, evoluções, perfil clínico, documentos, formulários, alertas e IA ficam de fora, e o
  `PatientAccessChecker` só libera cadastro e agenda do paciente. Por segurança extra, o
  `AuthGuard` recusa (e audita) qualquer método que não seja `GET`, `HEAD` ou `OPTIONS` vindo de
  um acesso de suporte. Um `SUPER_ADMIN` que entra pelo mesmo fluxo tem acesso total.
- **Auditoria:** a entrada (`SUPPORT_ACCESS:ENTER`), a saída (`SUPPORT_ACCESS:LEAVE`, em
  `POST /support-access/leave`) e cada request feita lá dentro ficam no log de auditoria da
  própria clínica, com o vínculo de suporte como autor.
