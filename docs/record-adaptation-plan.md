# Diagnóstico e Plano de Adaptação do Record

## Objetivo
Adaptar o modelo `Record` para suportar a rastreabilidade de evoluções geradas a partir de documentos importados (OCR/IA).

## Situação Atual
O modelo `Record` armazena dados clínicos estruturados (SOAP/DAP) e notas livres, mas não diferencia a origem da criação (se foi digitado manualmente ou importado).

## Proposta de Extensão Mínima

### Campos a Adicionar ao `Record`
- **source**: Enum (`MANUAL`, `IMPORT`). Padrão: `MANUAL`.
- **importedDocumentId**: UUID (Opcional). Relacionamento com a nova entidade `ImportedDocument`.
- **wasHumanEdited**: Boolean. Indica se o médico alterou os campos sugeridos pela IA durante a revisão.

### Justificativa
- **Segurança Jurídica**: É fundamental saber se um texto foi gerado por IA e se o médico o validou integralmente ou fez correções.
- **Rastreabilidade**: Permite navegar do prontuário oficial de volta ao documento original (PDF/Foto) que o originou.

## Conclusão
O `Record` continuará sendo a única fonte da verdade para a evolução clínica. As novas entidades de importação servirão apenas como estágio temporário e auditoria.
