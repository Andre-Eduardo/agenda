# Especificação Técnica: Schema de Pré-Evolução (OCR/IA)

## 1. Visão Geral
Este documento define o contrato de dados para a "Pré-Evolução" — um estado intermediário onde dados clínicos são extraídos de documentos via OCR e estruturados por IA antes de se tornarem um `Record` definitivo no prontuário.

## 2. Chaves Esperadas da IA (AI Output Contract)
A saída do processamento de IA deve seguir rigorosamente as chaves abaixo para garantir compatibilidade com o domínio `Record`.

| Chave | Tipo | Obrigatoriedade | Descrição |
| :--- | :--- | :--- | :--- |
| `templateType` | Enum | Sim | `SOAP` ou `DAP`. |
| `title` | String | Não | Título sugerido para a consulta. |
| `attendanceType` | Enum | Sim | Categoria do atendimento. |
| `clinicalStatus` | Enum | Não | Tag de estado clínico identificado. |
| `subjective` | String | Opcional* | Texto para campo Subjetivo (S) ou Dados (D). |
| `objective` | String | Opcional* | Texto para campo Objetivo (O). |
| `assessment` | String | Opcional* | Texto para Avaliação (A). |
| `plan` | String | Opcional* | Texto para Plano (P). |
| `freeNotes` | String | Não | Notas gerais ou observações da IA. |
| `eventDate` | ISO8601 | Não | Data da ocorrência extraída do documento. |
| `conductTags` | Enum[] | Não | Lista de tags de conduta sugeridas. |
| `confidence` | Float | Sim | Nível de confiança da IA na estruturação (0.0 a 1.0). |
| `fields` | PreEvolutionField[] | Sim | Detalhamento de campos extraídos individualmente. |

## 3. Flags de Origem e Revisão
Para garantir a rastreabilidade e segurança jurídica, os dados automáticos portam estas marcações:

- **sourceType**: `OCR_IMPORTED` ou `AI_STRUCTURED`.
- **wasHumanEdited**: Boolean (Define se houve alteração manual na sugestão).
- **reviewRequired**: Boolean (Bloqueia a finalização sem conferência).
- **needsReview**: Flag por campo individual para destacar incertezas.
- **confidence**: Float (0.0 a 1.0) para o documento e por campo.

## 4. Enums Válidos
A IA deve utilizar estritamente os valores mapeados no sistema:
- **Template**: `SOAP`, `DAP`.
- **Status Clínico**: `STABLE`, `IMPROVING`, `WORSENING`, `UNCHANGED`, `UNDER_OBSERVATION`.
- **Atendimento**: `FIRST_VISIT`, `FOLLOW_UP`, `EVALUATION`, `PROCEDURE`, `TELEMEDICINE`, `INTERCURRENCE`.
- **Condutas**: `GUIDANCE`, `PRESCRIPTION`, `EXAM_REQUESTED`, `REFERRAL`, `FOLLOW_UP_SCHEDULED`, `THERAPY_ADJUSTMENT`.
- **Status da Pré-Evolução**: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `FAILED`.

## 5. Ciclo de Vida da Pré-Evolução (Status)
O fluxo segue os seguintes estados:
- `DRAFT`: Processamento inicial ou rascunho.
- `PENDING_REVIEW`: Dados prontos para o médico revisar.
- `APPROVED`: Médico validou e o `Record` foi criado.
- `REJECTED`: Médico descartou a sugestão.
- `FAILED`: Falha no processamento de IA/OCR.


## 6. Mapeamento para o Record Final
Após a aprovação do médico:
1. Os campos da pré-evolução alimentam o construtor do `Record`.
2. O `Record.source` é definido como `IMPORT`.
3. O `Record.importedDocumentId` é preenchido para permitir auditoria reversa ao PDF original.
