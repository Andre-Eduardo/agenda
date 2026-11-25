# Receita por atendimento

A seção **Pagamento** da agenda e a aba **Receita** do financeiro mostram
o mesmo valor previsto, recebido, pendente e a forma de pagamento. O
relatório agrupa os atendimentos pela data agendada. Um pagamento registrado
antes ou depois da consulta aparece no período da consulta.

| Situação | Previsto | Recebido | Pendente |
| --- | --- | --- | --- |
| Procedimento sem pagamento registrado | Preço salvo no agendamento | Zero | Preço salvo |
| Pagamento direto pendente | Valor registrado | Zero | Valor registrado |
| Pagamento direto liquidado | Valor registrado | Valor registrado | Zero |
| Pacote, assinatura ou cortesia | Zero | Zero | Zero |
| Guia de convênio em aberto | Valor enviado | Zero | Valor enviado |
| Guia de convênio paga ou parcialmente paga | Valor aprovado | Valor aprovado | Zero |
| Guia de convênio em recurso | Valor enviado | Parcela aprovada | Diferença em recurso |
| Guia negada ou cancelada, pagamento isento ou reembolsado | Zero | Zero | Zero |

Um cancelamento ou uma falta sem pagamento registrado sai da previsão.
Um pagamento já registrado continua no histórico. Atendimentos sem preço
e sem pagamento ficam fora do relatório até que haja um valor registrado.

O registro de pagamento usa por padrão o preço salvo do procedimento.
A equipe pode informar um valor diferente no registro. A cobrança avulsa
sem procedimento exige um valor explícito. O uso de um pacote ou assinatura
identifica a forma de cobertura e mantém o consumo de crédito ou cota. A
venda ou mensalidade é uma operação separada do atendimento coberto.

No convênio, o registro cria uma guia vinculada ao pagamento e começa
pendente por padrão. O financeiro usa os valores e o estado da guia quando
ela existe. Pagamentos antigos sem guia usam o estado e o valor registrados.

## API e permissões

- `GET /api/v1/appointments/{id}` e `GET /api/v1/appointments` incluem
  `revenue` para membros com `appointment-payment:view` e acesso ao paciente.
- `POST /api/v1/appointments/{id}/payment` exige
  `appointment-payment:register`. `amountBrl` é opcional quando o preço
  está disponível no agendamento ou a forma é pacote, assinatura ou cortesia.
- `GET /api/v1/clinics/{clinicId}/financial/report` e
  `GET /api/v1/clinics/{clinicId}/financial/summary` exigem
  `financial-report:view`. O filtro de status usa o estado financeiro
  mostrado na agenda. O resumo agrega todas as linhas filtradas antes da
  paginação.
