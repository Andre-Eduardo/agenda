# Diagnóstico do Record e Proposta de Extensão

## 1. Análise da Estrutura Atual
O modelo `Record` atual suporta:
- Estrutura clínica (SOAP/DAP).
- Metadados (Tipo de atendimento, Status clínico, Tags de conduta).
- Vínculos (Paciente, Profissional, Agendamento).
- Anexos (Arquivos).

## 2. Lacunas para Importação Documental
Para suportar o novo fluxo de importação por OCR/IA, o `Record` carece de:
- **Identificação de Origem**: Distinguir entre evolução manual e importada.
- **Rastreabilidade**: Link para o documento original que gerou a evolução.
- **Indicador de Edição**: Saber se o médico alterou a sugestão da IA para fins de auditoria e melhoria do modelo.

## 3. Proposta de Extensão Mínima
Manteremos o `Record` como a única fonte de verdade para evoluções oficiais, adicionando apenas:

- `source`: Enum `RecordSource` (`MANUAL`, `IMPORT`). Padrão: `MANUAL`.
- `importedDocumentId`: UUID (opcional) ligando ao `ImportedDocument`.
- `wasHumanEdited`: Boolean. Padrão: `false`. Indica se houve intervenção humana no texto sugerido.

## 4. Conclusão
O `Record` continuará sendo a evolução oficial do sistema, apenas enriquecido com metadados que garantem a segurança jurídica e a rastreabilidade da origem documental.
