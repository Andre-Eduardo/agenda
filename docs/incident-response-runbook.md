# Resposta a incidentes — L3-06

**Estado:** fluxo, papéis e tipos de canal recomendados; titulares e endereços
reais serão definidos na implantação. Antes do uso em produção, o responsável
operacional deve preencher e testar a escala e os destinos de contato da seção
[Acionamento](#acionamento). O repositório não configura um monitor de produção
nem contém contatos de plantão. Não trate este documento como evidência de que
alertas ou backup estejam ativos em produção.

O desenho adapta o [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final):
papéis e autoridade definidos, triagem e priorização, coordenação e comunicação,
recuperação e melhoria contínua. Os prazos de 15 e 30 minutos abaixo são
**recomendações locais**, não exigências do NIST nem compromissos de serviço.

Este runbook cobre indisponibilidade, perda ou corrupção de dados, suspeita de
acesso indevido e falha de backup. Use o [inventário LGPD](lgpd-inventario-dados.md)
para localizar os dados afetados, a [trilha de auditoria](audit-log.md) para
atividade HTTP autenticada e o [procedimento de backup e restauração](backup-restore-runbook.md)
para a recuperação. O líder do incidente registra fatos e decisões em um espaço
restrito; não cola dados clínicos, credenciais, tokens, URLs privadas ou dumps em
chats e tickets.

## Acionamento

| Função | Responsabilidade durante o incidente | Titular e substituto | Canal recomendado |
| --- | --- | --- | --- |
| Líder do incidente (DevOps de plantão) | Receber alerta, abrir registro, classificar, coordenar decisões, manter linha do tempo e encerrar. | **A designar na implantação.** | Fila de alerta monitorada → sala privada de incidente → chamada de voz de contingência. |
| Segurança | Conter acesso, preservar evidências, investigar vetor e aprovar retorno após incidente de segurança. | **A designar.** | Sala privada; chamada direta fora do canal suspeito. |
| Operação de banco e backup | Verificar cópias, executar restore isolado, medir perda e validar integridade. | **A designar.** | Sala privada e chamada direta; acesso separado ao executor e ao cofre de segredos. |
| Privacidade / DPO | Avaliar dados pessoais afetados e decidir, com Jurídico, comunicações e obrigações externas. | **A designar.** | Chamada ou mensagem privada, com evidências em repositório restrito. |
| Produto / suporte e responsável clínico | Avaliar impacto no atendimento, preparar aviso aos usuários e validar fluxos clínicos antes da reabertura. | **A designar.** | Sala privada; depois, canal oficial de comunicação com clientes aprovado pela organização. |
| Direção | Autorizar recursos e decisões de alto impacto, como suspensão prolongada do serviço. | **A designar.** | Chamada direta pelo líder para P1 ou quando a continuidade do atendimento estiver em risco. |

O alerta automático de backup usa `BACKUP_ALERT_URL`, mas o endpoint real e o
monitor de produção ainda não foram escolhidos. O webhook informa apenas serviço,
comando, status e horário; o agendador também deve encaminhar códigos de saída
diferentes de zero ao plantão. Um ticket privado com identificador, linha do
tempo e responsáveis é a fonte do registro; a organização deve escolher seu
sistema e controlar o acesso antes de ativá-lo. Se o canal principal falhar ou
estiver sob suspeita, o líder inicia chamada de voz aos contatos de contingência.
Não usar um canal possivelmente comprometido para compartilhar instruções de
contenção. Testar contato primário e contingência em cada troca de escala.

**Ordem de escalonamento:** quem detecta aciona o líder do incidente; o líder
aciona Segurança e operação de banco imediatamente em suspeita de vazamento,
comprometimento ou perda de dados. Aciona DPO/Jurídico quando houver possibilidade
de dados pessoais afetados e Produto/suporte/responsável clínico quando o
atendimento puder ser prejudicado. Se o titular não responder em 15 minutos
(meta interna proposta, ainda não aprovada), acionar o substituto e registrar a
tentativa. Segurança decide medidas técnicas; DPO/Jurídico decidem necessidade,
conteúdo e prazo de notificações externas. Nenhuma notificação externa deve ser
prometida antes da avaliação do caso.

## 1. Detectar e classificar

1. Receba alerta do serviço, usuário, monitor ou agendador. Registre horário UTC,
   origem, serviços/clínicas possivelmente afetados e quem recebeu. Não inclua
   identificadores de pacientes no canal geral.
2. Verifique sinal e alcance: erro e disponibilidade da API, jobs de backup,
   integridade e idade da última cópia, acesso indevido e impacto clínico.
   `node ops/backup/agenda-backup.mjs check` verifica a cópia mais recente no
   executor configurado; um erro exige investigação, não prova perda de dados.
3. Para atividade HTTP autenticada, um OWNER ou ADMIN da clínica consulta
   `GET /audit-logs?page=1&pageSize=50` e correlaciona horários, clínica,
   ator, ação e resultado com logs de aplicação. A consulta é restrita à própria
   clínica e também é auditada. A trilha não cobre requisições públicas, jobs
   ou eventos fora de HTTP; ausência de registro não descarta um incidente.
4. Classifique provisoriamente como **P1** se houver suspeita de exposição de
   dados clínicos, alteração não autorizada, perda de dados ou atendimento
   indisponível; **P2** para degradação relevante, falha de backup/monitor sem
   evidência de perda ou escopo incerto; **P3** para evento contido sem impacto
   confirmado. Eleve a severidade se surgir evidência nova. O líder registra
   hipótese e grau de confiança, sem afirmar causa antes de verificar.

## 2. Conter e preservar evidências

1. Segurança escolhe a menor contenção eficaz: revogar credenciais/sessões
   suspeitas, isolar integração ou tráfego, suspender gravações no serviço
   afetado, ou retirar o serviço de operação. Registre quem autorizou, horário,
   escopo e risco clínico. Coordene suspensão de atendimento com o responsável
   clínico; não apague dados ou logs para "limpar" o ambiente.
2. Preserve logs de aplicação, eventos relevantes, IDs e horários dos registros
   de auditoria, configuração de implantação e cópias de backup, em armazenamento
   restrito com controle de acesso. Registre origem, coletor e hash dos artefatos
   exportados. A tabela `audit_log` rejeita `UPDATE`, `DELETE` e `TRUNCATE` comuns,
   mas administradores do banco podem desabilitar gatilhos; restrinja esse acesso.
3. Se `check` falhar, suspenda qualquer expurgo/rotação de backups até verificar
   destino, chave e últimas cópias. Não restaure sobre o banco de origem. Se houver
   suspeita de chave comprometida, Segurança coordena rotação e preserva versões
   necessárias à leitura das cópias existentes.

## 3. Comunicar

O líder emite atualização interna no canal restrito na abertura, em cada mudança
de severidade e, para P1, a cada 30 minutos enquanto houver impacto (cadência
proposta). Cada atualização informa horário UTC, impacto conhecido, ações
concluídas, próxima ação/responsável e horário da próxima atualização. Use
"sob investigação" para fatos não confirmados. Produto/suporte prepara texto
para clientes; DPO/Jurídico avaliam se e como comunicar titulares, autoridades e
terceiros. Somente os responsáveis designados enviam comunicação externa após
aprovação. Não divulgar prontuários, segredos ou hipóteses como fatos.

## 4. Recuperar e validar

1. Corrija ou isole a causa antes de religar tráfego. Segurança revisa a
   contenção. Para falha de backup, diagnostique agendamento, armazenamento,
   chave e integridade; só retome limpeza/rotação depois que uma cópia nova e o
   `check` forem válidos.
2. Se for preciso restaurar, siga o ensaio isolado de
   [backup e restauração](backup-restore-runbook.md#ensaio-de-restauracao-isolada):
   selecione cópia com `manifest.json`, configure `BACKUP_PATH`,
   `RESTORE_DATABASE_URL` para banco vazio `restore_*`, `RESTORE_UPLOAD_DIR`
   para diretório vazio `restore-*` e `BACKUP_KEY_FILE`, e execute
   `node ops/backup/agenda-backup.mjs restore`. O operador verifica hash,
   autenticação, contagens, arquivos e fluxos clínicos antes de considerar
   promoção. A promoção ao ambiente real exige plano específico e aprovação
   explícita de DevOps, Segurança e responsável clínico; o script não faz isso.
3. Calcule perda potencial desde o último dump consistente e duração real da
   restauração. As metas de RPO 24 h e RTO 4 h são propostas, não demonstradas
   em produção. O dump do banco e o tar de uploads não são atômicos; reconcilie
   divergências antes da reabertura. Com `STORAGE_TYPE=S3`, o script local não
   cobre o bucket: use o plano de recuperação específico desse armazenamento.
4. Reabra gradualmente após validação de acesso, auditoria, dados clínicos,
   uploads e backup. Líder, Segurança e responsável clínico registram aceite,
   riscos residuais e monitoramento reforçado. Se falhar, volte à contenção.

## 5. Encerrar e aprender

O líder registra horários de detecção, acionamento, contenção, recuperação e
encerramento; impacto confirmado e potencial; causa e evidências; decisões;
comunicações; perda de dados/RPO e duração/RTO; responsáveis, prazos e critérios
de verificação das ações corretivas. Segurança e DPO revisam seus respectivos
aspectos. Faça uma nova simulação após alterar backups, autenticação, auditoria
ou canais de contato. Preserve o registro com acesso restrito segundo a política
aprovada; não invente prazo de retenção para evidências ou dados clínicos.

## Simulação isolada de 2026-09-24

**Cenário:** o `check` do backup falha porque o destino de teste ainda não possui
uma cópia completa. Objetivo: exercitar a detecção e o caminho de decisão sem
usar produção ou dados pessoais. Participante: execução técnica local pelo
agente Codex; os papéis operacionais e os canais reais não participaram.

| Etapa | Evidência ou decisão ensaiada |
| --- | --- |
| Detecção | Rodar `check` contra diretório temporário vazio e chave sintética; esperar saída não zero e `No complete backup found`. Classificar P2 inicialmente. |
| Contenção | Registrar falha; preservar cópias existentes; não ativar expurgo nem iniciar restore no banco de origem. Acionar DevOps e Segurança pelo fluxo acima quando os destinos estiverem configurados. |
| Comunicação | Preparar atualização interna sem dados clínicos; envio real não foi testado porque os contatos/canais não estão definidos. |
| Recuperação | Executar testes sintéticos de backup, `check` e restore isolado; isso valida o mecanismo, sem comprovar recuperação de produção. |
| Encerramento | Registrar resultados abaixo e as pendências para exercício com equipe e infraestrutura reais. |

**Execução e resultado:** foi criado um diretório temporário vazio e uma chave
sintética com permissão `0600`. `node ops/backup/agenda-backup.mjs check`, com
`BACKUP_DIR` apontando para esse diretório e `BACKUP_KEY_FILE` para a chave,
retornou código **1** e `Backup check failed: No complete backup found`, conforme
esperado. `node --test ops/backup/agenda-backup.test.mjs` passou (1 teste),
incluindo backup, verificação, restore em destino isolado e rejeição de cópia
adulterada. `bash ops/backup/restore-smoke.sh` passou com PostgreSQL isolado e
arquivo sintético (`Isolated PostgreSQL and file restore passed.`). A decisão
simulada foi preservar o destino e não restaurar sobre a origem. Esta simulação
técnica não substitui teste de alerta real, chamada de plantão, restore com
volume representativo nem aprovação operacional.

**Atualização interna preparada, não enviada:** “Simulação P2: verificação de
backup falhou por ausência de cópia completa no destino de teste. Impacto em
produção: nenhum, pois o ensaio é isolado. Responsável: líder do incidente em
exercício. Próxima ação: validar restauração sintética e registrar resultado.
Próxima atualização: ao concluir o ensaio.”

## Ativação pendente

- Designar titular e substituto para cada função e cadastrar contatos em cofre
  operacional restrito; preencher acima apenas o identificador do canal, nunca
  número pessoal ou credencial em repositório público.
- Configurar monitor, `BACKUP_ALERT_URL`, agendador e ticket privado; testar
  entrega, chamada de contingência e acesso dos responsáveis.
- Executar exercício com DevOps, Segurança, DPO, Produto e responsável clínico;
  registrar horários, decisões e aprovações. Validar metas e cadências propostas.
- Completar as pendências operacionais do
  [runbook de backup](backup-restore-runbook.md#pendencias-antes-de-concluir-o-cartao).
