# Diagnóstico do Model Record e Proposta de Extensão

## Análise da Estrutura Atual
O model `Record` (Prisma) e a entidade `Record` (Domínio) estão bem estruturados para evoluções clínicas, suportando templates SOAP/DAP e anexos. No entanto, para suportar a nova feature de importação documental, faltam metadados de procedência e auditoria.

## Decisões de Extensão

Para garantir que o `Record` continue sendo a evolução oficial, mas com total rastreabilidade, as seguintes alterações serão aplicadas ao `Record`:

1. **`source` (Enum `RecordSource`)**: Identifica se a evolução foi criada manualmente (`MANUAL`) ou via processo de importação (`IMPORT`). Padrão: `MANUAL`.
2. **`importedDocumentId` (UUID)**: Chave estrangeira opcional para a entidade `ImportedDocument`, permitindo rastreabilidade bidirecional.
3. **`wasHumanEdited` (Boolean)**: Indica se o médico alterou os campos sugeridos pela IA durante a revisão. Crucial para segurança jurídica e melhoria do modelo de IA.

## Conclusão
O `Record` permanece como o registro oficial de evolução (Fonte da Verdade). A inclusão desses metadados não altera o fluxo clínico existente, apenas enriquece o histórico com informações de origem e confiabilidade dos dados importados.
