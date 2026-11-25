# Assinatura e emendas da evolução

Abra uma evolução no prontuário e selecione **Assinar evolução**.
A assinatura registra o membro e a data e bloqueia a edição do conteúdo.
Uma evolução que já foi assinada permanece protegida contra exclusão,
inclusive enquanto está reaberta.

Para corrigir uma evolução assinada, selecione **Reabrir evolução** e
informe o motivo. A reabertura e o registro da emenda são salvos na mesma
transação. Depois de corrigir a descrição, o conteúdo SOAP ou as
observações, assine novamente. A nova assinatura bloqueia a edição e
registra o encerramento da emenda em aberto.

O **Histórico de emendas** mostra as reaberturas em ordem decrescente, com
autor, data, motivo e a data da nova assinatura quando registrada. Emendas
antigas podem ter sido registradas sem a data de encerramento.

## API

- `POST /api/v1/records/{id}/sign` registra a assinatura e bloqueia a evolução.
- `POST /api/v1/records/{id}/reopen` exige `justification` de até 2.000
  caracteres, descontados os espaços nas extremidades.
- `PUT /api/v1/records/{id}` altera os campos informados de uma evolução
  aberta. `DELETE /api/v1/records/{id}` é permitido para evoluções sem assinatura,
  quando o membro tem permissão de exclusão.
- `GET /api/v1/records/{id}/amendments` lista o histórico para membros com
  `record:view` e acesso ao documento. A API mantém o identificador do
  autor, mesmo quando seu nome de exibição muda.

As operações de escrita adquirem um bloqueio por evolução antes de
verificar seu estado. Uma edição concorrente confirma o estado após a
operação anterior terminar. A trilha HTTP de auditoria registra o autor e
o resultado de cada operação autenticada, sem copiar o motivo ou o
conteúdo da evolução para o log.
