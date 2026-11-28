# Livro-caixa da clínica (fase 1 do financeiro)

O livro-caixa registra o dinheiro que entra e sai das contas da clínica. Ele
segue o desenho do plano do módulo financeiro: a obrigação fica separada do
dinheiro que se move para cumpri-la.

## Modelo

| Tabela | Papel |
| --- | --- |
| `financial_account` | Para onde o dinheiro vai: caixa, banco, maquininha, carteira digital. Cada clínica tem uma conta padrão por tipo. |
| `financial_entry` | A obrigação. Na fase 1 existe uma por pagamento de consulta (`origin_type = APPOINTMENT`). |
| `account_movement` | Movimento append-only: `IN` ou `OUT`, sempre com valor positivo em centavos. |

- **Recebido** = soma das entradas menos soma das saídas do lançamento.
- O lançamento está **quitado** quando o recebido alcança o valor.
- **Estorno** nunca apaga um movimento: cria uma saída `REFUND` com
  `reverses_movement_id` apontando para a entrada estornada, na mesma conta
  e forma. O motivo é obrigatório.
- Valores novos ficam em **centavos inteiros**. O `amount_brl` (Float) do
  `appointment_payment` é mantido e espelha o lançamento; a migração dele para
  centavos fica para um PR seguinte.

## Formas de pagamento

Só formas que movem dinheiro passam pelo livro-caixa:

| Forma | Conta padrão |
| --- | --- |
| `CASH` | Caixa (`CASH_DRAWER`) |
| `PIX`, `BANK_TRANSFER` | Conta bancária (`BANK`) |
| `CREDIT_CARD`, `DEBIT_CARD` | Maquininha (`CARD_MACHINE`) |

Convênio, pacote, assinatura e cortesia continuam fora do livro-caixa (guia,
crédito ou cota). Quando o recebimento usa mais de uma forma, o pagamento da
consulta passa a mostrar `MIXED` ("Pagamento dividido"). `MIXED` nunca é
aceito como entrada da API: as partes trazem a forma real.

O status do pagamento de uma forma do livro-caixa é derivado do lançamento:
`PAID` quando quitado, `PENDING` caso contrário, `REFUNDED` após o estorno.
Mudar para `PENDING` ou `EXEMPT` com dinheiro recebido é recusado
(`financial_entry.has_receipts`): é preciso estornar antes.

## Contas padrão

As três contas padrão (Caixa, Conta bancária, Maquininha) são criadas pela
migration para cada clínica existente e, de forma preguiçosa, na primeira
listagem ou no primeiro recebimento de uma clínica nova.

O índice único parcial `financial_account_default_per_type_key`
(`clinic_id, type` com `is_default AND deleted_at IS NULL`) não é
representável no `schema.prisma`. Um `prisma migrate dev` futuro pode propor
removê-lo: retire essa linha da migration gerada.

## Backfill

A migration `20261128010000_financial_ledger` cria um lançamento para cada
pagamento direto existente (valor arredondado para centavos, competência na
data da consulta), uma entrada para pagamentos `PAID` (ou `REFUNDED` com
`paid_at`) na conta padrão da forma e uma saída `REFUND` com o motivo
"Estorno anterior ao livro-caixa" para os reembolsados.

## API

| Endpoint | Permissão |
| --- | --- |
| `POST /appointments/{id}/payment` com `parts[]` | `appointment-payment:register` |
| `GET /appointments/{id}/payment/ledger` | `appointment-payment:view` |
| `POST /appointments/{id}/payment/receipts` | `appointment-payment:register` |
| `POST /appointments/{id}/payment/refund` | `appointment-payment:refund` |
| `GET /financial-accounts`, `GET /financial-accounts/{id}/statement` | `financial-account:view` |
| `POST /financial-accounts`, `PATCH /financial-accounts/{id}` | `financial-account:manage` |

A conta padrão não pode ser desativada. Uma conta inativa não recebe.

## Telas

- **Agenda → Pagamento**: "Dividir em mais de uma forma" no registro, lista de
  movimentos, "Receber restante" e "Estornar" (com motivo).
- **Financeiro → Contas**: saldos, extrato por período, criar, renomear e
  desativar contas.

## Próximas fases

Abertura e fechamento de caixa (Pix e cartões também exigem caixa aberto),
recibo em PDF, migração de `amount_brl` para centavos, repasse aos
profissionais, despesas e recebíveis de cartão. Veja o plano do módulo
financeiro.
