# Tipos de conta: autônomo (SOLO) e clínica (CLINIC)

Um só sistema e um só tenant (`Clinic`). O tipo de conta (`Clinic.accountType`) decide
quais **módulos de clínica** existem. Todo o resto (pacientes, agenda, prontuário,
documentos, pagamentos do paciente, lembretes, IA, auditoria) é igual nos dois.

| Tipo | Para quem | Membros |
| --- | --- | --- |
| `SOLO` | Profissional autônomo que usa o sistema sozinho | 1 (OWNER + PROFESSIONAL). Vínculos de suporte não contam. |
| `CLINIC` | Clínica com equipe | Vários, limitados pela licença |

## Módulos de clínica

Fonte da verdade: `apps/server/src/domain/clinic-license/models/operational-module.ts`.

| Módulo | Permissões | Ligado quando |
| --- | --- | --- |
| `TEAM` | `professional-agenda-access:*`, `clinic-patient-access:*`, `document-permission:*` | `accountType = CLINIC` |
| `RECEPTION` | `patient-call:*` | `Clinic.receptionEnabled = true` (padrão em CLINIC; opcional no SOLO, em Configurações) |

- Ao contrário dos pacotes de IA, valem para a clínica inteira: não há vaga nem liberação por membro.
- O papel continua sendo o teto; o `ModuleAuthorizer` filtra as permissões do módulo desligado e
  nega com `403 MODULE_NOT_ENABLED`.
- `clinic-member:create` fica fora do módulo porque a mesma permissão lista os membros.
  O bloqueio do segundo membro numa conta SOLO fica em `CreateClinicMemberService`
  (vale para `POST /clinic-members`, `/invite` e `/accounts`).
- Salas continuam no liga/desliga que já existia (`roomManagementEnabled`), nos dois tipos.

## Pacotes de IA no SOLO

Numa conta SOLO o pacote contratado vale direto para o único membro, sem a tela de liberação
(`ModuleAccess.getMemberModules`).

## API

- `GET /clinic-members/me/modules` devolve `modules` (IA), `operationalModules` e `accountType`.
  O web usa isso para montar menu e rotas (`useAccount`).
- `Clinic` expõe `accountType` e `receptionEnabled`. `isPersonalClinic` continua na resposta
  e na criação como alias obsoleto (`true` = SOLO).
- `PUT /clinics/me/account-type` (`ChangeClinicAccountTypeService`): só o OWNER (sem acesso de
  suporte) troca o tipo. SOLO → CLINIC exige `confirmTeamAccess: true` e liga a recepção.
  CLINIC → SOLO exige no máximo um membro ativo (fora acesso de suporte). Falha de pré-condição
  responde 409. Emite `CLINIC_ACCOUNT_TYPE_CHANGED` e grava no audit log
  (`CLINIC_ACCOUNT_TYPE:CHANGE:<tipo>`). No web fica em Configurações > Geral.
- `GET /admin/clinics?accountType=SOLO|CLINIC` filtra a lista do admin (filtro e selo na tela
  `/admin`).

## Cadastro e cobrança

- `POST /onboarding/solo` (tela `/auth/sign-up`): usuário, conta SOLO, membro OWNER + PROFESSIONAL,
  registro profissional e assinatura `STARTER` numa transação. Aceite dos termos obrigatório
  (`Clinic.termsAcceptedAt`, `termsVersion`). Controlado por `SIGN_UP_SOLO_MODE`.
- Planos de autônomo: `STARTER` e `CONSULTORIO`. A assinatura nasce sem IDs do Asaas; a cobrança é
  ativada pelo fluxo de pagamento que já existe.

## Migração

`20261127010000_clinic_account_type`: clínicas com `is_personal_clinic = true` e no máximo um
membro de verdade viram `SOLO` sem recepção; todas as outras viram `CLINIC` com recepção ligada,
para nenhuma clínica perder tela.

## Web

- `useAccount()` (`apps/web/src/hooks/useAccount.ts`): `accountType`, `isSolo` e
  `hasClinicModule(module)`. Telas perguntam pelo módulo; o tipo de conta só muda textos.
- Menu (`StackedLayout`): itens com `clinicModule` somem quando o módulo está desligado
  (Recepção, Profissionais, Equipe). No SOLO, Financeiro vira "Meu financeiro" e
  Configurações vira "Meu perfil e consultório".
- Rotas de clínica (`/team`, `/team/$memberId`, `/professionals`, `/reception`,
  `/reception/panel-settings`) ficam atrás de `ClinicModuleGate`, que explica o que falta
  em vez de mostrar erros 403.
- Configurações → Geral liga e desliga a recepção (`receptionEnabled`).
