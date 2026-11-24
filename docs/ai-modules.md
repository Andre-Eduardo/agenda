# Pacotes de IA e licença da clínica

Tudo que chama LLM ou embeddings é vendido em pacotes. O sistema base (agenda,
pacientes, ficha, evolução, documentos, financeiro, equipe) funciona sem eles.

## Regra

Uma permissão de pacote só vale quando **a clínica contratou o pacote** e
**o membro foi liberado** nele. O papel (`clinicMemberRolePermissionsMap`)
continua sendo o teto; o pacote filtra em cima dele.

| Pacote | Permissões |
| --- | --- |
| `AI_CHAT` | `clinical-chat:*`, `knowledge-base:*` |
| `AI_AGENT` | `agent:*`, `agent-proposal:*`, `knowledge-base:*` |
| `AI_FORMS` | `ai-form:*` |
| `AI_DOCUMENT_IMPORT` | `draft-evolution:*` |

Fonte da verdade: `apps/server/src/domain/clinic-license/models/module-type.ts`.

## Peças

- `ClinicLicense` (`domain/clinic-license`): profissionais incluídos/extras/máximo,
  pacotes contratados com vagas, membros liberados. Extras só entram com
  `acceptExtraCharge: true`; acima do máximo, `SEAT_LIMIT_REACHED`.
- `ModuleAccess`: consultas `isClinicModuleEnabled` / `isMemberModuleEnabled`.
- `ModuleAuthorizer`: envolve o authorizer em `createAuthorizer` e explica a
  negação com `MODULE_NOT_ENABLED` ou `MODULE_NOT_ASSIGNED`.
- Sem linha em `clinic_license` = sistema base. Só o seed liga os pacotes
  (`prisma/seeds/clinic-license.seed.ts`).

## Endpoints

| Método e rota | Quem | O que faz |
| --- | --- | --- |
| `GET /clinics/me/license` | `clinic-module:view` (OWNER/ADMIN) | Profissionais incluídos/extras/máximo/ativos e pacotes com vagas e membros |
| `PUT /clinics/me/modules/:moduleType/members` | `clinic-module:assign` (OWNER/ADMIN) | Lista completa de membros do pacote; só profissionais ativos |
| `GET /clinic-members/me/modules` | qualquer membro | Pacotes que o membro atual pode usar (para o front esconder o resto) |
| `GET /admin/clinics/:clinicId/license` | `clinic-license:manage` (só SUPER_ADMIN) | Licença de qualquer clínica |
| `PATCH /admin/clinics/:clinicId/license` | `clinic-license:manage` (só SUPER_ADMIN) | Contratação: limites de profissionais e pacotes; pacote omitido é desligado |

Respostas de vaga (409): `EXTRA_SEAT_CONFIRMATION_REQUIRED` (reenviar com
`acceptExtraCharge: true`) e `SEAT_LIMIT_REACHED` (só com upgrade). Valem para
`PUT .../members` e para `POST /clinic-members` e `POST /clinic-members/invite`
quando o novo membro é `PROFESSIONAL`.

Negação por pacote (403): `MODULE_NOT_ENABLED` (clínica não contratou) e
`MODULE_NOT_ASSIGNED` (membro não liberado).

## Barreira final

`AiProviderRegistry.getChatProvider(clinicId)` e `getEmbeddingProvider(clinicId)`
devolvem providers que recusam a chamada paga quando a clínica não tem nenhum
pacote de IA. `null` é uso da plataforma (base de conhecimento global).

## Checklist para uma funcionalidade nova com IA

1. Criar uma permissão própria (nunca reaproveitar `record:*`, `patient-form:*`…)
   e colocá-la no pacote certo em `module-type.ts`.
2. Proteger o endpoint com `@Authorize` dessa permissão e atualizar
   `docs/rbac-matrix.md` (o teste `rbac-matrix.test.ts` compara).
3. Listener, job ou handler que chama IA: checar
   `moduleAccess.isClinicModuleEnabled(clinicId, ...)` antes, e pedir o provider
   ao registry passando a clínica.
4. Endpoint com cota (`@UseUsageLimit`): mapear a métrica em `METRIC_MODULE`
   (`usage-limit.guard.ts`).
5. Web: esconder menu, botão e rota quando o membro não tem o pacote.
6. Teste cobrindo: clínica sem pacote, membro não liberado, membro liberado.
