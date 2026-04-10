# Diagnóstico do Record e Proposta de Extensão

## 1. Análise da Estrutura Atual
O model `Record` (Prisma) é o registro oficial de evolução clínica. Ele suporta:
- Templates estruturados (SOAP, DAP).
- Metadados clínicos (`attendanceType`, `clinicalStatus`, `conductTags`).
- Associações com `Patient`, `Professional` e `Appointment`.
- Anexos através do model `File`.

## 2. Necessidade de Adaptação
Para suportar o fluxo de importação documental via OCR e IA, o `Record` precisa identificar sua procedência para fins de auditoria e segurança jurídica.

## 3. Decisão: Extensão do Record
Não criaremos uma nova tabela de evolução final. O `Record` continuará sendo o registro oficial, enriquecido com os seguintes campos de metadados de origem:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `source` | `RecordSource` (Enum) | Identifica se a origem foi `MANUAL` ou `IMPORT`. |
| `importedDocumentId` | `UUID?` | Referência opcional para o documento importado original. |
| `wasHumanEdited` | `Boolean` | Indica se houve alteração manual na sugestão da IA. |

## 4. Conclusão
Esta abordagem mantém o `Record` como a única fonte de verdade para o prontuário, garantindo rastreabilidade total até o documento original (foto/PDF) e transparência sobre o uso de IA no processo de estruturação.
