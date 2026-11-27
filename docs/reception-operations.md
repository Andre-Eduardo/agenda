# Fluxo de atendimento: chegada, triagem, chamada e finalização

O atendimento segue quatro passos. O paciente chega e avisa a recepção; a recepção registra a
chegada; quando a clínica exige, a recepção faz a triagem e libera o paciente; o profissional (ou a
recepção) chama o paciente para a sala e, no fim, finaliza o atendimento.

## Recepção (`/reception`)

No topo fica a **Fila de atendimento**, com os pacientes que chegaram e os que estão em atendimento,
de todas as agendas que o membro pode operar. Abaixo, os agendamentos do dia em quatro etapas
(aguardando chegada, na recepção, em atendimento e finalizados). **Registrar chegada** leva
`SCHEDULED` ou `CONFIRMED` a `ARRIVED`. **Marcar falta** leva `SCHEDULED` ou `CONFIRMED` a
`NO_SHOW` após confirmação. A lista do dia continua filtrada pelo acesso ao paciente
(`ClinicPatientAccess`), como antes.

As configurações do painel da TV não ficam mais na recepção: estão em
**Configurações → Painel de chamada**.

## Dashboard do profissional (`/dashboard`)

Quem tem o papel `PROFESSIONAL` vê **Pacientes que chegaram**, só da própria agenda. Cada linha
mostra a hora de chegada, a hora da consulta e o estado (aguardando triagem, triagem concluída,
aguardando chamada ou em atendimento).

- **Chamar** abre a sala ou o local já preenchido: primeiro a sala da consulta, depois a sala padrão
  do profissional (`Professional.defaultRoomId`, com o controle de salas ligado) e, por último, o
  último local digitado neste navegador. A chamada leva `ARRIVED` a `IN_PROGRESS` e, com o painel
  publicado, mostra o nome e o local na TV.
- **Chamar novamente** repete a chamada na TV para quem já está em atendimento.
- **Finalizar** leva `IN_PROGRESS` a `COMPLETED`.

A recepção tem as mesmas ações na Fila de atendimento.

## Quem pode operar cada paciente

Regra do servidor (`AttendanceScope`), aplicada à fila, à chamada, à triagem e à finalização, e
também aos endpoints antigos `PATCH /appointments/:id/call`, `/start` e aos anúncios da fila do
painel:

| Papel | Agendas |
| --- | --- |
| `OWNER`, `ADMIN` | Todas as agendas da clínica |
| `SECRETARY` | As agendas concedidas em `ProfessionalAgendaAccess` (e a própria, se também atende) |
| `PROFESSIONAL` | Só a própria agenda. O profissional chama apenas os seus pacientes. |

Fora do escopo a resposta é `403`.

## Triagem antes da chamada

Em **Configurações → Geral**, **Triagem antes da chamada** (`Clinic.triageRequired`, desligada por
padrão). Ligada, o paciente só pode ser chamado depois que a recepção conclui a triagem; a tentativa
de chamar antes responde `409`.

A triagem (`AppointmentTriage`) tem peso, altura, pressão, frequência cardíaca, temperatura,
saturação e observações, todos opcionais. **Salvar** guarda os dados; **Concluir e liberar** guarda e
libera o paciente para chamada. A liberação não se desfaz. Preencher exige `appointment:triage`
(recepção, `OWNER` e `ADMIN`); o profissional vê os dados em **Ver triagem**.

## API

| Método | Rota | Permissão |
| --- | --- | --- |
| `GET` | `/attendance?scope=mine\|all&dateFrom&dateTo` | `appointment:view` |
| `POST` | `/attendance/:id/calls` `{destination}` | `appointment:call` |
| `POST` | `/attendance/:id/finish` | `appointment:update` |
| `GET` | `/attendance/:id/triage` | `appointment:view` |
| `PUT` | `/attendance/:id/triage` | `appointment:triage` |

## Painel da TV

A configuração (título, mensagem, cores, logotipo, som, duração, últimas chamadas, link) fica em
**Configurações → Painel de chamada**, com `patient-call:configure` e o módulo de recepção ligado.
Com o link publicado, cada chamada aparece na TV pelo tempo configurado. Os endpoints
`/patient-call/queue/*` continuam disponíveis, mas a tela usa o fluxo de atendimento acima.
[Matriz de permissões](./rbac-matrix.md)
