# Alertas da aplicação. Mesma estrutura do plexter (infra/grafana/alerts.tf).
#
# Nomes de métrica seguem a tradução OTLP -> Prometheus: pontos viram underscore, counters
# ganham _total e o service.name vira o label job (agenda-server). Confirme no Explore se algum
# nome divergir após upgrade das instrumentações OTel.
locals {
  job = "job=~\"agenda-.+\""

  prometheus_alerts = [
    {
      name      = "API: taxa de 5xx alta"
      summary   = "Mais de 2% das requisições da API retornaram 5xx nos últimos 5 minutos."
      severity  = "critical"
      expr      = "sum(rate(http_server_duration_milliseconds_count{${local.job}, http_status_code=~\"5..\"}[5m])) / sum(rate(http_server_duration_milliseconds_count{${local.job}}[5m]))"
      threshold = 0.02
      for       = "5m"
    },
    {
      name      = "API: latência p95 alta"
      summary   = "Latência p95 da API acima de 1s por 10 minutos."
      severity  = "warning"
      expr      = "histogram_quantile(0.95, sum by (le) (rate(http_server_duration_milliseconds_bucket{${local.job}, http_route!=\"\"}[10m])))"
      threshold = 1000
      for       = "10m"
    },
    {
      name      = "Lembretes: fila parada"
      summary   = "Há lembrete pendente com horário vencido há mais de 15 minutos — o job de envio (a cada 5 min) não está rodando."
      severity  = "critical"
      expr      = "max(notification_reminders_overdue)"
      threshold = 0
      for       = "10m"
    },
    {
      name      = "Lembretes: falhas de envio"
      summary   = "Mais de 20% das tentativas de envio de {{ $labels.channel }} falharam nos últimos 30 minutos — provider fora ou WhatsApp desconectado."
      severity  = "warning"
      # O "and" exige volume mínimo (5 tentativas) para um único erro não disparar o alerta.
      expr      = "(sum by (channel) (increase(notification_reminder_attempt_total{outcome!=\"sent\"}[30m])) / sum by (channel) (increase(notification_reminder_attempt_total[30m]))) and sum by (channel) (increase(notification_reminder_attempt_total[30m])) >= 5"
      threshold = 0.2
      for       = "5m"
    },
    {
      name      = "Lembretes: webhooks recusados"
      summary   = "Mais de 10 webhooks de {{ $labels.source }} recusados em 15 minutos — segredo trocado sem reconectar o WhatsApp, tópico SNS errado ou tentativa de forjar status."
      severity  = "warning"
      expr      = "sum by (source) (increase(notification_webhook_received_total{result=~\"unauthorized|invalid\"}[15m]))"
      threshold = 10
      for       = "0s"
    },
    {
      name      = "Servidor: telemetria ausente"
      summary   = "O gauge de lembretes atrasados sumiu — o servidor parou de exportar métricas (processo parado ou OTEL desligado)."
      severity  = "critical"
      expr      = "absent(notification_reminders_overdue)"
      threshold = 0
      for       = "15m"
    },
    {
      name      = "Runtime: event loop lento"
      summary   = "Event loop delay p99 acima de 200ms por 10 minutos — processo saturado."
      severity  = "warning"
      expr      = "max by (job) (nodejs_eventloop_delay_p99_seconds)"
      threshold = 0.2
      for       = "10m"
    },
  ]

  loki_alerts = [
    {
      name      = "Logs: pico de erros"
      summary   = "Mais de 30 logs de nível error em 5 minutos — verificar os últimos erros no dashboard de logs."
      severity  = "warning"
      expr      = "sum(count_over_time({service_name=~\"agenda-.+\"} | detected_level=~\"error|fatal\"[5m]))"
      threshold = 30
      for       = "5m"
    },
  ]

  alert_rules = concat(
    [for a in local.prometheus_alerts : merge(a, { datasource_uid = var.prometheus_datasource_uid, query_type = "" })],
    [for a in local.loki_alerts : merge(a, { datasource_uid = var.loki_datasource_uid, query_type = "instant" })],
  )
}

resource "grafana_rule_group" "agenda" {
  name               = "agenda"
  folder_uid         = grafana_folder.alerts.uid
  interval_seconds   = 60
  disable_provenance = true

  dynamic "rule" {
    for_each = local.alert_rules

    content {
      name      = rule.value.name
      condition = "B"
      for       = rule.value.for

      # OK (e não NoData) porque várias expressões retornam série vazia no caso
      # saudável — ex.: razão de falhas sem nenhuma tentativa, absent() com o servidor vivo.
      no_data_state  = "OK"
      exec_err_state = "Error"

      annotations = { summary = rule.value.summary }
      labels      = { severity = rule.value.severity }

      data {
        ref_id         = "A"
        datasource_uid = rule.value.datasource_uid

        relative_time_range {
          from = 1800
          to   = 0
        }

        model = jsonencode(merge(
          {
            refId   = "A"
            expr    = rule.value.expr
            instant = true
          },
          rule.value.query_type == "" ? {} : { queryType = rule.value.query_type }
        ))
      }

      data {
        ref_id         = "B"
        datasource_uid = "__expr__"

        relative_time_range {
          from = 0
          to   = 0
        }

        model = jsonencode({
          refId      = "B"
          type       = "threshold"
          expression = "A"
          conditions = [
            { evaluator = { type = "gt", params = [rule.value.threshold] } }
          ]
        })
      }
    }
  }
}
