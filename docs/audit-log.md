# Trilha de auditoria HTTP — L3-02

Cada operação HTTP autenticada em uma clínica grava uma linha em `audit_log` antes
de enviar a resposta. Isso inclui consultas, criação, alteração, exclusão lógica,
geração/exportação e acesso a dados clínicos. A trilha cobre também falhas do
handler e recusas de permissão pelo `AuthGuard` quando o token identifica um
membro ativo da clínica. Requisições públicas e sem vínculo de clínica não
geram entrada nessa tabela.

O registro contém clínica, usuário, membro, nome do controller, método e
handler, ID do recurso quando disponível, resultado (`SUCCESS`, `DENIED` ou
`ERROR`), status HTTP, IP e horário gravado pelo banco. Corpo da requisição,
resposta, parâmetros de busca e conteúdo clínico não são armazenados. Em uma
criação sem ID de rota, o ID retornado pelo handler é registrado quando existe.

`GET /audit-logs?page=1&pageSize=50` consulta somente a clínica do membro
autenticado, em ordem cronológica decrescente. `pageSize` é limitado a 100.
A permissão `audit-log:view` pertence apenas a OWNER e ADMIN; o cliente não
escolhe a clínica. A leitura do próprio log também gera uma entrada.

A migração `20260924140000_immutable_audit_log` cria gatilhos PostgreSQL que
rejeitam `UPDATE`, `DELETE` e `TRUNCATE`. A aplicação só usa `INSERT` e `SELECT`.
Um administrador de banco com poder de desabilitar gatilhos ainda pode alterar
a tabela; proteja credenciais e restrinja esse acesso na operação. A política de
retenção, backups e restauração segue `docs/backup-restore-runbook.md`.

Operações fora de HTTP, como jobs e eventos de domínio, continuam com seus
registros próprios; esta tabela representa a atividade HTTP autenticada. Para
investigar falhas, filtre por clínica e horário e correlacione com logs de
aplicação. Nunca copie conteúdo clínico ou credenciais para a trilha.
