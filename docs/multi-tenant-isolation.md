# Multi-Tenant Isolation

Este SaaS usa um **banco de dados único compartilhado** entre todas as clínicas. Cada **Clínica é um tenant isolado** — seus dados (pacientes, agendamentos, prontuários, formulários, chats) não podem vazar para outras clínicas.

> **Mudança recente (Abr/2026).** O modelo anterior usava `Professional` como tenant. Agora `Clinic` é o tenant raiz, e `ClinicMember` é o ator central que liga User↔Clinic com papéis (OWNER/ADMIN/PROFESSIONAL/SECRETARY/VIEWER). Permissões granulares por paciente vivem em `ClinicPatientAccess`; overrides por documento, em `DocumentPermission`.

---

## Modelo de dados

```
User ──▶ ClinicMember ──▶ Clinic
              │
              ├── role (OWNER/ADMIN/PROFESSIONAL/SECRETARY/VIEWER)
              ├── Professional? (1:1, apenas quando role=PROFESSIONAL)
              ├── ClinicPatientAccess[] (permissão por paciente)
              ├── DocumentPermission[]  (override por documento)
              ├── createdAppointments[], attendedAppointments[]
              ├── createdRecords[], createdFiles[], ...
              └── chatSessions[], contextSnapshots[]

Clinic
  ├── members: ClinicMember[]
  ├── patients: Patient[]
  ├── appointments, records, clinicalProfiles, ...
  └── isPersonalClinic: boolean   // autônomo → 1 owner, sem equipe
```

Toda entidade clínica (Patient, Appointment, Record, ClinicalProfile, PatientAlert, PatientForm, FormTemplate?, ChatSession, ContextSnapshot/Chunk, InteractionLog, AgentProposal, KnowledgeChunk?) tem `clinicId` como **boundary de tenant**.

A maioria também tem `createdByMemberId` (auditoria — quem digitou) e, quando faz sentido (Record, ClinicalProfile, PatientForm), `responsibleProfessionalId` (responsável clínico ≠ quem digitou).

---

## Como funciona o isolamento

### 1. Cookie de membro

Ao fazer sign-in e selecionar a clínica/papel, o servidor define o cookie `current.clinic_member` (configurável via `CLINIC_MEMBER_COOKIE_NAME`, fallback temporário para `COMPANY_COOKIE_NAME`) com o UUID do `ClinicMember` ativo. O cookie é **assinado** (`httpOnly`, `signed: true`) — não pode ser forjado pelo cliente.

```
Cookie: current.clinic_member=<signed:clinicMemberId>
```

### 2. AuthGuard (global)

Registrado como `APP_GUARD`, intercepta **todas** as requisições autenticadas:

1. Lê o JWT do cookie de autenticação
2. Lê o `clinicMemberId` do cookie de membro
3. **Valida** que o `clinicMemberId` do cookie aparece na lista `token.clinicMembers[]` do JWT (cada entry traz `{clinicMemberId, clinicId}`) — impede que um User assuma um membro a que não tem direito
4. Popula `request.actor` com `userId`, `clinicId` (resolvido da entry do JWT) e `clinicMemberId` para que os serviços os consumam

```
apps/server/src/application/@shared/auth/auth.guard.ts
```

### 3. RequestContextMiddleware

Injeta o `clinicMemberId` do cookie automaticamente em todas as requisições:

- `GET`: popula `query.clinicMemberId`
- Demais métodos: popula `body.clinicMemberId`

Isso garante que DTOs recebam o `clinicMemberId` correto sem depender do frontend enviá-lo explicitamente.

```
apps/server/src/application/@shared/auth/context/request-context.middleware.ts
```

### 4. Actor com clinicId + clinicMemberId

```typescript
// domain/@shared/actor/index.ts
export type Actor = Override<
    MaybeAuthenticatedActor,
    {userId: UserId; clinicId: ClinicId; clinicMemberId: ClinicMemberId}
>;
```

Serviços consomem `actor.clinicId` e/ou `actor.clinicMemberId` conforme a necessidade:

- **`actor.clinicId`** — boundary de tenant. Toda query de listagem deve filtrar por ele.
- **`actor.clinicMemberId`** — autor da ação. Vai pra colunas de auditoria (`createdByMemberId`, `attendedByMemberId`, etc.).

### 5. Serviços e repositórios

Serviços de listagem **sempre** propagam `actor.clinicId` como filtro obrigatório para o repositório:

```typescript
// Exemplo: SearchPatientsService
const result = await this.patientRepository.search(pagination, {
    clinicId: actor.clinicId,
    term: payload.term,
});
```

Serviços de criação injetam `clinicId` da clínica e `createdByMemberId` do membro autor:

```typescript
const appointment = Appointment.create({
    clinicId: actor.clinicId,
    attendedByMemberId: payload.attendedByMemberId,
    createdByMemberId: actor.clinicMemberId,
    patientId: payload.patientId,
    // ...
});
```

### 6. Decoradores

- `@BypassClinicMember()` — pula a validação de membro no AuthGuard. Use para endpoints que operam ao nível de User (ex: criação de Clinic, aceitar convite) ou que não precisam de contexto de membro.
- `@Authorize(Permission)` — checa permissões via `Authorizer.validate(clinicMemberId, userId, permission)`.

---

## Permissionamento granular

Além do filtro por `clinicId`, há dois níveis adicionais que se aplicam dentro de uma clínica:

### ClinicPatientAccess (acesso por paciente)

`(clinicId, memberId, patientId) → accessLevel ∈ FULL | READ_ONLY | REGISTER_ONLY | NONE`

- **FULL** — leitura + escrita irrestrita do paciente
- **READ_ONLY** — apenas leitura
- **REGISTER_ONLY** — pode cadastrar dados básicos / fazer upload, mas não lê documentos clínicos (caso típico: secretaria no cadastro inicial)
- **NONE** — revogação explícita

OWNER e ADMIN ignoram esse check (acesso total por definição).

### DocumentPermission (override por documento)

`(clinicId, memberId, entityType, entityId) → canView`

Polimórfico: aplica-se a Record, File, ImportedDocument, PatientForm, ClinicalProfile, PatientAlert. Quando existe registro, sobrescreve o resultado de ClinicPatientAccess para aquele documento específico.

### Resolução de permissão (em ordem)

1. Role no `ClinicMember` (teto funcional — ex: VIEWER nunca consegue criar)
2. `ClinicPatientAccess` (acesso ao paciente)
3. `DocumentPermission` (override por documento, se existir)

---

## Casos de uso

### Profissional autônomo (sem equipe)

Cria-se uma `Clinic` com `isPersonalClinic = true`. Apenas um `ClinicMember` (OWNER) liga o User à clínica. O frontend esconde menus de gestão de equipe.

### Clínica com equipe

OWNER cria a clínica e convida membros. Cada convite gera um `ClinicMember` com role apropriada. ADMIN gerencia membros (exceto OWNER) e permissões; PROFESSIONAL atende; SECRETARY agenda; VIEWER lê.

### Mesmo profissional em duas clínicas

**Decisão**: dois logins distintos. Um User pertence a uma única Clinic. (Fica fácil de evoluir depois para multi-clinic-per-user — basta remover a constraint de unique `(clinic_id, user_id)` no schema, mas hoje não é suportado.)

---

## Arquivos críticos

| Caminho | Papel |
|---|---|
| `apps/server/prisma/schema.prisma` | Modelo: Clinic, ClinicMember, ClinicPatientAccess, DocumentPermission + clinicId em todas as entidades clínicas |
| `apps/server/src/domain/@shared/actor/index.ts` | `Actor` carrega `clinicId` + `clinicMemberId` |
| `apps/server/src/domain/user/token/token.ts` | JWT payload — `clinicMembers[]` com `(clinicMemberId, clinicId)` |
| `apps/server/src/infrastructure/auth/jwt/json-web-token.ts` | Encode/decode do JWT |
| `apps/server/src/application/@shared/auth/auth.guard.ts` | Validação cookie ↔ JWT |
| `apps/server/src/application/@shared/auth/context/request-context.middleware.ts` | Injeção do `clinicMemberId` no request |
| `apps/server/src/infrastructure/auth/express-context-actions.ts` | `setClinicMember()` para definir o cookie |
| `apps/server/src/application/@shared/auth/bypass-clinic-member.decorator.ts` | `@BypassClinicMember()` |

---

## Variáveis de ambiente

| Var | Default | Descrição |
|---|---|---|
| `CLINIC_MEMBER_COOKIE_NAME` | `current.clinic_member` | Nome do cookie de membro ativo |
| `COMPANY_COOKIE_NAME` | — | Fallback de transição enquanto migra. Será removido em release futura. |
| `AUTH_COOKIE_NAME` | `session.token` | Cookie do JWT |
| `COOKIE_SECRET` | `super-secret` | Segredo para assinar cookies |
