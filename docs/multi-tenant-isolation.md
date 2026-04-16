# Multi-Tenant Isolation

Este SaaS usa um **banco de dados único compartilhado** entre todos os profissionais. Cada profissional é um tenant isolado — seus dados (pacientes, agendamentos, prontuários) não podem vazar para outros profissionais.

---

## Como funciona o isolamento

### 1. Cookie de profissional

Quando o profissional faz login e seleciona seu perfil, o servidor define um cookie `current.company` (configurável via `COMPANY_COOKIE_NAME`) com o UUID do professional. Este cookie é **assinado** (`httpOnly`, `signed: true`) e não pode ser forjado pelo cliente.

```
Cookie: current.company=<signed:professionalId>
```

### 2. AuthGuard (global)

Registrado como `APP_GUARD`, intercepta **todas** as requisições autenticadas:

1. Lê o JWT do cookie de autenticação
2. Lê o `professionalId` do cookie de profissional
3. **Valida** que o `professionalId` do cookie está na lista `token.professionals[]` do JWT — impedindo que um usuário forje um `professionalId` de outro
4. Define `request.actor.professionalId` para que os serviços o consumam

```
apps/server/src/application/@shared/auth/auth.guard.ts
```

### 3. RequestContextMiddleware

Injeta o `professionalId` do cookie automaticamente em todas as requisições:

- Requisições `GET`: popula `query.professionalId`
- Demais métodos: popula `body.professionalId`

Isso garante que DTOs de criação recebam o `professionalId` correto sem depender do frontend enviá-lo explicitamente.

```
apps/server/src/application/@shared/auth/context/request-context.middleware.ts
```

### 4. Actor com professionalId

O tipo `Actor` carrega o `professionalId` do profissional autenticado. Os serviços o consomem via `actor.professionalId`:

```typescript
// domain/@shared/actor/index.ts
export type Actor = Override<MaybeAuthenticatedActor, {
    userId: UserId;
    professionalId: ProfessionalId | null;  // null apenas em rotas @BypassProfessional
}>;
```

### 5. Serviços e repositórios

Serviços de listagem **sempre** propagam o `actor.professionalId` como filtro obrigatório para o repositório:

```typescript
// Exemplo: SearchPatientsService
async execute({actor, payload}: Command<SearchPatientsDto, Actor>) {
    return this.patientRepository.search(pagination, {
        term: payload.term,
        professionalId: actor.professionalId ?? undefined, // filtro de tenant
    });
}
```

Repositórios incluem `professionalId` no `WHERE` de todas as queries de listagem e de busca por ID:

```typescript
// PatientPrismaRepository.search()
const where = {
    professionalId: filter.professionalId?.toString(),
    // ...
};

// PatientPrismaRepository.findById()
const patient = await this.prisma.patient.findFirst({
    where: { id, professionalId: professionalId?.toString() },
});
```

---

## Constraints de banco de dados

### Antes (vulnerável)

```sql
-- Impedia que o mesmo CPF fosse cadastrado por dois profissionais diferentes
UNIQUE (document_id)  -- em person
UNIQUE (document_id)  -- em patient
```

### Depois (correto)

```sql
-- Permite o mesmo CPF em diferentes tenants, mas não dentro do mesmo tenant
UNIQUE (document_id, professional_id)  -- em patient
```

A tabela `person` não tem mais constraint de unicidade em `document_id` — ela é uma entidade base, e a unicidade real é imposta no nível do `patient` por profissional.

---

## Regra geral para novos recursos

> **Todo método de listagem ou busca em um repositório que acessa dados de pacientes deve incluir `professionalId` no filtro.**

Checklist ao criar um novo serviço de listagem:

- [ ] O `Command` recebe `Actor` como tipo do actor
- [ ] O `professionalId` é extraído via `actor.professionalId`
- [ ] O repositório recebe `professionalId` no filtro
- [ ] O Prisma query inclui `professionalId` no `WHERE`

### Decoradores disponíveis

| Decorador | Uso |
|-----------|-----|
| `@RequestActor()` | Extrai o `Actor` (com `professionalId`) do request |
| `@Authorize(...perms)` | Valida permissões — implica autenticação e professional obrigatórios |
| `@BypassProfessional()` | Permite a rota sem professional cookie (ex: login, criação de conta) |
| `@Public()` | Desativa autenticação completamente |

---

## Referências

- Guard: [auth.guard.ts](../apps/server/src/application/@shared/auth/auth.guard.ts)
- Middleware: [request-context.middleware.ts](../apps/server/src/application/@shared/auth/context/request-context.middleware.ts)
- Actor type: [domain/@shared/actor/index.ts](../apps/server/src/domain/@shared/actor/index.ts)
- Migration: [20260415000000_scope_patient_document_id_to_professional](../apps/server/prisma/migrations/20260415000000_scope_patient_document_id_to_professional/migration.sql)
- Padrão original (automo-app): `I:\Ecxus\automo-app\apps\server\src\application\@shared\auth\`
