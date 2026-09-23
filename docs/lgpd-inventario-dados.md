# Inventário de dados, LGPD e suboperadores — v0.1.0

**Estado:** rascunho de engenharia, **pendente de validação** do Jurídico/DPO. **Referência:** L3-01, Sprint 0.
**Base:** código em `master` no commit `f54a583`, levantado em 2026-09-23.

Este documento registra, para cada integração que trata ou pode tratar dado pessoal, a
**finalidade**, os **dados enviados** e a **retenção**. Descreve o que o código faz hoje; não é
parecer jurídico. Papéis LGPD, bases legais e prazos de retenção são decisões do DPO — onde o
código não define nada, o documento diz "não definida" e registra a lacuna na seção 7.

## Como ler

| Estado      | Significado                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| **ATIVO**   | O código chama o terceiro quando a variável de ambiente correspondente é definida. |
| **STUB**    | Existe apenas um adaptador de mentira; nenhum dado sai do processo.          |
| **INFRA**   | Cliente pronto, mas nenhum fluxo de negócio o utiliza.                       |

"Padrão" é o comportamento sem configuração adicional (`apps/server/.env.example`).

## 1. Papéis LGPD (proposta a validar)

| Papel                         | Quem                                                       | Observação                                                                                  |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Titulares                     | Pacientes; profissionais e demais membros da clínica       |                                                                                             |
| Controlador (dados de pacientes) | A clínica (tenant, `Clinic`)                            | O modelo é multi-tenant com banco compartilhado — ver [multi-tenant-isolation.md](multi-tenant-isolation.md). |
| Operador                      | A plataforma Agenda Saúde                                  | Trata dados de pacientes em nome da clínica.                                                |
| Controlador (dados de assinatura) | A plataforma, em relação ao profissional que assina    | O gateway recebe dados do profissional, não do paciente (seção 4, INT-03).                  |
| Suboperadores                 | Terceiros da seção 4                                       | Contratos/DPAs não estão no repositório e **não foram verificados**.                        |

## 2. Categorias de dados

| Categoria                     | Campos (Prisma)                                                                                              | Modelos                                                                 | Sensível (saúde)? |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------- |
| Identificação do paciente     | nome, telefone, gênero (`Person`); `documentId`, `birthDate`, `email`, contato de emergência (`Patient`)      | `Person`, `Patient`                                                     | Não               |
| Endereço                      | rua, número, bairro, cidade, UF, CEP (`PatientAddress`)                                                       | `PatientAddress`                                                        | Não               |
| Convênio                      | plano, número da carteirinha, validade                                                                        | `Patient`, `InsurancePlan`, `PatientInsuranceEnrollment`, `InsuranceClaim` | Não            |
| Clínico                       | alergias, condições crônicas, medicações, histórico cirúrgico/familiar/social (`ClinicalProfile`); evoluções SOAP (`Record`); alertas; formulários | `ClinicalProfile`, `Record`, `RecordAmendment`, `PatientAlert`, `PatientForm`, `FormFieldIndex`, `ClinicalDocument`, `DraftEvolution`, `ImportedDocument`, `ExtractedField` | **Sim** |
| Conversa com IA               | mensagens, snapshot de contexto, chunks e embeddings do paciente                                              | `PatientChatSession`, `PatientChatMessage`, `PatientContextSnapshot`, `PatientContextChunk` | **Sim** |
| Agenda                        | horários, sala, profissional, lembretes                                                                       | `Appointment`, `AppointmentReminder`, `ClinicReminderConfig`            | Indireto          |
| Financeiro                    | pagamentos de consulta, pacotes, planos, assinaturas do profissional, eventos do gateway                       | `AppointmentPayment`, `PatientPackage*`, `PatientSubscription*`, `ProfessionalSubscription`, `PaymentEvent` | Indireto |
| Conta e acesso                | usuário, e-mail, nome, telefone, hash de senha, papel global; vínculo e papel na clínica                       | `User`, `ClinicMember`, `ProfessionalAgendaAccess`, `ClinicPatientAccess`, `DocumentPermission` | Não |
| Operacional                   | eventos de domínio, uso e custo de IA, logs de interação com IA                                                | `Event`, `UsageRecord`, `ClinicalChatInteractionLog`                    | Não               |

"Indireto" = pode revelar tratamento de saúde por contexto. A classificação final é do DPO.

## 3. Resumo das integrações

| ID     | Integração                          | Estado                 | Finalidade                                   | Ativação                                        |
| ------ | ----------------------------------- | ---------------------- | -------------------------------------------- | ----------------------------------------------- |
| INT-01 | OpenRouter (chat clínico com IA)    | ATIVO (opcional)       | Respostas do assistente clínico              | `AI_CHAT_PROVIDER=openrouter` (padrão: `mock`)   |
| INT-02 | OpenAI Embeddings                   | ATIVO (opcional)       | Busca semântica (RAG) no histórico do paciente | `AI_EMBEDDING_PROVIDER=openai` (padrão: `mock`) |
| INT-03 | Asaas                               | ATIVO (opcional)       | Cobrança das assinaturas de profissionais    | `ASAAS_API_KEY` definida (padrão: mock)         |
| INT-04 | AWS S3                              | ATIVO (opcional)       | Armazenar arquivos enviados e PDFs gerados   | `STORAGE_TYPE=S3` (padrão: `LOCAL`)             |
| INT-05 | Broker MQTT                         | INFRA                  | Mensageria (sem fluxo de negócio hoje)       | `MQTT_BROKER_URL`                               |
| INT-06 | WhatsApp / SMS / e-mail             | STUB                   | Lembretes de consulta                        | Sempre stub                                     |
| INT-07 | Google Fonts (frontend)             | ATIVO (sempre)         | Carregar tipografia e ícones                 | `apps/web/index.html`                           |
| INT-08 | Analytics, telemetria, monitoramento de erros | Nenhum       | —                                            | —                                               |
| INT-09 | Hospedagem e banco                  | Não definido no repo   | Executar API, web e PostgreSQL               | —                                               |

## 4. Inventário por integração

### INT-01 — OpenRouter (chat clínico)

- **Finalidade:** o profissional conversa com um agente por especialidade que resume o histórico
  do paciente e apoia a preparação da evolução.
- **Código:** `apps/server/src/infrastructure/ai-provider/openrouter-chat.provider.ts`
  (fluxo de chat) e `apps/server/src/ai/providers/openrouter.provider.ts` (registro de agentes).
  Ambos chamam `https://openrouter.ai/api/v1` (o segundo aceita `OPENROUTER_BASE_URL`).
  O prompt é montado em `SendChatMessageService` (`application/clinical-chat/services/send-chat-message.service.ts`).
- **Dados enviados:** cada chamada envia ao terceiro
  - nome, idade, gênero, alergias, condições crônicas, medicações, histórico cirúrgico, familiar e social;
  - alertas de severidade alta e média;
  - até 5 eventos recentes da linha do tempo (título e resumo de até 120 caracteres);
  - trechos recuperados por RAG (texto de evoluções SOAP e campos de formulário);
  - histórico recente da conversa e a pergunta do profissional;
  - cabeçalhos `X-Title` e `HTTP-Referer` (nome e URL da aplicação, não pessoais).
- **Não enviados por construção do prompt:** `documentId`, `birthDate` (só a idade), telefone,
  e-mail, endereço, convênio. `ContextPolicyService` permite suprimir campos por agente
  (`blacklistedFields`), mas o padrão é lista vazia.
  Texto livre de evolução ou formulário pode conter identificadores — o código não filtra.
- **Suboperadores em cascata:** o OpenRouter encaminha a um provedor de modelo. Os modelos padrão
  (`domain/clinical-chat/specialty-model-defaults.ts`) são `openai/gpt-4o-mini`, `openai/o1-mini` e
  `anthropic/claude-3.5-sonnet`, sobrescrevíveis por `AGENT_*_MODEL`. O modelo `openrouter/auto`
  é bloqueado, o que impede roteamento para um provedor não escolhido.
- **Retenção no terceiro:** não definida no repositório; **a confirmar** em DPA/política do
  OpenRouter e dos provedores de modelo (uso para treinamento, retenção de prompts, região).
- **Retenção local:** mensagens em `PatientChatMessage`; `ClinicalChatInteractionLog` guarda
  metadados (ids, modelo, tokens, custo, latência, erro), não o texto do prompt nem da resposta.
  Nenhum prazo de expurgo.

### INT-02 — OpenAI Embeddings

- **Finalidade:** vetorizar trechos do histórico do paciente e a pergunta do profissional para
  busca por similaridade (pgvector) restrita ao paciente.
- **Código:** `apps/server/src/infrastructure/ai-provider/openai-embedding.provider.ts`
  (`https://api.openai.com/v1/embeddings`); indexação em `IndexPatientChunksService`.
- **Dados enviados:** o **texto integral** de cada chunk — seções subjetivo, objetivo, avaliação,
  plano, notas livres e descrição de evoluções, e pares "rótulo: valor" de formulários preenchidos —
  além da consulta da busca. O `health-check` envia apenas a string literal `health-check`.
  Nenhum campo estruturado de identificação é incluído, mas o texto livre pode conter nomes e dados.
- **Retenção no terceiro:** não definida no repositório; **a confirmar** (DPA, política de
  retenção de entradas da API).
- **Retenção local:** `PatientContextChunk` (texto e vetor) sem prazo de expurgo. O isolamento por
  paciente é imposto em código (`ContextPolicyService.assertPatientIdRequired`).

### INT-03 — Asaas (gateway de pagamento)

- **Finalidade:** cobrar a assinatura mensal e add-ons do **profissional** (`ProfessionalSubscription`).
  Não há integração de gateway para pagamentos de pacientes: `AppointmentPayment` não usa o provedor.
- **Código:** `apps/server/src/application/payment/providers/asaas.adapter.ts`;
  webhook em `application/payment/webhooks/asaas-webhook.controller.ts` (autenticado por
  `ASAAS_WEBHOOK_TOKEN`). `paymentProviderFactory` usa o Asaas só quando `ASAAS_API_KEY` está
  definida; sem ela, usa `MockPaymentProvider`. `ASAAS_ENV` escolhe sandbox ou produção.
- **Dados enviados:** nome, e-mail, telefone e CPF/CNPJ do profissional; valor, vencimento,
  meio de pagamento e descrição da cobrança.
- **Dados recebidos:** eventos de pagamento (id, cliente, valor, status, datas).
  O payload bruto é gravado em `PaymentEvent.rawPayload`.
- **Retenção no terceiro:** não definida no repositório; **a confirmar** (obrigações fiscais e
  regulatórias do gateway).
- **Retenção local:** `PaymentEvent` e `ProfessionalSubscription` sem prazo de expurgo.

### INT-04 — AWS S3 (arquivos)

- **Finalidade:** guardar arquivos enviados pelos usuários e PDFs de documentos clínicos gerados
  (`GeneratePdfService`).
- **Código:** `apps/server/src/infrastructure/storage/s3-file.storage.ts`; seleção em
  `storage.module.ts`. Padrão: armazenamento local em `./uploads`.
- **Dados enviados:** o conteúdo dos arquivos — uploads por URL pré-assinada (PUT, validade de
  1 hora, limite padrão de 5 MB) e PDFs de documentos clínicos gerados pelo servidor.
- **Retenção local:** uploads temporários são apagados após 24 h se não promovidos
  (`TempCleanupJob`, diário). Arquivos promovidos e PDFs gerados não têm prazo.
- **Retenção no terceiro:** definida pela configuração do bucket (ciclo de vida, versionamento,
  região), que **não está no repositório**.

### INT-05 — Broker MQTT

- **Estado:** `MqttClientService` conecta se `MQTT_BROKER_URL` existir, mas nenhum módulo
  publica ou assina tópicos (a busca por `mqtt` só retorna o próprio módulo e a configuração).
- **Dados enviados hoje:** nenhum. Credenciais `MQTT_USERNAME` e `MQTT_PASSWORD`.
- **Ação:** reclassificar como suboperador quando um fluxo passar a usá-lo.

### INT-06 — WhatsApp, SMS e e-mail (lembretes)

- **Estado:** `StubWhatsAppProvider`, `StubSmsProvider` e `StubEmailProvider` só registram em log.
  A escolha dos provedores reais é o card L2-01; a implementação, o L2-02.
- **Dados que passarão a ser enviados:** telefone ou e-mail do paciente e a mensagem
  `Olá, {nome}! Lembramos que você tem uma consulta agendada para {data} às {hora}.`,
  mais os ids do lembrete, do agendamento e do paciente em `metadata`
  (`DispatchRemindersService`).
- **Alerta:** os stubs gravam destinatário e mensagem no log do processo
  (`[STUB] WhatsApp → {to}: {message}`), ou seja, nome, contato e data de consulta em texto claro
  (ver F-02).
- **Retenção:** a definir na escolha do provedor.

### INT-07 — Google Fonts (frontend)

- **Estado:** `apps/web/index.html` carrega CSS de `fonts.googleapis.com` e arquivos de
  `fonts.gstatic.com` (Manrope, Inter, Material Symbols).
- **Dados enviados:** IP e user-agent de **todo visitante**, inclusive na tela de login.
- **Retenção:** política do Google. Sem dado clínico envolvido.
- **Observação:** `@fontsource-variable/inter` e `@fontsource-variable/jetbrains-mono` já são
  dependências do web; Manrope e Material Symbols não.

### INT-08 — Analytics, telemetria e monitoramento de erros

Nenhum encontrado. A busca abaixo, feita em 2026-09-23, não encontrou SDK nem dependência de
Sentry, PostHog, Google Analytics, Mixpanel, Amplitude, Hotjar, Clarity ou Datadog em
`apps/web/src`, `apps/web/index.html` e nos `package.json` de `apps/web` e `apps/server`.
Logs do servidor vão para o console (`winston`, nível `debug`); o destino e a retenção
dependem da hospedagem.

### INT-09 — Hospedagem e banco

- **Local:** `apps/server/docker-compose.yml` sobe `pgvector/pgvector:pg16`.
- **Produção:** o repositório não define provedor, região, backup nem rede. Há `Dockerfile`,
  `.replit` e `replit.md`, sem indicação de que Replit seja produção.
- **Consequência:** o provedor de hospedagem, o serviço de banco e a região são suboperadores
  e ponto de transferência internacional que precisam ser preenchidos aqui. Backup, criptografia
  e restore ficam no card L3-03.

## 5. Fluxo de dados da IA

```
Prontuário / perfil clínico / alertas / formulários   (PostgreSQL)
        │
        ▼
BuildPatientContextService ── snapshot ──▶ PatientContextSnapshot  (local; inclui documentId e birthDate)
        │
        ▼
IndexPatientChunksService ── texto dos chunks ──▶ OpenAI Embeddings (INT-02)
        │                                              │
        ◀──────────── vetores ────────────────────────┘
        ▼
PatientContextChunk  (texto + vetor, pgvector, filtrado por paciente)

Pergunta do profissional
        │  (embedding da pergunta ──▶ INT-02)
        ▼
RAG (top-K por paciente) + ContextPolicyService
        │
        ▼
Prompt = nome, idade, gênero, dados clínicos, alertas, linha do tempo, chunks, histórico
        │
        ▼
OpenRouter (INT-01) ──▶ provedor do modelo (OpenAI / Anthropic / ...)
        │
        ▼
Resposta ──▶ PatientChatMessage + ClinicalChatInteractionLog  (local)
```

## 6. Retenção e eliminação locais

| Mecanismo                         | O que faz                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `deletedAt` (exclusão lógica)     | Coluna presente em muitos modelos, mas só `PatientChatSession` e `PatientAlert` a preenchem. |
| Exclusão física (`prisma.*.delete`) | Paciente, evolução, agendamento, usuário, pessoa, sala, horários, permissões e chunks de contexto são apagados de fato; várias relações do schema usam `onDelete: Cascade`. |
| `TempCleanupJob`                  | Apaga uploads temporários com mais de 24 h.                                   |
| `ExpireOldProposalsJob`, `expire-patient-*` | Mudam o **status** de propostas, pacotes e convênios; não apagam dados. |

Não existe job de expurgo, anonimização nem política de prazo por categoria de dado.
`DELETE /patients/:id` e `DELETE /records/:id` apagam o registro fisicamente, sem trilha de
auditoria (escopo do L3-02) e sem efeito sobre dados já enviados a terceiros. Não há exportação
do prontuário completo do paciente nem fluxo para pedidos do titular (escopo do L3-05).

## 7. Achados e lacunas

Severidade é sugestão de engenharia para priorização; o DPO valida.

| ID   | Achado                                                                                                                                              | Sev. sugerida | Encaminhamento                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------- |
| F-01 | Nenhuma retenção definida: dados clínicos, chats, chunks e payloads de pagamento não expiram, e não há job de expurgo ou anonimização.              | Alta          | DPO define prazos; L3-03 e L3-05   |
| F-02 | Stubs de notificação registram telefone, e-mail, nome e horário da consulta em log de console.                                                       | Média         | Corrigir antes do L2-02            |
| F-03 | Texto integral de prontuário sai para a OpenAI (embeddings) e para o OpenRouter (chat) quando os provedores reais são ativados; DPAs e retenção não verificados. | Alta | DPO/Jurídico antes de ativar em produção |
| F-04 | Google Fonts expõe IP e user-agent de todo visitante ao Google.                                                                                      | Baixa         | Hospedar as fontes localmente      |
| F-05 | `PaymentEvent.rawPayload` guarda o payload integral do gateway, sem minimização.                                                                     | Baixa         | Avaliar campos necessários         |
| F-06 | `S3FileStorage.storeBuffer` devolve URL não assinada (`https://{bucket}.s3.{region}.amazonaws.com/...`) para PDFs clínicos; se o bucket não for privado, o acesso depende só do conhecimento da URL. | Alta (a verificar) | L3-07 (revisão de segurança) |
| F-07 | Hospedagem, banco, região e transferência internacional não estão documentados.                                                                      | Alta          | L3-03                              |
| F-08 | `COOKIE_SECRET` e `AUTH_TOKEN_SECRET` têm valor padrão `super-secret` em `env.config.service.ts` quando a variável não é definida.                   | Alta          | L3-07                              |
| F-09 | Sem filtro de identificadores em texto livre enviado à IA; `blacklistedFields` vem vazio por padrão.                                                 | Média         | Produto/DPO decidem minimização    |
| F-10 | Paciente e evolução são apagados fisicamente, sem trilha e com cascata; `deletedAt` existe em muitos modelos, mas quase nunca é usado.                | Alta          | DPO (dever de guarda) e L3-02      |

F-06 e F-08 pertencem à revisão de segurança; estão aqui porque afetam a proteção do dado inventariado.

## 8. Perguntas em aberto para Jurídico/DPO

1. Confirmar os papéis da seção 1, em especial o da plataforma nos dados de pacientes.
2. Definir base legal por finalidade (atendimento, agenda, cobrança, IA assistiva, lembretes).
3. Definir prazo de retenção por categoria da seção 2 e o que acontece após o prazo.
4. Confirmar DPA, retenção de entradas e uso para treinamento em OpenRouter, provedores de
   modelo, OpenAI, Asaas e AWS; registrar região de cada um.
5. Decidir se o envio de prontuário a modelos de IA de terceiros exige consentimento ou aviso
   específico ao paciente, e se há restrição por especialidade (por exemplo, saúde mental).
6. Definir o canal e o prazo para atender solicitações do titular (L3-05).
7. Compatibilizar a exclusão física de paciente e evolução com os deveres de guarda do
   prontuário (F-10), e decidir se a eliminação deve passar a ser lógica ou por anonimização.

## 9. Manutenção

- Toda nova integração, troca de provedor ou novo dado enviado a terceiro **atualiza este
  documento no mesmo PR** e sobe a versão no título.
- Para refazer o levantamento de integrações:

```bash
grep -rIl -i -E 'openrouter|openai|asaas|twilio|sendgrid|nodemailer|whatsapp|@aws-sdk|mqtt|sentry|posthog|gtag|mixpanel|amplitude|firebase' \
  apps/server/src apps/server/package.json apps/web/src apps/web/index.html apps/web/package.json
grep -n -E 'src=|href=' apps/web/index.html
```

- Aprovação: registre aqui o nome, o papel e a data de quem validou (Jurídico/DPO) antes de
  trocar o estado no topo de "rascunho" para "aprovada".
