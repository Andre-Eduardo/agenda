terraform {
  required_version = ">= 1.10"

  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 3.25"
    }
  }
}

# Autenticação pela variável de ambiente GRAFANA_AUTH, lida pelo próprio provider:
# - Grafana Cloud: service account token (papel Admin) do stack.
# - Grafana local (docker compose, serviço lgtm): "admin:admin".
provider "grafana" {
  url = var.grafana_url
}
