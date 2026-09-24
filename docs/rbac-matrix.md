# Matriz RBAC da clínica — v0.2.0

**Estado:** aprovada pelo solicitante em 2026-09-23.  **Referência:** L0-02, Sprint 0.

Esta tabela explicita o teto de capacidade de cada papel para as permissões de
`apps/server/src/domain/auth/permission.ts`. A implementação atual está em
`apps/server/src/domain/auth/authorizer/clinic-member-role.authorizer.ts`.
Cada célula lista as ações permitidas; `—` significa nenhuma. Ações não listadas
na célula são negadas. A L0-05 acrescenta permissões de gestão de acesso e
verificações de clínica e paciente às ações críticas.

## Regras de interpretação

- O membro precisa estar ativo na clínica. Sem membro ativo, o mapa da clínica
  não concede permissões.
- Papéis múltiplos somam permissões. `OWNER` e `ADMIN` recebem todas as
  permissões hoje registradas em `Permission.all()`; isso inclui permissões
  novas até que a política seja revista. Nenhum papel substitui as verificações
  de vínculo com clínica, paciente, documento ou agenda.
- O papel define apenas o teto funcional. Os endpoints de paciente,
  prontuário, agenda e documento clínico também consultam
  `ClinicPatientAccess`; a leitura individual de prontuário respeita
  `DocumentPermission`. Para agenda de terceiros, aplica-se
  `ProfessionalAgendaAccess`. As ações críticas verificam a clínica do recurso
  antes de ler ou gravar.
- `user:*` representa o catálogo de permissões no contexto da clínica. As
  permissões globais de perfil e inicialização são tratadas separadamente por
  `GlobalAuthorizer`; `SUPER_ADMIN` também está fora desta matriz.
- `clinic-member:create`, `clinic-patient-access:manage` e
  `document-permission:manage` protegem convites e concessões de acesso.
  Alteração,
  remoção e concessão granular de membros não têm permissão dedicada aqui;
  novos endpoints precisam definir essas ações antes de serem expostos.

## Permissões por recurso

| Recurso | OWNER | ADMIN | PROFESSIONAL | SECRETARY | VIEWER |
| --- | --- | --- | --- | --- | --- |
| appointment-payment | register, update, view | register, update, view | view | register, update, view | — |
| appointment-reminder | dispatch, view | dispatch, view | — | — | — |
| appointment | call, cancel, checkin, create, delete, update, view | call, cancel, checkin, create, delete, update, view | call, cancel, checkin, create, update, view | call, cancel, checkin, create, update, view | view |
| billing | view-clinic, view-member | view-clinic, view-member | — | — | — |
| clinic-member | create | create | — | — | — |
| clinic-patient-access | manage | manage | — | — | — |
| clinic-reminder-config | manage, view | manage, view | — | — | — |
| clinic | update | update | — | — | — |
| clinical-chat | create, delete, reindex, update, view | create, delete, reindex, update, view | create, update, view | — | — |
| clinical-document | cancel, create, generate, manage-templates, view | cancel, create, generate, manage-templates, view | create, generate, view | — | — |
| clinical-profile | update, view | update, view | update, view | view | view |
| document-permission | manage | manage | — | — | — |
| financial-report | view | view | — | — | — |
| form-template | create, delete, publish, update, view | create, delete, publish, update, view | view | — | — |
| imported-document | create, update, view | create, update, view | create, update, view | — | — |
| insurance-claim | update, view | update, view | view | update, view | — |
| insurance-plan | create, view | create, view | view | view | — |
| member-block | create, delete, list | create, delete, list | create, delete, list | create, delete, list | — |
| package-plan | create, update, view | create, update, view | view | view | — |
| patient-alert | create, delete, update, view | create, delete, update, view | create, update, view | view | view |
| patient-form | create, delete, update, view | create, delete, update, view | create, update, view | create, view | view |
| patient-insurance-enrollment | create, update, view | create, update, view | view | create, update, view | — |
| patient-package | sell, view | sell, view | view | sell, view | — |
| patient-subscription-plan | create, update, view | create, update, view | view | view | — |
| patient-subscription | cancel, subscribe, view | cancel, subscribe, view | view | cancel, subscribe, view | — |
| patient | create, delete, update, view | create, delete, update, view | create, update, view | create, update, view | view |
| payment | manage, view | manage, view | — | — | — |
| person | create, delete, update, view | create, delete, update, view | — | create, update, view | — |
| professional-agenda-access | grant, list, revoke | grant, list, revoke | — | — | — |
| professional | create, delete, update, view | create, delete, update, view | update, view | — | — |
| record | create, delete, update, view | create, delete, update, view | create, update, view | view | view |
| room | create, delete, update, view | create, delete, update, view | view | view | — |
| subscription | manage, view-clinic | manage, view-clinic | — | — | — |
| upload | prepare, upload | prepare, upload | prepare, upload | prepare, upload | — |
| user | change-password, create, delete, update, view, view-profile | change-password, create, delete, update, view, view-profile | — | — | — |
| working-hours | manage | manage | manage | manage | — |

## Decisões aprovadas

1. `SECRETARY` e `VIEWER` têm `record:view`, `clinical-profile:view`,
   `patient-alert:view` e `patient-form:view` no teto do papel. O acesso a cada
   paciente ou documento depende do controle granular adicional aplicado
   pela L0-05.
2. `PROFESSIONAL` vê dados de pagamento do atendimento, cobertura e planos do
   paciente, mas não registra recebimentos nem altera convênio.
3. `OWNER` e `ADMIN` recebem automaticamente cada nova permissão adicionada ao
   catálogo. Restrições para agir sobre o `OWNER` dependem das regras do caso de
   uso, já que o catálogo contém apenas `clinic-member:create`.

Qualquer mudança posterior nas decisões exige nova versão e revisão da tabela,
do mapa do domínio e do teste de correspondência.
