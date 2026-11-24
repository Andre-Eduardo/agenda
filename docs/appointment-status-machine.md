# Máquina de estados do agendamento

O estado inicial de um agendamento é `SCHEDULED`. Cada alteração de estado passa pelo agregado `Appointment`, que rejeita transições fora da matriz abaixo com HTTP 409. Os estados `COMPLETED`, `CANCELLED` e `NO_SHOW` são finais.

| Estado atual | Próximos estados permitidos |
| --- | --- |
| `SCHEDULED` | `CONFIRMED`, `ARRIVED`, `CANCELLED`, `NO_SHOW` |
| `CONFIRMED` | `ARRIVED`, `CANCELLED`, `NO_SHOW` |
| `ARRIVED` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `COMPLETED` |
| `COMPLETED`, `CANCELLED`, `NO_SHOW` | Nenhum |

`ARRIVED` pode seguir diretamente de `SCHEDULED` quando o paciente comparece sem confirmação prévia. `NO_SHOW` só é possível antes do check-in. O cancelamento exige uma justificativa não vazia; espaços nas extremidades são removidos antes de salvar. A edição dos dados do agendamento não é permitida após um estado final.

## Histórico e leitura

Cada transição persiste, na mesma transação do estado atual, o estado anterior e o novo estado, o usuário e o membro da clínica que agiram, a data/hora e uma justificativa quando há cancelamento. A atualização usa comparação com o estado anterior: uma segunda ação concorrente com estado desatualizado recebe HTTP 409 e não grava histórico. A confirmação de proposta de cancelamento pelo agente segue a mesma regra.

`GET /api/v1/appointments/{id}/status-transitions` retorna o histórico em ordem cronológica. Requer a permissão de visualização de agendamentos, a clínica do agendamento e acesso ao paciente. Exemplo de item:

```json
{
  "id": "uuid-da-transicao",
  "appointmentId": "uuid-do-agendamento",
  "actorUserId": "uuid-do-usuario",
  "actorMemberId": "uuid-do-membro",
  "fromStatus": "SCHEDULED",
  "toStatus": "CANCELLED",
  "reason": "Solicitação do paciente",
  "occurredAt": "2027-03-01T09:00:00.000Z"
}
```

O histórico começa nas transições feitas após a migração `20261124160000_appointment_status_transition`. Estados anteriores não são reconstruídos, pois não há dados confiáveis de ator e horário para cada mudança antiga. A criação do agendamento permanece identificada pelos campos `createdAt` e `createdByMemberId` do próprio agendamento.
