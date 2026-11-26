# Observabilidade

O server é instrumentado com [OpenTelemetry](https://opentelemetry.io/) e exporta traces,
métricas e logs via OTLP para o Grafana. A configuração segue a do plexter
(`apps/server/src/infrastructure/telemetry`, `infra/grafana`), para os dois projetos usarem o
mesmo coletor, as mesmas variáveis e o mesmo fluxo de dashboards.

## Rodando local

```bash
cd apps/server
docker compose up -d lgtm   # Grafana + Tempo + Loki + Prometheus + OTel Collector num container
```

No `apps/server/.env`:

```bash
OTEL_ENABLED=true
```

Suba o server (`pnpm start:dev`) e abra o Grafana em <http://localhost:3001> (`admin`/`admin`).
Em **Explore**:

| Sinal    | Datasource | Dica                                                                                  |
| -------- | ---------- | ------------------------------------------------------------------------------------- |
| Traces   | Tempo      | `resource.service.name = agenda-server`; jobs aparecem como `schedule.*`               |
| Logs     | Loki       | `{service_name="agenda-server"}`; cada registro traz `trace_id`                        |
| Métricas | Prometheus | `notification_*`, HTTP `http_server_duration_milliseconds_*`, runtime `nodejs_*`/`v8js_*` |

Para ter os dashboards e alertas no Grafana local, aplique o Terraform de `infra/grafana`
apontando para ele (ver [README](../infra/grafana/README.md)).

## Variáveis de ambiente

| Variável                      | Padrão                  | Uso                                              |
| ----------------------------- | ----------------------- | ------------------------------------------------ |
| `OTEL_ENABLED`                | `false`                 | Liga o SDK inteiro. Desligado, nada é exportado  |
| `OTEL_SERVICE_NAME`           | `agenda-server`         | `service.name` (vira o label `job` no Prometheus) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | URL base OTLP HTTP do coletor                    |
| `OTEL_EXPORTER_OTLP_HEADERS`  | —                       | Ex.: `Authorization=Basic <base64>` no Grafana Cloud |
| `OTEL_TRACES_SAMPLER_ARG`     | `1`                     | Fração de traces amostrados (0–1, parent-based)  |

O SDK sobe em `register.ts`, importado na **primeira** linha do `main.ts` para instrumentar
`http`, `express` etc. antes de qualquer outro módulo carregá-los. No desligamento
(`enableShutdownHooks`), o `TelemetryShutdownService` envia o que ficou pendente.

## O que é instrumentado

- **HTTP de entrada:** `http` + `express` + `nestjs-core` — um trace por requisição com rota e status.
- **Banco:** `@prisma/instrumentation` (spans das operações do Prisma).
- **HTTP de saída:** `undici` (`fetch` → Evolution API) e `http` (AWS SDK → SES, S3).
- **WebSocket:** `socket.io`.
- **Logs:** a instrumentação do winston injeta `trace_id`/`span_id` e envia os registros ao Loki.
  O `Logger` do Nest (`new Logger(Contexto)`, usado na maior parte do server) passa a sair pelo
  winston (`NestWinstonLogger`), então também chega ao Loki.
- **Runtime:** event loop, GC e heap (`runtime-node`).
- **Jobs agendados:** o envio de lembretes roda dentro do span `schedule.reminder-dispatch`
  (abstração `Tracer`), agrupando as queries e chamadas aos providers.

Abstrações em `@application/@shared/telemetry` (`Metrics`, `Tracer`, `ErrorTracker`), injetáveis
em qualquer módulo (`TelemetryModule` é global). Sem `OTEL_ENABLED`, viram no-op.

### Métricas de notificação

| Métrica (OTel → Prometheus)                                                       | Labels               | O que mede                                                    |
| --------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------- |
| `notification.reminder.attempt` → `notification_reminder_attempt_total`           | `channel`, `outcome` | Tentativas: `sent`, `retry` (falhou e reagendou), `failed`    |
| `notification.provider.send.duration_ms` → `notification_provider_send_duration_ms_*` | `channel`, `outcome` | Latência do provider por envio                            |
| `notification.reminder.status` → `notification_reminder_status_total`             | `channel`, `type`    | Eventos de webhook aplicados (DELIVERED, READ, REPLIED, …)    |
| `notification.webhook.received` → `notification_webhook_received_total`           | `source`, `result`   | Webhooks: `applied`, `duplicate`, `unmatched`, `unauthorized`… |
| `notification.reminders.overdue` → `notification_reminders_overdue`                | —                    | Lembretes pendentes vencidos há mais de 15 min (fila parada)  |

Os nomes ficam em `NotificationMetric`; renomear um quebra dashboards e alertas.

## Orçamento de séries

O plano gratuito do Grafana Cloud limita as séries ativas e cada bucket de histograma conta como
uma série. `metric-views.ts` reduz os buckets e os labels dos histogramas HTTP e do envio. Labels
de métrica precisam ter baixa cardinalidade: **nunca** id de clínica, paciente, usuário ou
mensagem (também por LGPD). Análise por clínica ou por lembrete é feita nos traces (Tempo) e na
linha do tempo do lembrete.

## Grafana: dashboards e alertas

Em [`infra/grafana`](../infra/grafana) (Terraform, como no plexter):

- **Agenda · Notificações** — tentativas, taxa de falha, status reportados pelos providers,
  latência, webhooks por resultado, fila atrasada, taxa de entrega e logs do fluxo.
- **Agenda · API**, **Agenda · Runtime Node**, **Agenda · Logs e Erros**.
- Alertas: 5xx e latência da API, fila de lembretes parada, falhas de envio acima de 20%,
  webhooks recusados em rajada, telemetria ausente, event loop lento e pico de logs de erro.

Diferença em relação ao plexter: os dashboards escolhem o datasource pelas variáveis
`${prometheus}`/`${loki}` em vez de tokens `__PROM_UID__`, então o mesmo JSON funciona no Grafana
Cloud e no local sem substituição.

## Versões

Os pacotes `@opentelemetry/*` são acoplados entre si e ficam fixados na mesma release do plexter.
O `@prisma/instrumentation` 6 aceita qualquer `@opentelemetry/instrumentation` 0.x e resolveria a
mais nova, que exige `@opentelemetry/api` 1.10; um override em `pnpm-workspace.yaml` mantém a
0.220.0. Ao atualizar, suba todos juntos e confira os nomes das métricas em **Explore → Metrics**.
