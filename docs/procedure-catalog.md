# Catálogo de procedimentos e serviços

Em **Configurações → Procedimentos e serviços**, proprietários e administradores
cadastram, editam, desativam e reativam itens do catálogo da clínica. Cada item
tem nome, duração de 1 a 720 minutos, cor da agenda, valor em reais e modalidade
presencial ou remota.

Na agenda, a equipe pode selecionar um item ativo ao criar ou editar um
agendamento. Um novo agendamento do tipo **Procedimento** exige um item do
catálogo. Nos demais tipos, o vínculo é opcional. Ao selecionar um item,
o sistema preenche a duração, a cor, o valor e a modalidade. O valor exibido é
o valor previsto para aquele agendamento.

Com `procedure:override` e acesso à agenda, o membro pode ajustar esses
quatro campos para um agendamento. Com `procedure:manage`, pode alterar o
catálogo da clínica. A [matriz RBAC](./rbac-matrix.md) descreve a concessão
dessas permissões.

O agendamento guarda uma cópia do nome, da cor, do valor e da modalidade
junto do horário e da duração. Alterar ou desativar o item mantém a cópia
existente. Trocar o item no agendamento carrega os dados do novo item ativo.
Agendamentos anteriores à migração continuam acessíveis e podem receber um
item ativo em uma edição.

## Contrato da API

- `GET /api/v1/procedures` lista os itens ativos da clínica do membro
  autenticado com `appointment:view`.
- `GET /api/v1/procedures/catalog` lista também os inativos. `POST /api/v1/procedures`
  cadastra um item ativo. `PUT /api/v1/procedures/{id}` atualiza o item, incluindo
  seu estado `active`. Os três endpoints exigem `procedure:manage`.
- Em `POST /api/v1/appointments` e `PUT /api/v1/appointments/{id}`, informe
  `procedureId` para selecionar um item. Por exemplo, enviar `startAt` e
  `procedureId` sem `endAt` calcula o término pela duração do catálogo.
  `endAt` pode ajustar a duração, e `procedureOverrides` aceita `color`,
  `priceInCents` e `modality`. O valor monetário usa centavos de real.
- Os detalhes do procedimento escolhido ficam em `appointment.procedure`.
  O horário final segue as verificações de disponibilidade e conflito da agenda.
