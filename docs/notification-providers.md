# Providers de notificação (lembretes) — L2-01 / L2-02

**Estado:** decisão de engenharia, **pendente de validação** de Produto e Jurídico/DPO.
**Referência:** cards L2-01 (seleção) e L2-02 (adapters reais).

## 1. Decisão

| Canal    | Provider                              | Adapter                     | Ativação                                                        |
| -------- | ------------------------------------- | --------------------------- | --------------------------------------------------------------- |
| WhatsApp | [Evolution API](https://doc.evolution-api.com) (auto-hospedada) | `EvolutionWhatsAppProvider` | `EVOLUTION_SERVER_URL` + `EVOLUTION_AUTHENTICATION_API_KEY`     |
| E-mail   | Amazon SES v2                         | `SesEmailProvider`          | `MAIL_FROM_ADDRESS`                                             |
| SMS      | nenhum (fica stub)                    | `StubSmsProvider`           | —                                                               |

Sem as variáveis, cada canal cai no stub correspondente, que só registra em log (com destino
mascarado). Desenvolvimento local e testes nunca enviam mensagens reais. A seleção fica em
`infrastructure/notification/notification-providers.factory.ts`.

**Por que estes:** são os providers que o plexter já usa em produção (`infrastructure/mail/ses-mailer.ts`
e `infrastructure/whatsapp/evolution-api.client.ts`), o que reaproveita código, operação e
conhecimento. O agenda já usa AWS (S3), então o SES não adiciona um fornecedor novo.

## 2. Como os adapters funcionam

- O domínio só conhece o port `NotificationProvider` (`domain/notification/ports`). Nenhum tipo do
  fornecedor sai de `infrastructure/notification`.
- Os adapters **nunca lançam exceção** por falha de entrega: devolvem `{success: false, error}`.
  O `DispatchRemindersService` também captura exceções inesperadas do provider e de cada lembrete,
  então um envio com problema vira `FAILED` com `errorMessage` e não interrompe o lote nem a agenda.
- **WhatsApp:** `POST {EVOLUTION_SERVER_URL}/message/sendText/{instância}` com header `apikey`.
  A instância é `EVOLUTION_INSTANCE_NAME`, se definida (um número para todas as clínicas), ou o id
  da clínica (convenção do plexter: uma instância por tenant, pareada no manager da Evolution com o
  id da clínica como nome). Números com 10 ou 11 dígitos recebem o DDI `55`. Timeout padrão de
  10 s (`EVOLUTION_TIMEOUT_MS`). O id da mensagem (`key.id`) volta como `providerId`.
- **E-mail:** `SendEmail` do SES v2 com corpo em texto e em HTML escapado, assunto
  "Lembrete de consulta", `MAIL_REPLY_TO` opcional. Região padrão `sa-east-1`. Sem
  `MAIL_SES_ACCESS_KEY_ID`/`MAIL_SES_SECRET_ACCESS_KEY` usa a cadeia padrão de credenciais da AWS.
  O `MessageId` volta como `providerId`.

## 3. Critérios do L2-01

| Critério          | Situação                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custo             | SES: cobrança por mensagem enviada, sem mínimo. Evolution: software livre; custo é a hospedagem. **Valores vigentes a confirmar por Produto** nas páginas de preço.                 |
| SLA               | SES tem SLA publicado pela AWS. Evolution auto-hospedada não tem SLA: depende da nossa infra e da estabilidade da sessão do WhatsApp.                                               |
| Sandbox           | SES começa em sandbox (remetente e destinatários verificados); produção exige pedido de liberação. Evolution: subir local (`docker`) e parear um número de teste.                   |
| Opt-in / opt-out  | **Não implementado.** É o card L3-04. Até lá, o lembrete é enviado ao contato cadastrado do paciente.                                                                              |
| Fallback          | **Não há troca automática de canal.** A falha fica registrada (`FAILED`, `attempts`, `errorMessage`). Reenvio e fallback entram no L2-04/L2-05.                                     |
| Contrato de dados | AWS tem DPA padrão. Ver riscos do WhatsApp abaixo.                                                                                                                                |

## 4. Riscos e pontos em aberto

1. **WhatsApp não oficial (Baileys).** O plexter cria as instâncias com a integração
   `WHATSAPP-BAILEYS`, que conecta como o WhatsApp Web, sem contrato com a Meta. Para dados de saúde
   isso significa: sem DPA com a Meta, risco de bloqueio do número e sem garantia de entrega.
   A Evolution também suporta a API oficial (`WHATSAPP-BUSINESS`, Cloud API), mas nela mensagens
   iniciadas pela empresa fora da janela de 24 h exigem **template aprovado**; o adapter atual envia
   texto livre (`sendText`) e precisaria de um envio por template. **Decisão de Produto/Jurídico.**
2. **Gestão de instâncias por clínica.** Este PR só envia. Criar a instância, mostrar o QR code e
   acompanhar o status de conexão (o plexter tem `WhatsAppClientService` e telas para isso) fica
   para um card próprio, junto do L2-03. Até lá, use `EVOLUTION_INSTANCE_NAME` ou crie a instância
   no manager da Evolution com o id da clínica.
3. **Fuso horário fixo.** A mensagem usa `America/Sao_Paulo`; clínicas em outro fuso recebem o
   horário errado. Resolver junto da configuração por clínica (L2-03).
4. **Números internacionais.** O `Phone` guarda só dígitos, então um número estrangeiro com 10 ou
   11 dígitos recebe o DDI 55 por engano. Aceitável enquanto o público é brasileiro.
5. **Webhooks de entrega/leitura/resposta** (SES via SNS, Evolution via webhook) não estão
   ligados: é o L2-04.

## 5. Como testar no sandbox

```bash
# E-mail: com remetente e destinatário verificados no SES (sandbox)
MAIL_FROM_ADDRESS=lembretes@suaclinica.com.br MAIL_SES_REGION=sa-east-1 pnpm -F @agenda-app/server start:dev

# WhatsApp: Evolution local com uma instância pareada
EVOLUTION_SERVER_URL=http://localhost:8080 EVOLUTION_AUTHENTICATION_API_KEY=... \
EVOLUTION_INSTANCE_NAME=agenda-teste pnpm -F @agenda-app/server start:dev
```

O `ReminderDispatchTask` roda a cada 5 minutos e envia os lembretes vencidos. O resultado aparece
no status do lembrete (`SENT`/`FAILED`) e no log (`EvolutionWhatsAppProvider`/`SesEmailProvider`).
