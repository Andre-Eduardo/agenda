# Backup e restauração — L3-03

**Estado:** procedimento e automação preparados; hospedagem, destino externo,
agenda de execução e aprovação operacional ainda não definidos. Não há evidência
de backup de produção. O teste abaixo usa apenas dados sintéticos.

## Escopo e metas propostas

O banco é PostgreSQL (`DATABASE_URL`); com `STORAGE_TYPE=LOCAL`, os uploads e PDFs
ficam em `LOCAL_UPLOAD_DIR` (padrão `./uploads`). O script
[`agenda-backup.mjs`](../ops/backup/agenda-backup.mjs) cria um dump customizado
com `pg_dump -Fc` e um tar dos arquivos locais. Ambos são cifrados em fluxo com
AES-256-GCM e uma chave externa ao repositório. O manifesto registra data, tamanho
e SHA-256 dos arquivos cifrados. `check` valida idade, hash e autenticação GCM.

| Meta proposta | Valor | Condição para assumir compromisso |
| --- | --- | --- |
| Intervalo de backup / RPO máximo | 24 h | Job diário e alerta testados em produção; aceitar perda de alterações desde o último dump. |
| Limite de idade para alerta | 26 h | Rodar `check` a cada hora e enviar falhas ao monitor operacional. |
| RTO | 4 h | Medir restore completo com volume representativo em homologação; não foi demonstrado. |
| Retenção sugerida | 30 dias, mínimo de 2 cópias | Aprovação de operação e DPO; configurar `BACKUP_RETENTION_DAYS` só após essa decisão. |
| Ensaio de restauração | mensal e após mudanças de banco/storage | Registrar duração, integridade e aceite do responsável. |

`pg_dump` produz um retrato consistente do banco, mas **não fornece recuperação
para qualquer instante**. RPO menor que o intervalo de dumps exige backup físico
e arquivamento WAL/PITR. Além disso, o dump do banco e o tar de uploads não são
um snapshot atômico conjunto. Até haver snapshots coordenados, executar o job
em janela sem gravações/upload. [PostgreSQL: pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html),
[PostgreSQL: PITR](https://www.postgresql.org/docs/16/continuous-archiving.html).

O fluxo cobre armazenamento **local**. Quando `STORAGE_TYPE=S3`, o comando
recusa executar: será necessário configurar versionamento, replicação/cópia,
criptografia, retenção e teste de restore do bucket antes de considerá-lo
coberto. Retenção de backups é distinta da retenção de prontuários e outros dados
clínicos; essa última depende da política jurídica e do inventário LGPD.

## Preparação da operação

Instalar Node.js 24, `pg_dump` e `pg_restore` compatíveis com o PostgreSQL do
ambiente, `tar` e um destino externo montado **fora do host/banco principal**.
O caminho do destino (`BACKUP_DIR`) já deve existir, com permissão `0700`.
O processo precisa de usuário PostgreSQL com leitura de todos os objetos a
recuperar. Proteger transporte e destino com TLS e criptografia do provedor;
restringir IAM e habilitar imutabilidade/versionamento no destino escolhido.

Gerar uma chave aleatória de 32 bytes, em hexadecimal, por gerenciador de
segredos. Entregá-la em `BACKUP_KEY_FILE`, arquivo regular `0600`, fora de
`LOCAL_UPLOAD_DIR`, do repositório e do próprio backup. Guardar versões antigas
da chave enquanto os respectivos backups existirem. Perda da chave impede
restauração; rotação exige ensaio de restore com a chave nova e as antigas.
O script não imprime credenciais nem dados clínicos; o webhook de alerta recebe
somente serviço, comando, status e horário.

Variáveis exigidas para `backup`:

| Variável | Conteúdo |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL do banco de origem, obtida do gerenciador de segredos. |
| `LOCAL_UPLOAD_DIR` | Diretório de arquivos locais da aplicação. |
| `BACKUP_DIR` | Diretório absoluto de destino, existente e `0700`; não pode ficar dentro dos uploads. |
| `BACKUP_KEY_FILE` | Caminho da chave de 32 bytes em hexadecimal, arquivo `0600`. |

Opcionais: `BACKUP_MAX_AGE_HOURS` (padrão 26),
`BACKUP_RETENTION_DAYS` (sem limpeza se ausente) e `BACKUP_ALERT_URL` (webhook
HTTP para falhas; resposta fora de 2xx também é erro). `PG_DUMP_BIN` e
`PG_RESTORE_BIN` permitem indicar o caminho dos binários. O script passa os dados
de conexão ao PostgreSQL via variáveis `PG*`, evitando senha na linha de comando.

## Execução e monitoramento

Instalar a automação no executor de backup, com um arquivo de ambiente privado
fornecido pelo gerenciador de segredos, e agendar:

```sh
node /opt/agenda/ops/backup/agenda-backup.mjs backup  # diariamente às 02:00 UTC
node /opt/agenda/ops/backup/agenda-backup.mjs check   # a cada hora
```

Cada execução sai com código diferente de zero se falhar. O agendador deve
registrar esse código, alertar a equipe de plantão e garantir que `check` continue
rodando mesmo se `backup` falhar. Configurar também `BACKUP_ALERT_URL` para um
webhook do monitor escolhido. Monitorar espaço livre, integridade do destino,
entrega do alerta e último ensaio de restore. Simular falha do job e do webhook
antes de ativar o serviço. O arquivo `manifest.json` só aparece depois que os
componentes foram gerados e verificados; cópias incompletas são removidas.
Quando a retenção for aprovada, o script elimina apenas diretórios próprios
com manifesto válido mais antigos que o prazo, preservando sempre os dois mais
recentes. Imutabilidade e retenção externas devem ser configuradas no destino.

## Ensaio de restauração isolada

1. Provisionar PostgreSQL separado, com a mesma versão principal e extensões
   necessárias, e criar um banco **vazio** cujo nome começa por `restore_`.
   Provisionar também um diretório absoluto, vazio, cujo nome começa por
   `restore-` para os uploads. Bloquear acesso público ao ambiente de ensaio.
2. Selecionar uma cópia com `manifest.json` e fornecer `BACKUP_PATH`,
   `RESTORE_DATABASE_URL`, `RESTORE_UPLOAD_DIR` e `BACKUP_KEY_FILE`.
3. Executar `node ops/backup/agenda-backup.mjs restore`. O comando confere
   tamanho, SHA-256 e autenticação GCM **antes** de transmitir o dump ao
   `pg_restore --single-transaction` e de extrair os arquivos; nenhum dump
   descriptografado é gravado em disco. Ele recusa banco de origem ou banco sem
   prefixo `restore_`.
4. Verificar tabelas, contagens amostrais, integridade de arquivos e fluxos
   clínicos com dados sintéticos ou dados de produção protegidos segundo a
   política de acesso. Registrar início/fim, duração, versão do banco, cópia
   usada, erros e aceite de DevOps/segurança. Destruir o ambiente isolado após
   aprovação do registro.

Teste automatizado reproduzível, sem dados reais:

```sh
node --test ops/backup/agenda-backup.test.mjs
bash ops/backup/restore-smoke.sh
```

O segundo teste usa `pgvector/pgvector:pg16` em contêiner isolado, restaura uma
tabela e um arquivo sintéticos e remove o contêiner ao terminar. Ele passou em
2026-09-23 no ambiente de desenvolvimento; **não mede o RTO de produção nem
substitui aprovação de DevOps**.

## Pendências antes de concluir o cartão

- Definir provedor/região, destino externo imutável, redundância e responsável
  operacional; registrar no inventário LGPD.
- Aprovar RPO, RTO, retenção, acesso à chave e calendário de ensaios com
  operação e DPO.
- Implantar os jobs, ligar alerta real, provar falha e recuperação e medir
  restore com volume representativo em homologação.
