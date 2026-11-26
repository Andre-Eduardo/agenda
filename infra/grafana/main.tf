resource "grafana_folder" "dashboards" {
  title = "Agenda"
  uid   = "agenda"
}

resource "grafana_folder" "alerts" {
  title = "Agenda · Alertas"
  uid   = "agenda-alerts"
}

# Os dashboards selecionam o datasource pelas variáveis ${prometheus} / ${loki}, então o mesmo
# JSON funciona no Grafana Cloud e no Grafana local sem substituição de UID.
resource "grafana_dashboard" "this" {
  for_each = fileset("${path.module}/dashboards", "*.json")

  folder      = grafana_folder.dashboards.uid
  config_json = file("${path.module}/dashboards/${each.value}")
}

resource "grafana_contact_point" "email" {
  name               = "agenda-email"
  disable_provenance = true

  email {
    addresses = [var.alert_email]
  }
}

resource "grafana_notification_policy" "root" {
  disable_provenance = true
  contact_point      = grafana_contact_point.email.name
  group_by           = ["alertname"]
  group_wait         = "30s"
  group_interval     = "5m"
  repeat_interval    = "4h"
}
