# Roadmap delegável — lançamento inicial do sistema de gestão clínica

> **Decisão de escopo assumida:** produto B2B para clínicas privadas ambulatoriais no Brasil, com 1 a 10 profissionais, começando por agenda, atendimento, prontuário e recebimento. Se o público inicial for exclusivamente médico, a priorização de documentos e prescrição deve subir; se for multiprofissional, ela pode entrar após o lançamento.

## 1. Objetivo de lançamento

Lançar uma operação clínica segura e completa no fluxo principal:

```text
Paciente → agendamento → confirmação/lembrete → chegada → atendimento
         → evolução assinada → pagamento → retorno/acompanhamento
```

O produto **já cobre boa parte da operação interna**: agenda, salas, disponibilidade, bloqueios, status de atendimento, pacientes, evolução SOAP/DAP, equipe, convênios, pacotes, pagamentos e relatórios.

O lançamento não deve depender de IA, prescrição própria, RNDS ou de um ERP hospitalar. Deve depender de segurança, permissões corretas e de uma jornada utilizável de ponta a ponta.

## 2. Diagnóstico de partida

| Camada | Evidência atual | Decisão |
| --- | --- | --- |
| Web | Há telas para agenda, pacientes, prontuário, equipe, profissionais, financeiro e configurações. | Manter e completar os fluxos. |
| API | Há 43 controllers e 168 operações; vários módulos ainda não têm experiência web. | Expor só o que compõe a jornada de lançamento. |
| Navegação | A sidebar aponta para `/form-templates` e `/chat`, mas essas rotas não existem. | Corrigir antes de qualquer piloto. |
| Autorização | `useCan()` retorna `true` para qualquer permissão no web. | Bloqueador de lançamento; implementar RBAC real. |
| Notificações | O domínio de lembretes existe, mas os providers atuais são stubs. | Integrar provider real e medir entrega. |
| Dados clínicos | Há controle de acesso e estruturas de auditoria pontuais, mas não há evidência de trilha unificada de acesso, backup/restauração ou retenção. | Tratar como requisito operacional e não como detalhe futuro. |

## 3. Ordem recomendada

| Fase | Objetivo | Liberação |
| --- | --- | --- |
| 0 — Correções críticas | Evitar navegação quebrada e acessos indevidos. | Ambiente de homologação confiável. |
| 1 — Jornada clínica mínima | Fechar atendimento do agendamento ao retorno. | Piloto controlado com clínicas parceiras. |
| 2 — Segurança e operação | Tornar o piloto auditável, recuperável e suportável. | Lançamento comercial inicial. |
| 3 — Experiência do paciente | Reduzir faltas e tempo administrativo. | Crescimento e retenção. |
| 4 — Diferenciais | Construir vantagem competitiva com IA responsável e cuidado longitudinal. | Expansão de produto. |

## 4. Backlog delegável

### Épico L0 — Correções críticas de produto

**Objetivo:** tornar o que já está no menu e no modelo de permissões coerente e seguro.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L0-01 | Remover temporariamente os links de Formulários e Chat ou criar rotas com estados de indisponibilidade claros. | Frontend | Nenhuma | Nenhum item da sidebar leva a 404; teste e2e de navegação cobre todos os itens. |
| L0-02 | Definir matriz RBAC por papel (`OWNER`, `ADMIN`, `PROFESSIONAL`, `SECRETARY`, `VIEWER`) e por recurso. | Produto + backend | Nenhuma | Matriz aprovada, versionada e ligada às permissões do domínio. |
| L0-03 | Criar endpoint de permissões efetivas do membro autenticado. | Backend | L0-02 | Retorna permissões calculadas pelo servidor e testes cobrem os cinco papéis. |
| L0-04 | Conectar `useCan()`/`Can` ao endpoint e esconder/desabilitar ações não autorizadas. | Frontend | L0-03 | Usuário sem permissão não vê ações administrativas; loading e erro são tratados. |
| L0-05 | Auditar autorização no servidor nas ações críticas: paciente, prontuário, agenda, financeiro, documentos e equipe. | Backend + QA | L0-02 | Tentativas não autorizadas retornam 403; testes de integração provam isolamento entre clínica/membro/paciente. |
| L0-06 | Atualizar OpenAPI, client gerado e testes e2e após o RBAC. | Full-stack + QA | L0-03 a L0-05 | `pnpm typecheck`, testes do módulo e e2e de perfis passam. |

### Épico L1 — Jornada clínica mínima

**Objetivo:** garantir que a clínica consiga operar o dia inteiro apenas pelo produto.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L1-01 | Revisar e formalizar a máquina de estados do agendamento: agendado, confirmado, chegou, em atendimento, concluído, faltou e cancelado. | Produto + backend | L0-02 | Transições inválidas são rejeitadas; cada transição tem responsável, data/hora e motivo quando aplicável. |
| L1-02 | Criar painel operacional de recepção para os atendimentos do dia, com filtros de status e ação rápida. | Frontend | L1-01 | Recepção consegue confirmar chegada, chamar, registrar falta e abrir paciente sem entrar na edição do agendamento. |
| L1-03 | Completar disponibilidade e bloqueios na experiência de agenda, incluindo conflitos visíveis e mensagem de motivo. | Frontend + backend | L1-01 | Não é possível salvar conflito sem confirmação explícita de regra permitida; bloqueios aparecem no calendário. |
| L1-04 | Criar catálogo de procedimentos/serviços com duração, cor, valor e modalidade. | Full-stack | L1-01 | Agendamento usa o catálogo; duração, preço e indicador visual são preenchidos automaticamente e editáveis por permissão. |
| L1-05 | Vincular procedimento ao pagamento e ao relatório de receita. | Backend + frontend | L1-04 | Valor previsto, recebido, pendente e forma de pagamento aparecem de forma consistente na agenda e no financeiro. |
| L1-06 | Implementar assinatura, reabertura controlada e visualização de emendas da evolução. | Full-stack | L0-05 | Evolução assinada fica bloqueada; reabertura exige motivo e gera trilha auditável. |
| L1-07 | Criar alertas e perfil clínico editáveis: alergias, condições, medicamentos e alertas críticos. | Full-stack | L0-05 | Profissional autorizado cria/edita; alerta crítico aparece antes da evolução e do atendimento. |
| L1-08 | Implementar retorno a partir da evolução: sugerir/agendar próximo atendimento com contexto do paciente. | Frontend | L1-01 | Profissional agenda retorno sem recadastrar paciente; conduta de retorno fica ligada ao registro. |
| L1-09 | Criar cobertura e2e do fluxo inteiro de um atendimento. | QA + full-stack | L1-01 a L1-08 | Teste: agenda → chegada → evolução → assinatura → pagamento → retorno. |

### Épico L2 — Notificações e redução de faltas

**Objetivo:** transformar lembretes em um recurso real, observável e confiável.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L2-01 | Selecionar provider de WhatsApp, e-mail e/ou SMS e definir custo, SLA, opt-in e fallback. | Produto + engenharia | Nenhuma | Decisão documentada, contrato de dados e ambiente sandbox disponível. |
| L2-02 | Implementar adapters reais de notificação e substituir stubs por configuração de ambiente. | Backend | L2-01 | Mensagem é enviada no sandbox; falhas são registradas e não interrompem o agendamento. |
| L2-03 | Criar tela de configuração de lembretes por clínica: canal, antecedência, texto e ativação. | Frontend + backend | L2-02 | Admin configura regra; mudanças afetam novos agendamentos. |
| L2-04 | Registrar tentativas, entrega, erro, reenvio e resposta de confirmação/cancelamento. | Backend | L2-02 | Linha do tempo do agendamento mostra o histórico; webhooks são autenticados e idempotentes. |
| L2-05 | Exibir histórico e permitir reenvio manual autorizado. | Frontend | L2-04 | Recepção vê status da mensagem e reenvia sem duplicar cobrança indevida. |
| L2-06 | Criar relatório de confirmação, cancelamento e faltas por período. | Produto + full-stack | L2-04 | Indicadores batem com os agendamentos e podem ser filtrados por profissional. |

### Épico L3 — Segurança, privacidade e operação

**Objetivo:** demonstrar proteção de dados de saúde e capacidade de recuperação antes da abertura comercial.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L3-01 | Produzir inventário de dados, papéis LGPD, bases legais, suboperadores e fluxo de dados de IA/notificações. | Produto + jurídico/DPO + engenharia | Nenhuma | Documento aprovado; cada integração possui finalidade, dados enviados e retenção. |
| L3-02 | Implementar log de auditoria imutável para leitura, criação, alteração, exportação e acesso a dados clínicos. | Backend | L0-05 | Evento contém ator, recurso, clínica, ação, data/hora e resultado; acesso ao log é restrito. |
| L3-03 | Definir e automatizar backup, retenção, criptografia e teste periódico de restauração. | DevOps + backend | Nenhuma | Backup é monitorado; teste de restore em ambiente isolado é documentado e aprovado. |
| L3-04 | Criar gestão de consentimento/preferências de comunicação e opt-out. | Full-stack + jurídico | L2-01 | Paciente pode recusar canais; sistema não agenda campanhas/mensagens fora da preferência. |
| L3-05 | Implementar exportação do prontuário/dados do paciente e processo de solicitação do titular. | Full-stack + jurídico | L3-01 | Exportação autorizada é gerada com rastreabilidade; processo e prazo são documentados. |
| L3-06 | Estabelecer runbook de incidentes: detecção, contenção, comunicação, recuperação e responsáveis. | DevOps + segurança | L3-02, L3-03 | Simulação de incidente executada; responsáveis e canais de escalonamento definidos. |
| L3-07 | Realizar revisão de segurança de autenticação, sessão, upload, webhooks, dependências e autorização. | Segurança + backend | L0-05 | Vulnerabilidades críticas corrigidas ou formalmente aceitas com prazo; relatório interno disponível. |

### Épico L4 — Formulários, documentos e portal do paciente

**Objetivo:** reduzir trabalho administrativo e entregar a jornada externa ao paciente.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L4-01 | Criar rota e interface de catálogo/versionamento/publicação de templates de formulário. | Full-stack | L0-01 | Admin cria, clona, publica e descontinua template; histórico de versão é preservado. |
| L4-02 | Criar preenchimento interno de formulários por paciente e vínculo ao prontuário. | Full-stack | L4-01 | Profissional preenche, salva rascunho e conclui; respostas aparecem no paciente. |
| L4-03 | Criar link seguro de pré-consulta para o paciente, com expiração e acesso mínimo. | Full-stack + segurança | L3-02 | Paciente preenche sem acessar dados de terceiros; respostas entram como pendentes de revisão. |
| L4-04 | Implementar documentos clínicos PDF e templates de receita, atestado, encaminhamento e solicitação. | Full-stack | L1-06 | Documento é gerado, associado ao paciente/evolução e tem versão preservada. |
| L4-05 | Integrar assinatura digital por provider, caso o público inicial inclua médicos. | Produto + backend + jurídico | L4-04 | Documento assinado é validável; provider e responsabilidades contratuais estão documentados. |
| L4-06 | Implementar upload, importação/OCR e tela de revisão humana antes de qualquer uso clínico. | Full-stack + QA | L3-07 | Arquivo tem status, origem e confidencialidade; conteúdo extraído nunca vira prontuário sem aprovação humana. |

### Épico L5 — Financeiro e gestão comercial

**Objetivo:** evoluir de registro de recebimento para gestão financeira suficiente para clínicas privadas.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L5-01 | Consolidar contas a receber por atendimento, pacote, assinatura do paciente e convênio. | Produto + backend | L1-05 | Receita prevista/realizada/atrasada concilia com pagamentos e agenda. |
| L5-02 | Implementar recorrência, créditos e consumo de pacotes com histórico compreensível ao paciente/equipe. | Full-stack | L5-01 | Cada crédito consumido ou estornado tem evento vinculado ao atendimento. |
| L5-03 | Criar fluxo de convênio: elegibilidade, autorização, guia, glosa, recurso e pagamento. | Full-stack | L5-01 | Status da guia é visível e altera previsão de recebimento. |
| L5-04 | Avaliar integração de emissão fiscal/NFS-e por município ou provider. | Produto + fiscal + engenharia | L5-01 | Decisão de build/buy tomada; piloto em município alvo concluído, se estiver no escopo. |
| L5-05 | Criar indicadores de gestão: ocupação, faltas, receita por profissional/procedimento e inadimplência. | Produto + frontend | L1-09, L5-01 | Filtros por período e profissional; definições dos indicadores são documentadas. |

### Épico L6 — Diferenciais de produto

**Objetivo:** construir vantagem sem comprometer segurança clínica ou o lançamento.

| ID | Tarefa delegável | Perfil sugerido | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| L6-01 | Lançar copiloto clínico por paciente: resumo, busca no histórico e preparação de evolução. | IA + full-stack + clínico responsável | L3-01, L3-02, L4-02 | Toda resposta mostra fontes internas, limitações e botão de copiar/aprovar; nunca grava sozinha. |
| L6-02 | Criar inbox de propostas de IA para agendar, remarcar ou criar alertas, sempre com aprovação humana. | IA + full-stack | L6-01 | Proposta contém impacto e dados usados; confirmar/rejeitar mantém trilha de auditoria. |
| L6-03 | Implementar planos de cuidado, metas e tarefas de acompanhamento por especialidade. | Produto + full-stack | L4-02 | Paciente e equipe veem tarefas autorizadas, prazo e progresso. |
| L6-04 | Criar automações de retorno baseadas em conduta, ausência e plano de cuidado. | Produto + backend | L2-04, L6-03 | Regra é configurável, auditável e respeita opt-out. |
| L6-05 | Modelar camada de interoperabilidade FHIR para recursos internos prioritários (`Patient`, `Practitioner`, `Appointment`, `Observation`, `DocumentReference`). | Arquitetura + backend | L3-01 | Mapeamento documentado, testado e isolado do domínio interno. |
| L6-06 | Avaliar integração RNDS apenas após validação comercial e jurídica. | Produto + jurídico + arquitetura | L6-05 | Não entra em produção sem credenciamento, escopo e modelo RNDS confirmados. |

## 5. Itens deliberadamente fora do MVP inicial

- Construir prescrição eletrônica própria e manter certificação/assinatura internamente.
- Integração RNDS em produção.
- ERP hospitalar, internação, estoque/farmácia ou faturamento TISS completo.
- IA autônoma que altera prontuário, agenda ou dados clínicos sem aprovação humana.
- App nativo completo para paciente antes de validar o portal web responsivo.

Para documentos médicos eletrônicos, a Resolução CFM nº 2.299/2021 exige, entre outros pontos, identificação, data/hora e assinatura digital; a assinatura deve usar certificados ICP-Brasil com NGS2. Avaliar integração com provider especializado é mais seguro do que construir esse componente no primeiro ciclo. A resolução se aplica à medicina; validar regras específicas dos demais conselhos profissionais antes de ampliar o escopo.

## 6. Definição de pronto para lançamento comercial

O lançamento comercial só deve ocorrer quando todos os pontos abaixo forem verdadeiros:

- [ ] Não há item de navegação sem rota ou fluxo utilizável.
- [ ] Permissões por papel são aplicadas e testadas no frontend e no backend.
- [ ] Um atendimento completo pode ser executado e auditado do agendamento ao pagamento/retorno.
- [ ] Notificações usam provider real, têm opt-out e registram entrega/falha.
- [ ] Evoluções podem ser assinadas, reabertas com motivo e auditadas.
- [ ] Backup e restauração foram testados; existe plano de incidente e responsável operacional.
- [ ] Há inventário de dados, política de privacidade, termos, subprocessadores e processo para solicitações de titulares.
- [ ] Testes de integração, typecheck e os fluxos e2e críticos passam no ambiente de homologação.
- [ ] Pelo menos uma clínica piloto executou o fluxo diário e reportou bloqueios resolvidos.

## 7. Formato sugerido para delegação

Cada ticket deve conter:

1. ID do backlog acima e objetivo de negócio.
2. Escopo explícito e itens fora de escopo.
3. Contrato de API/alterações de banco, quando houver.
4. Permissões e impacto em dados clínicos.
5. Critérios de aceite desta tabela transformados em cenários de teste.
6. Testes esperados: unidade, integração e/ou e2e.
7. Plano de migração, feature flag e rollback para alterações de risco.

## 8. Referências

- Código analisado: `apps/web/src/views/modules/routes.ts`, `apps/web/src/views/layouts/StackedLayout/index.tsx`, `apps/web/src/hooks/useCan.tsx`, `apps/server/src/application` e `apps/server/prisma/schema.prisma`.
- Análise de mercado: `/home/andreeduardo/Downloads/analise-concorrentes-saude.md`.
- [Resolução CFM nº 2.299/2021](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2021/2299_2021.pdf).
- [DATASUS — Modelo Padrão de Dados / RNDS e HL7 FHIR](https://datasus.saude.gov.br/modelo-padrao-de-dados-mad/).
- [ANPD — Nota Técnica sobre tratamento de dados de saúde](https://www.gov.br/anpd/pt-br/acesso-a-informacao/participacao-social/outras-acoes/documentos/ts-05-2024-nota-tecnica-no-26-2024-cgn-anpd.pdf).
