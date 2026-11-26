variable "grafana_url" {
  description = "URL do Grafana: o stack do Grafana Cloud (https://<slug>.grafana.net) ou o local (http://localhost:3001)"
  type        = string
}

variable "alert_email" {
  description = "E-mail que recebe os alertas do Grafana"
  type        = string
}

# Stacks do Grafana Cloud provisionam os datasources com estes UIDs padrão; no Grafana local
# (grafana/otel-lgtm) são "prometheus" e "loki". Os dashboards escolhem o datasource por variável,
# então estes UIDs só valem para os alertas.
variable "prometheus_datasource_uid" {
  description = "UID do datasource Prometheus/Mimir usado pelos alertas"
  type        = string
  default     = "grafanacloud-prom"
}

variable "loki_datasource_uid" {
  description = "UID do datasource Loki usado pelos alertas"
  type        = string
  default     = "grafanacloud-logs"
}
