# Providers de notificação (lembretes) — L2-01 a L2-04

**Estado:** decisão de engenharia, **pendente de validação** de Produto e Jurídico/DPO.
**Referência:** cards L2-01 (seleção), L2-02 (adapters reais), L2-03 (configuração por clínica) e
L2-04 (entrega, falha e resposta — seção 7).

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
  Cada clínica tem uma instância com o id da clínica como nome (convenção do plexter), criada e
  pareada pela tela **Configurações > WhatsApp** (seção 2.1). Números com 10 ou 11 dígitos recebem
  o DDI `55`. Timeout padrão de 10 s (`EVOLUTION_TIMEOUT_MS`). O id da mensagem (`key.id`) volta
  como `providerId`. Se a clínica não conectou um número, o envio falha e o lembrete fica `FAILED`.
- **E-mail:** `SendEmail` do SES v2 com corpo em texto e em HTML escapado, assunto
  "Lembrete de consulta", `MAIL_REPLY_TO` opcional. Região padrão `sa-east-1`. Sem
  `MAIL_SES_ACCESS_KEY_ID`/`MAIL_SES_SECRET_ACCESS_KEY` usa a cadeia padrão de credenciais da AWS.
  O `MessageId` volta como `providerId`.

### 2.1 Conexão do WhatsApp por clínica

Mesmas regras do plexter (`whatsapp-config`):

| Endpoint                         | Permissão          | O que faz                                                          |
| -------------------------------- | ------------------ | ------------------------------------------------------------------ |
| `GET /whatsapp-config`           | `whatsapp:view`    | Instância da clínica (lista vazia se não existe ou Evolution está desligada) |
| `POST /whatsapp-config`          | `whatsapp:create`  | Cria a instância Baileys com o número informado e devolve o QR code |
| `GET /whatsapp-config/qrcode`    | `whatsapp:connect` | Gera um QR code novo para reconectar                                |
| `POST /whatsapp-config/logout`   | `whatsapp:logout`  | Desconecta o celular, mantendo a instância                         |
| `DELETE /whatsapp-config`        | `whatsapp:delete`  | Remove a instância                                                  |

A clínica é sempre a do usuário autenticado (`actor.clinicId`); não há parâmetro de clínica na
URL. As permissões ficam com `OWNER` e `ADMIN` (`docs/rbac-matrix.md`). Na tela, a clínica cadastra
um número, escaneia o QR code e acompanha o status (conectado, conectando, desconectado). Com o
número conectado aparece "Desconectar"; desconectado, aparecem "Reconectar" e "Remover".

## 3. Critérios do L2-01

| Critério          | Situação                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custo             | SES: cobrança por mensagem enviada, sem mínimo. Evolution: software livre; custo é a hospedagem. **Valores vigentes a confirmar por Produto** nas páginas de preço.                 |
| SLA               | SES tem SLA publicado pela AWS. Evolution auto-hospedada não tem SLA: depende da nossa infra e da estabilidade da sessão do WhatsApp.                                               |
| Sandbox           | SES começa em sandbox (remetente e destinatários verificados); produção exige pedido de liberação. Evolution: subir local (`docker`) e parear um número de teste.                   |
| Opt-in / opt-out  | **Não implementado.** É o card L3-04. Até lá, o lembrete é enviado ao contato cadastrado do paciente.                                                                              |
| Fallback          | **Não há troca automática de canal.** Uma falha de envio é repetida até 3 tentativas no mesmo canal (L2-04, seção 7.2); reenvio manual é o L2-05.                                 |
| Contrato de dados | AWS tem DPA padrão. Ver riscos do WhatsApp abaixo.                                                                                                                                |

## 4. Riscos e pontos em aberto

1. **WhatsApp não oficial (Baileys) — decisão: manter.** As instâncias usam a integração
   `WHATSAPP-BAILEYS`, como no plexter. A Evolution roda em servidor próprio, então mensagens e
   sessões não passam por terceiros além do próprio WhatsApp. Riscos aceitos: sem contrato com a
   Meta, possibilidade de bloqueio do número por uso fora dos termos e sem garantia de entrega.
   Se um dia for preciso a API oficial (`WHATSAPP-BUSINESS`), os lembretes precisarão de templates
   aprovados pela Meta.
2. **Webhook de status.** Ligado no L2-04 (seção 7): a Evolution avisa entrega, leitura e respostas.
3. **Fuso horário fixo.** A mensagem usa `America/Sao_Paulo`; clínicas em outro fuso recebem o
   horário errado. A clínica ainda não tem fuso cadastrado, então o L2-03 manteve o fixo; resolver
   quando o cadastro da clínica ganhar fuso.
4. **Números internacionais.** O `Phone` guarda só dígitos, então um número estrangeiro com 10 ou
   11 dígitos recebe o DDI 55 por engano. Aceitável enquanto o público é brasileiro.
5. **Webhooks de entrega/leitura/resposta**: ligados no L2-04 (seção 7).

## 5. Como testar no sandbox

```bash
# E-mail: com remetente e destinatário verificados no SES (sandbox)
MAIL_FROM_ADDRESS=lembretes@suaclinica.com.br MAIL_SES_REGION=sa-east-1 pnpm -F @agenda-app/server start:dev

# WhatsApp: Evolution local (docker) e depois Configurações > WhatsApp para parear um número de teste
EVOLUTION_SERVER_URL=http://localhost:8080 EVOLUTION_AUTHENTICATION_API_KEY=... pnpm -F @agenda-app/server start:dev
```

O `ReminderDispatchTask` roda a cada 5 minutos e envia os lembretes vencidos. O resultado aparece
no status do lembrete (`SENT`/`FAILED`) e no log (`EvolutionWhatsAppProvider`/`SesEmailProvider`).

## 6. Configuração por clínica (L2-03)

Em **Configurações > Lembretes** (permissão `clinic-reminder-config:view`/`manage`, OWNER e ADMIN)
o admin define:

| Campo        | Regras                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------- |
| Ativação     | Desligado por padrão enquanto a clínica nunca salvou (`configured: false` no `GET`).        |
| Canais       | WhatsApp e/ou e-mail. SMS é recusado até existir provider.                                  |
| Antecedência | 1 a 3 valores, horas inteiras de 1 a 168 (7 dias); gravados sem repetição, do maior ao menor. |
| Texto        | Até 1000 caracteres, só com `{{paciente}}`, `{{data}}`, `{{hora}}`, `{{profissional}}` e `{{clinica}}`. Vazio ou `null` volta ao texto padrão. |

**Quando a mudança vale.** Ativação, canais e antecedência são lidos quando o agendamento é criado
(`ScheduleRemindersService`), então valem para agendamentos criados depois de salvar; lembretes já
gerados continuam como estão. O texto é lido no envio (`ReminderMessageRenderer`), então vale para
os próximos envios. O assunto do e-mail é fixo: "Lembrete de consulta".

**Pré-visualização.** `POST /clinics/:clinicId/reminder-config/preview` preenche um texto (salvo ou
não) com dados de exemplo: paciente fictícia, amanhã às 14:30, o próprio usuário como profissional e
o nome real da clínica. Nada é enviado nem gravado.

**Isolamento.** `GET`, `PUT` e `preview` recusam (`403`) um `clinicId` diferente da clínica do
usuário logado.

## 7. Entrega, falha e resposta (L2-04)

Cada lembrete ganha uma **linha do tempo** (`AppointmentReminderEvent`, só cresce) e o status
passa a avançar depois do envio: `PENDING → SENT → DELIVERED → READ → REPLIED`, ou `FAILED`.

### 7.1 Linha do tempo

| Evento            | Quem registra            | Quando                                                              | `detail`                      |
| ----------------- | ------------------------ | ------------------------------------------------------------------- | ----------------------------- |
| `SENT`            | sistema                  | o provider aceitou a tentativa                                      | —                             |
| `SEND_FAILED`     | sistema                  | a tentativa falhou antes de o provider aceitar                      | erro                          |
| `RETRY_SCHEDULED` | sistema                  | a falha vai ser repetida                                            | horário da próxima tentativa  |
| `DELIVERED`       | Evolution / SES          | ack de entrega (`DELIVERY_ACK`) / evento `Delivery`                 | —                             |
| `READ`            | Evolution / SES          | ack de leitura (`READ`, `PLAYED`) / evento `Open`                   | —                             |
| `DELIVERY_FAILED` | Evolution / SES          | ack `ERROR` / `Bounce`, `Reject`, `Rendering Failure`               | motivo                        |
| `COMPLAINED`      | SES                      | o paciente marcou como spam (opt-out fica para o L3-04)             | tipo da reclamação            |
| `REPLIED`         | Evolution                | o paciente respondeu no WhatsApp                                    | texto (até 500 caracteres)    |

`GET /clinics/:clinicId/appointments/:appointmentId/reminders` (permissão
`appointment-reminder:view`) devolve os lembretes do agendamento com `events` em ordem
cronológica, `deliveredAt`, `readAt` e `repliedAt`. A tela que mostra isso é o L2-05.

O status só anda para frente: um ack de entrega que chega depois da leitura não volta o status;
uma falha de entrega depois da leitura é registrada na linha do tempo mas não muda o status.

### 7.2 Reenvio automático

Uma tentativa que falha (provider fora, timeout, WhatsApp desconectado) volta para a fila: nova
tentativa em **15 minutos** e depois em **60 minutos**, no máximo **3 tentativas**
(`reminder-retry-policy.ts`). Não há reenvio quando o próximo horário passaria do início da
consulta, nem quando falta dado do paciente (sem telefone ou e-mail), que não se resolve sozinho.
`attempts` conta todas as tentativas, inclusive a que deu certo.

### 7.3 Webhook da Evolution (WhatsApp)

- **Rota:** `POST /api/v1/webhooks/evolution/:clinicId` (pública, fora do OpenAPI).
- **Autenticação:** header `x-agenda-whatsapp-token` = HMAC-SHA256 do id da clínica com
  `EVOLUTION_WEBHOOK_SECRET` (mesmo esquema do plexter). Token errado ou segredo ausente → `401`.
- **Registro:** ao criar a instância e a cada novo QR code (reconectar), o server chama
  `POST /webhook/set/{instância}` com os eventos `MESSAGES_UPDATE` e `MESSAGES_UPSERT` e o token
  no header. Instâncias criadas antes do L2-04 passam a ter o webhook na próxima reconexão. Se
  trocar o segredo, reconecte o WhatsApp de cada clínica. URL base: `EVOLUTION_WEBHOOK_BASE_URL`
  ou `PUBLIC_BASE_URL`.
- **Status:** casa pelo id da mensagem (`key.id` devolvido no envio, `providerMessageId`).
- **Resposta:** se o paciente responder citando o lembrete, casa pela citação; senão, vai para o
  último lembrete enviado para aquele número na clínica nos últimos 7 dias (com e sem o nono
  dígito). Mensagens que não casam com lembrete são ignoradas.

### 7.4 Webhook do SES (e-mail)

- **Configuração na AWS:** um configuration set (`MAIL_SES_CONFIGURATION_SET`, enviado em cada
  `SendEmail`) com destino de eventos SNS para `Delivery`, `Bounce`, `Complaint`, `Reject`,
  `Open` e `Rendering Failure`, e uma assinatura HTTPS do tópico para
  `https://<api>/api/v1/webhooks/ses`. Sem o configuration set, as notificações de identidade do
  SES (Delivery/Bounce/Complaint) no mesmo tópico também funcionam.
- **Autenticação:** assinatura SNS (v1 e v2) verificada com o certificado baixado só de
  `https://sns.<região>.amazonaws.com/*.pem`, e o `TopicArn` precisa ser
  `MAIL_SES_EVENTS_TOPIC_ARN`. Sem o ARN o webhook recusa tudo (`401`).
- **Assinatura do tópico:** a `SubscriptionConfirmation` é confirmada automaticamente.
- **Casamento:** pelo `mail.messageId` (o `MessageId` devolvido no envio).

### 7.5 Idempotência

Os providers repetem webhooks em timeout. Cada evento externo tem uma chave única por origem
(`source` + `externalId`, índice único no banco): `<idDaMensagem>:<status>` para acks da
Evolution, o id da mensagem recebida para respostas e o `MessageId` do SNS para o SES. A
gravação do evento e a mudança de status acontecem na mesma transação, e um evento repetido não
muda nada.

### 7.6 Métricas e alertas

O fluxo é instrumentado com OpenTelemetry (`notification.*`); dashboards e alertas no Grafana
estão em [`observability.md`](observability.md).

## 8. Preferências de comunicação e opt-out (L3-04)

O paciente pode recusar cada canal (WhatsApp, SMS, e-mail) separadamente. A recusa vale para
lembretes novos e também para os que já estavam agendados.

- **Evidência:** cada alteração é uma linha append-only em `patient_communication_preference_change`
  (canal, recusado ou não, origem, membro que registrou, motivo/texto da resposta, data). A preferência
  atual de um canal é a alteração mais recente; sem registro, o canal é permitido.
- **Origens:** `STAFF` (a clínica registra na ficha do paciente, seção "Comunicação e LGPD"),
  `WHATSAPP_REPLY` (o paciente responde a um lembrete só com `SAIR`, `PARAR`, `PARE`, `STOP`,
  `DESCADASTRAR` ou `NÃO QUERO RECEBER`) e `EMAIL_COMPLAINT` (complaint do SES, e-mail marcado como spam).
  `CANCELAR` não conta, porque o paciente usa para cancelar a consulta.
- **Agendamento:** `ScheduleRemindersService` não cria lembretes para canais recusados.
- **Envio:** `DispatchRemindersService` consulta a preferência no momento do envio. Se o canal foi
  recusado, o lembrete vira `CANCELLED`, a linha do tempo ganha o evento `OPTED_OUT` e a métrica
  `notification.reminder.attempt` conta `outcome=opted_out`.
- **Aviso no WhatsApp:** todo lembrete por WhatsApp termina com
  "Para não receber mais lembretes por WhatsApp, responda SAIR.".
- **API:** `GET` e `PUT /patients/:patientId/communication-preferences` (permissões `patient:view` e
  `patient:update`). Cada `PUT` grava uma nova linha, mesmo que o valor não mude, porque cada pedido do
  paciente é evidência.
- **Idempotência:** opt-outs vindos de webhook usam `(source, external_id)` único, como os eventos de lembrete.

Política de privacidade e termos de uso (rascunho para o DPO) ficam em `/legal/privacy` e `/legal/terms`
no frontend, sem login; o texto está em `apps/web/src/views/modules/legal/content.ts`.
