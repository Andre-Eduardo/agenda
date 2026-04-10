# Diagnóstico e Proposta de Extensão: Model Record

## Status Atual
O modelo `Record` é a entidade central para evoluções clínicas. Ele suporta múltiplos formatos (SOAP, DAP, Notas Livres) e possui associações robustas com pacientes e profissionais. Contudo, não diferencia a origem do dado (se foi digitado manualmente ou importado via OCR/IA).

## Proposta de Extensão Mínima
Para garantir a rastreabilidade sem inflar o modelo oficial, propomos a adição de três campos de metadados:

1. **source**: Enum `RecordSource` (`MANUAL`, `IMPORT`). Indica se a evolução nasceu de um documento digitalizado ou entrada direta.
2. **importedDocumentId**: Vínculo (Foreign Key) com a entidade de processamento intermediário. Permite auditar o texto original do OCR se necessário.
3. **wasHumanEdited**: Flag booleana. Indica se o conteúdo estruturado pela IA sofreu qualquer alteração manual durante a fase de revisão.

## Conclusão
O `Record` continuará sendo a única fonte de verdade para a evolução oficial. As novas entidades de importação (`ImportedDocument`, `ExtractedField`) servirão apenas como "esteira de produção", sendo descartáveis ou arquiváveis após a consolidação no `Record`.
