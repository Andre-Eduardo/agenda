# Inventário de dados, LGPD e suboperadores — v0.1.2

**Estado:** rascunho de engenharia, **pendente de validação** do Jurídico/DPO. **Referência:** L3-01, Sprint 0.
**Base:** código em `master` no commit `f54a583`, levantado em 2026-09-23. A v0.1.1 atualiza as
seções 6 e 7 para a exclusão lógica introduzida depois disso. A v0.1.2 atualiza as seções 2, 6, 7
e 8 para o F-11 (senha e dados pessoais no `Event.payload`), tratado no card L3-07.

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
| Operacional                   | eventos de domínio (o `payload` guarda um snapshot do agregado: identificação do paciente, nome e e-mail do usuário e, nos eventos de evolução, perfil clínico, alerta e documento clínico, o conteúdo clínico; ver 7.1), uso e custo de IA, logs de interação com IA | `Event`, `UsageRecord`, `ClinicalChatInteractionLog` | **Sim** (`Event`) |

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
| Exclusão lógica (`deletedAt`)     | `DELETE` de paciente (e da `Person` correspondente), evolução, agendamento, usuário, profissional, sala, bloqueio de agenda e horário de trabalho marca `deletedAt`; o registro permanece no banco e some de todas as leituras. Alerta e sessão de chat já eram assim. |
| Efeitos em cascata da exclusão lógica | Excluir um usuário também revoga (exclusão lógica) todos os seus vínculos com clínicas. Excluir um paciente esconde seus agendamentos e evoluções das leituras, mas os mantém no banco. |
| Exclusão física (`prisma.*.delete`) | Só dado derivado ou técnico, sem coluna `deletedAt`: chunks de contexto e de conhecimento, índice de campos de formulário, permissões por documento e uploads temporários. |
| `TempCleanupJob`                  | Apaga uploads temporários com mais de 24 h.                                   |
| `ExpireOldProposalsJob`, `expire-patient-*` | Mudam o **status** de propostas, pacotes e convênios; não apagam dados. |
| Tabela `Event`                    | `RecordEvent` grava todo evento de domínio (tipo, clínica, membro, IP, data) com um snapshot do agregado no `payload`. O código nunca a apaga; a única alteração é a migration `20260923170000_strip_password_from_event_payloads`, que remove a chave `password` de linhas antigas (F-11, 7.1). |

Não existe job de expurgo, anonimização nem política de prazo por categoria de dado. A exclusão
lógica esconde o dado, mas **não o elimina**: nome, documento, contato e prontuário continuam nas
tabelas e no `Event.payload`. Chaves únicas seguem reservadas pelos registros excluídos
(`username` e `email` de usuário, documento do paciente por clínica, vínculo profissional–membro).
Os eventos `*_DELETED` registram quem excluiu e quando, mas a tabela não é um log de auditoria
imutável nem cobre leitura (escopo do L3-02). A exclusão não alcança dados já enviados a
terceiros. Não há exportação do prontuário completo do paciente nem fluxo para pedidos do titular
(escopo do L3-05).

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
| F-10 | Corrigido na v0.1.1: paciente, evolução, agendamento, usuário e demais entidades com `deletedAt` eram apagados fisicamente (e a exclusão de paciente com prontuário falhava por chave estrangeira). Passaram a exclusão lógica. Resta definir quando o dado excluído é anonimizado ou eliminado. | Média | DPO (dever de guarda e eliminação) |
| F-11 | Parcialmente corrigido na v0.1.2: os eventos de usuário gravavam no `Event.payload` o hash, o salt e o tamanho de chave da senha; isso foi corrigido no código e nas linhas já gravadas (7.1). Resta: cada evento grava um snapshot completo do agregado (documento, contato, endereço e nascimento do paciente; texto de evolução, perfil clínico e alertas), sem minimização e sem expurgo. | Alta (resto) | DPO e L3-02 decidem o conteúdo e o prazo; senha: L3-07 |

F-06 e F-08 pertencem à revisão de segurança; estão aqui porque afetam a proteção do dado inventariado.

### 7.1 F-11 — o que o `Event.payload` guarda

**Senha (corrigido).** `EventMapper.toPersistence` copiava o evento com `structuredClone`, que copia
todas as propriedades e nunca chama `toJSON()`. Os eventos que carregam um `User` gravavam
`user.password` (`hash`, `salt`, `keySize`) no `payload`: `USER_SIGNED_UP`, `USER_CREATED` e
`USER_DELETED` na chave `user`, e `USER_CHANGED` em `oldState` e `newState` (por isso o hash de
uma senha anterior também ficava guardado). O mesmo `structuredClone` gravava os identificadores
como `{"value": "..."}` em vez das strings que o tipo `EventPayload` declara.

- **Reprodução (2026-09-23).** A suíte Cucumber completa no código antigo gerou 1520 eventos;
  252 tinham hash e salt: `USER_SIGNED_UP` 247, `USER_DELETED` 4, `USER_CHANGED` 1.
- **Correção.** O mapper serializa o payload por JSON, e cada agregado decide o que expõe;
  `User.toJSON()` já omitia a senha. `ObfuscatedPassword.toJSON()` devolve `"[REDACTED]"`, para
  que a senha não vaze nem se algum evento futuro a carregar fora de um `User`. A mesma suíte no
  código novo gerou os mesmos 1520 eventos, com as mesmas contagens por tipo e 0 linhas com senha.
- **Outros segredos.** Nenhum encontrado nos agregados que viajam em evento. A busca por campos
  de segredo em `apps/server/src/domain` só achou `password` em `User`; o resto são `contentHash` e
  contagens de tokens de IA, que não viajam em evento. Segredos de ambiente são o F-08.

**Linhas já gravadas (decisão).** Os eventos **não são apagados**: a trilha de quem fez o quê e
quando é o valor da tabela. A migration `20260923170000_strip_password_from_event_payloads`
remove só a chave `password` de `user`, `oldState` e `newState`, em qualquer tipo de evento (inclui
tipos que já não existem no código). Ela é idempotente e é aplicada por
`pnpm -F @agenda-app/server prisma:migrate` (`prisma migrate deploy`), que o `prestart:dev` e o
comando do `.replit` já executam; o repositório não define o deploy de produção (INT-09), então é
preciso confirmar que ele roda as migrations. Foi testada sobre as 1520 linhas geradas pelo código
antigo: 252 linhas limpas, nenhuma outra coluna ou chave alterada, segunda execução sem efeito.
Depois de aplicar em cada ambiente, confira:

```sql
SELECT count(*) FROM event WHERE payload::text ~ '"(password|hash|salt|keySize)"';  -- esperado: 0
```

Para o DPO, a migration **não alcança**:

- backups e cópias feitas antes dela (L3-03), que ainda contêm o hash, inclusive de senhas
  anteriores (`oldState`) e de usuários já excluídos. O hash da senha atual também está em
  `user.password`; o que o `Event` acrescentava eram as cópias antigas. Definir até quando esses
  backups são guardados, e se a exposição exige avaliação de incidente ou troca de senhas, é
  decisão do DPO; este documento não a faz;
- os identificadores em `{"value": "..."}` das linhas antigas. Nenhum código de aplicação lê o
  `payload` hoje (`EventRepository.search` não tem chamador; só o `RecordEvent` grava). Quem
  passar a lê-lo (L3-02) precisa aceitar as duas formas ou normalizar as linhas antigas antes.

**Dados pessoais e clínicos no payload (não alterado).** Cada evento grava o agregado inteiro, e
os eventos `*_CHANGED` gravam o estado antigo e o novo. Chaves encontradas na execução acima:

| Eventos                                              | Dado no `payload`                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `PATIENT_CREATED`, `_CHANGED`, `_DELETED`            | `documentId`, telefone, e-mail, endereço, nascimento, contato de emergência, número da carteirinha |
| `RECORD_CREATED`, `_CHANGED`, `_DELETED`             | texto integral de `subjective`, `objective`, `assessment`, `plan`, `freeNotes` e `description` (dois textos completos em `_CHANGED`) |
| `CLINICAL_PROFILE_CREATED`, `_CHANGED`               | alergias, condições crônicas, medicações, histórico e notas gerais                  |
| `PATIENT_ALERT_CREATED`, `_CHANGED`, `_DELETED`      | título e descrição                                                                  |
| `CLINICAL_DOCUMENT_GENERATED`                        | `contentJson` do documento                                                          |
| `APPOINTMENT_*`                                      | observação e motivo de cancelamento (vistos em `APPOINTMENT_DELETED`; os demais eventos de agendamento carregam o mesmo agregado) |
| `USER_*`, `CLINIC_CREATED`, `PROFESSIONAL_*`         | nome, e-mail e usuário; documento, telefone e e-mail da clínica; número de registro profissional |

Nada disso foi mudado. Reduzir o snapshot exige decidir o que a trilha de auditoria precisa
guardar (escopo do L3-02); cortar campos sem essa decisão pode esvaziar a auditoria ou deixar
lacunas que ninguém escolheu. Direção sugerida, para o DPO e o L3-02 validarem: eventos de mudança
guardam identificadores e os **nomes** dos campos alterados, sem o texto; eventos `*_DELETED` de dado
clínico guardam só identificadores. Enquanto isso, a exclusão lógica (F-10) esconde o dado das
leituras, mas o texto clínico e a identificação do paciente continuam legíveis no `Event.payload`.

## 8. Perguntas em aberto para Jurídico/DPO

1. Confirmar os papéis da seção 1, em especial o da plataforma nos dados de pacientes.
2. Definir base legal por finalidade (atendimento, agenda, cobrança, IA assistiva, lembretes).
3. Definir prazo de retenção por categoria da seção 2 e o que acontece após o prazo.
4. Confirmar DPA, retenção de entradas e uso para treinamento em OpenRouter, provedores de
   modelo, OpenAI, Asaas e AWS; registrar região de cada um.
5. Decidir se o envio de prontuário a modelos de IA de terceiros exige consentimento ou aviso
   específico ao paciente, e se há restrição por especialidade (por exemplo, saúde mental).
6. Definir o canal e o prazo para atender solicitações do titular (L3-05).
7. Definir por quanto tempo o paciente e o prontuário excluídos logicamente são guardados
   (deveres de guarda do prontuário) e quando passam a ser anonimizados ou eliminados, inclusive
   no `Event.payload` (F-10, F-11).
8. Definir o que o `Event.payload` pode conter (minimização) e por quanto tempo a tabela `Event`
   é guardada, e decidir o destino dos backups anteriores à migration do F-11, que ainda contêm
   hash de senha (7.1).

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
