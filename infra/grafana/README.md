# Grafana como código

Dashboards e alertas do Agenda Saúde, no mesmo formato do plexter (`infra/grafana`). Funciona
contra o stack do Grafana Cloud ou contra o Grafana local do `docker compose` (serviço `lgtm`).

Gerencia:

- **Dashboards** — JSON em [`dashboards/`](dashboards), na pasta *Agenda*.
- **Alertas** — rule group em [`alerts.tf`](alerts.tf), na pasta *Agenda · Alertas*.
- **Notificação** — contact point de e-mail (`alert_email`) e notification policy raiz.

Os datasources (Prometheus, Loki, Tempo) **não** são gerenciados aqui: o Grafana Cloud provisiona
`grafanacloud-prom`/`grafanacloud-logs` e o `grafana/otel-lgtm` provisiona `prometheus`/`loki`.
Os dashboards escolhem o datasource por variável; os alertas usam os UIDs das variáveis
`prometheus_datasource_uid`/`loki_datasource_uid`.

## Aplicar

```bash
cd infra/grafana
cp grafana.tfvars.example grafana.tfvars   # ajuste url e e-mail

# Grafana Cloud: service account token com papel Admin
#   (Administration → Users and access → Service accounts)
export GRAFANA_AUTH=<service-account-token>
# Grafana local
# export GRAFANA_AUTH=admin:admin

terraform init
terraform apply -var-file=grafana.tfvars
```

O state fica local (`terraform.tfstate`, ignorado pelo git). Para compartilhar entre pessoas,
adicione um backend remoto (ex.: S3, como o plexter).

## Enviar a telemetria para o Grafana Cloud

No server de produção:

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=agenda-server
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-<região>.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64 de instance-id:access-policy-token>
```

O endpoint, o instance id e o token (escopos `metrics:write`, `logs:write`, `traces:write`) estão
em **Connections → OpenTelemetry (OTLP)** no portal do Grafana Cloud.

## Editar dashboards

A UI é o melhor editor; o Git é a fonte da verdade:

1. Ajuste o painel na UI do Grafana.
2. Dashboard → **Export → Export as JSON** (modelo *Classic*, sem "export for sharing externally").
3. Substitua o arquivo em `dashboards/`. Mantenha o datasource como `${prometheus}`/`${loki}` e as
   variáveis em `templating`.
4. `terraform apply -var-file=grafana.tfvars`.

Contact point, policy e alertas usam `disable_provenance = true`: podem ser ajustados na UI, mas o
próximo `apply` sobrescreve o que divergir do código.

## Nomes de métrica

Tradução OTLP → Prometheus: pontos viram underscore, counters ganham `_total` e o
`service.name` vira o label `job` (`agenda-server`). Ex.: `notification.reminder.attempt` →
`notification_reminder_attempt_total`. Lista completa em
[`docs/observability.md`](../../docs/observability.md).
