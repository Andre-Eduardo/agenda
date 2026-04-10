# Diagnóstico do Model Record e Proposta de Extensão

## Análise da Estrutura Atual
O model `Record` (Prisma) é a entidade central para evoluções clínicas. Ele suporta:
- Templates estruturados (SOAP, DAP).
- Metadados clínicos (`attendanceType`, `clinicalStatus`, `conductTags`).
- Associações com `Patient`, `Professional` e `Appointment`.
- Anexos através do model `File`.

## Decisões sobre Extensão do Record
Para garantir que o `Record` continue sendo a evolução oficial, mas com total rastreabilidade desde a origem documental, as seguintes alterações serão aplicadas:

1. **`source` (Enum `RecordSource`)**: Identifica se a evolução foi criada manualmente (`MANUAL`) ou via processo de importação (`IMPORT`).
2. **`importedDocumentId` (UUID)**: Chave estrangeira opcional para a entidade `ImportedDocument`, permitindo rastreabilidade bidirecional.
3. **`wasHumanEdited` (Boolean)**: Indica se o médico alterou os campos sugeridos pela IA durante a revisão. Crucial para segurança jurídica e melhoria do modelo de IA.

## Conclusão
O `Record` permanece como o registro oficial de evolução. A inclusão desses metadados não altera o fluxo clínico existente, apenas enriquece o histórico com informações de origem e confiabilidade dos dados importados.
