# Matriz RBAC da clínica — v0.4.0

**Estado:** v0.2.0 aprovada pelo solicitante em 2026-09-23; extensão v0.3.0 aguarda revisão do PR L3-02; extensão v0.4.0 (pacotes de IA) aguarda revisão.
**Referência:** L0-02 e L3-02, Sprint 0.

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
  `ClinicPatientAccess`. A leitura de evoluções também verifica autoria e
  respeita `DocumentPermission` dentro desse escopo. Para agenda de terceiros, aplica-se
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
| agent-proposal | confirm, reject, view | confirm, reject, view | confirm, reject, view | — | — |
| agent | ask, view-metrics | ask, view-metrics | ask, view-metrics | — | — |
| ai-form | view-context | view-context | view-context | — | — |
| audit-log | view | view | — | — | — |
| appointment-payment | register, update, view | register, update, view | view | register, update, view | — |
| appointment-reminder | dispatch, view | dispatch, view | — | — | — |
| appointment | call, cancel, checkin, create, delete, update, view | call, cancel, checkin, create, delete, update, view | call, cancel, checkin, create, update, view | call, cancel, checkin, create, update, view | view |
| billing | view-clinic, view-member | view-clinic, view-member | — | — | — |
| clinic-license | — | — | — | — | — |
| clinic-member | create | create | — | — | — |
| clinic-module | assign, view | assign, view | — | — | — |
| clinic-patient-access | manage | manage | — | — | — |
| clinic-reminder-config | manage, view | manage, view | — | — | — |
| clinic | update | update | — | — | — |
| clinical-chat | create, delete, reindex, update, view | create, delete, reindex, update, view | create, update, view | — | — |
| clinical-document | cancel, create, generate, manage-templates, view | cancel, create, generate, manage-templates, view | create, generate, view | — | — |
| clinical-profile | update, view | update, view | update, view | view | view |
| draft-evolution | approve, update, view | approve, update, view | approve, update, view | — | — |
| document-permission | manage | manage | — | — | — |
| financial-report | view | view | — | — | — |
| form-template | create, delete, publish, update, view | create, delete, publish, update, view | view | — | — |
| imported-document | create, update, view | create, update, view | create, update, view | — | — |
| insurance-claim | update, view | update, view | view | update, view | — |
| insurance-plan | create, view | create, view | view | view | — |
| knowledge-base | ingest, search | ingest, search | search | — | — |
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
| procedure | manage, override | manage, override | — | — | — |
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

## Acesso às consultas e evoluções no dashboard

A visão operacional usa `GET /api/v1/appointments/operational` com
`appointment:view` e o escopo de atendimento do paciente na clínica ativa.
A resposta traz os IDs da consulta e do paciente, início, fim, tipo e estado.
Os detalhes do paciente seguem a permissão `patient:view`.

O escopo clínico da evolução é aplicado antes da paginação e no acesso por ID
ou pelo histórico de emendas. São exigidos o papel `PROFESSIONAL`, a permissão
`record:view`, a autoria por `createdByMemberId` e o acesso clínico ao documento.
O superadmin pode consultar as evoluções dentro da clínica ativa autenticada.
Um vínculo de paciente ou uma concessão de documento a outro membro não amplia
o escopo de autoria. A autoria é obrigatória no banco.

## Revisão v0.3.0 (L3-02)

O novo `audit-log:view` permite consulta da trilha somente a OWNER e ADMIN da
clínica autenticada. A consulta sempre usa a clínica do ator, sem aceitar um ID
de clínica enviado pelo cliente. A aprovação desta ampliação da matriz cabe à
revisão do PR L3-02.

## Revisão v0.4.0 (pacotes de IA)

As funções de IA ganharam recursos próprios: `agent`, `agent-proposal`,
`knowledge-base`, `ai-form` e `draft-evolution`. Antes, o agente, as propostas e
a busca na base de conhecimento usavam `record:view`, o contexto de IA das fichas
usava `patient-form:view` e a pré-evolução usava `imported-document:*`.

1. Esta tabela é só o teto do papel. A permissão de IA só vale quando a clínica
   contratou o pacote correspondente e liberou aquele membro (`ModuleAuthorizer`).
2. `SECRETARY` e `VIEWER` deixam de alcançar o agente, as propostas, a base de
   conhecimento e o contexto de IA das fichas, que antes vinham de `record:view`
   e `patient-form:view`. Os pacotes de IA são licenciados por profissional.
3. `clinic-module:view` e `clinic-module:assign` (ver e liberar pacotes para os
   membros) ficam com `OWNER` e `ADMIN`.
4. `clinic-license:manage` (contratar pacotes e limites de profissionais) é
   reservada a `SUPER_ADMIN` e fica fora de todos os papéis da clínica,
   inclusive `OWNER` e `ADMIN`, que passam a receber `Permission.clinicScoped()`
   em vez de `Permission.all()`.

## Perfil clínico e alertas (L1-07)

Na ficha do paciente, membros com as permissões clínicas do papel e acesso
`FULL` podem preencher alergias, condições crônicas e medicações, além de criar,
editar, ativar e desativar alertas. O perfil mantém o profissional escolhido
na criação. Uma atualização pode limpar um campo explicitamente com `null`.

O acesso `READ_ONLY` permite consultar dados clínicos conforme o papel.
`REGISTER_ONLY` permite as rotinas cadastrais e de agenda concedidas ao membro.
`OWNER` e `ADMIN` têm acesso clínico aos pacientes da própria clínica.

Alertas ativos de gravidade `HIGH` aparecem como **Alertas críticos** na nova
evolução e nos detalhes de um atendimento em aberto. Na Recepção, membros com
acesso clínico veem os dados ao revisar o paciente antes de confirmar a chamada.
Alertas desativados continuam disponíveis na ficha para consulta e reativação.
