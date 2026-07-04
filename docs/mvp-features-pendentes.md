# Features do MVP pendentes de UI (e2e)

Levantamento feito a partir de `mvp-features.html` (análise de código de 2026-04-25),
comparando o que o backend já expõe com o que existe de fato em `apps/web`. Muitas features
estão marcadas como "done" no documento por terem model/domain/endpoint prontos no servidor,
mas **não possuem tela ou ação na interface** — por isso não são verificáveis via teste e2e
hoje. Os stubs comentados correspondentes estão em `e2e/tests/pending/`.

## Identidade & Clínica

- **Endereço, logo e especialidades da clínica** — `UpdateClinicService` e `PATCH /clinics/:id`
  existem, mas não há tela de configurações da clínica; `settings/pages/index` só edita o
  perfil do profissional (identidade/dados profissionais/consultório/segurança).
- **Sistema de convite de membros** — `invitedByMemberId` é gravado no backend, mas não há
  tela "Membros"/"Equipe" para convidar, listar ou aceitar convites.
- **Perfis de acesso por papel (OWNER, ADMIN, PROFESSIONAL, SECRETARY, VIEWER)** — não há UI
  para atribuir papéis a membros; o hook `useCan()` no frontend é um placeholder que sempre
  retorna `true` (ver `docs/frontend/03-auth.md`), então restrições de UI por papel ainda não
  podem ser validadas ponta a ponta.

## Pacientes

- **Convênio e plano de saúde** — exibido apenas como badge somente-leitura na lista e no
  detalhe do paciente; o formulário de edição repassa `insurancePlanId` sem alteração
  (`patients/pages/edit/index.tsx:438`), não há campo para vincular/trocar o convênio.
- **Permissão granular por paciente e documento** — `DocumentPermissionController` existe na
  API, mas não há tela para conceder/revogar acesso a um documento específico por membro.

## Agenda & Atendimentos

- **Horários de trabalho por profissional (WorkingHours)** — usado internamente na validação
  de conflitos, mas não há tela de configuração de disponibilidade semanal.
- **Bloqueio de agenda (MemberBlock)** — CRUD completo no backend, sem ação "Bloquear horário"
  no calendário.
- **Check-in / status de chegada na recepção** — os status `ARRIVED`/`IN_PROGRESS` aparecem em
  `STATUS_LABELS`, mas o painel de detalhes do agendamento só oferece "Editar" e "Cancelar
  consulta" — não há botão para registrar chegada ou chamar o paciente.
- **Confirmação e lembretes automáticos** — `ClinicReminderConfig` e o agendamento automático
  de lembretes funcionam no backend, mas não há tela para configurar canais/horários nem para
  visualizar os lembretes de um agendamento.

## Prontuário & Evolução

- **Assinatura e bloqueio da evolução** — o detalhe do registro já mostra o badge de
  assinado/rascunho (`isLocked`), mas não há botão "Assinar" nem "Reabrir", e não há
  visualização da trilha de `RecordAmendment`.
- **Perfil clínico do paciente (edição)** — exibido somente leitura via
  `useGetClinicalProfile`; não há formulário para criar/editar alergias, condições crônicas
  ou medicamentos.
- **Alertas do paciente (criação)** — badges de alerta são somente leitura
  (`useSearchPatientAlerts`); não há ação "Novo alerta".
- **Pré-evolução gerada por IA (revisável)** — `DraftEvolution` e o fluxo de
  aprovação existem no backend, mas não há tela para revisar, editar ou aprovar um rascunho.

## Documentos & Formulários

Módulo inteiro sem tela correspondente em `apps/web`:
- Upload de arquivos (`PrepareUploadService`/`PromoteFileService`)
- Pipeline de importação por OCR/IA e revisão de campos extraídos (`ExtractedField`)
- Formulários dinâmicos por especialidade (`FormTemplate`/`PatientForm`)
- Geração de documentos clínicos em PDF (receita, atestado, encaminhamento, exame)

## IA Assistiva

Módulo inteiro sem tela correspondente em `apps/web`:
- Chat clínico por paciente com RAG (`PatientChatSession`)
- Catálogo/resolução de agentes especializados (`AiAgentProfile`)
- Billing interno de IA — custo por interação, visível ao usuário

## Agente Autônomo

Módulo inteiro sem tela correspondente em `apps/web`:
- Loop de raciocínio com ferramentas clínicas (`POST /agent/ask`)
- Inbox de propostas do agente — confirmar/rejeitar mutações propostas

## Financeiro — Atendimento

Módulo inteiro sem tela correspondente em `apps/web`:
- Registro de pagamento por atendimento (`AppointmentPayment`)
- Status financeiro refletido no calendário
- Relatório de recebimentos (`FinancialReportService`)

## Planos e Assinaturas

Módulo inteiro sem tela correspondente em `apps/web`:
- Catálogo de planos e troca de plano (`ProfessionalSubscription`)
- Compra de add-ons (`SubscriptionAddon`)
- Indicador de status de cobrança recorrente (Asaas — pagamento confirmado/atrasado)

## Metering e Uso

Módulo inteiro sem tela correspondente em `apps/web`:
- Dashboard de consumo do profissional (`GET /members/:id/usage`)
- Aviso de soft warning (80%) / bloqueio hard (100%) visível ao usuário
- Relatório interno de custo por profissional/modelo (`BillingReportService`)

---

## Observação sobre testes de integração (backend)

O próprio `mvp-features.html` também lista um conjunto separado de features **com
implementação completa mas sem cobertura BDD/Cucumber** no servidor (`clinic`,
`working-hours`, `member-block`, `appointment-checkin`, `draft-evolution`, `asaas-webhook`,
`usage-limit`, `agent-proposal`, etc.). Esse é um gap de teste de integração no backend, não de
e2e de frontend — ver `docs/integration-test-patterns.md` para o padrão de testes BDD do
projeto.
