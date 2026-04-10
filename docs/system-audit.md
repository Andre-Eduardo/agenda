# Auditoria do Sistema - Agenda

## Objetivo
Mapear a estrutura existente relacionada a pacientes, prontuários, arquivos e agendamentos para subsidiar a criação de novas funcionalidades.

## 1. Modelos de Dados (Prisma Schema)

### Paciente e Profissional
- **Patient**: Armazena dados básicos, vinculado a uma `Person`. Possui relação com `Professional`, `Appointment`, `Record`, `ClinicalProfile`, `PatientAlert` e `File`.
- **Professional**: Vinculado a um `User` e uma `Person`. É o dono do escopo dos dados (pacientes, agendamentos, etc).
- **Person**: Tabela base para dados pessoais (nome, documento, telefone, gênero).

### Prontuário e Evolução
- **Record**: Centraliza as evoluções. 
  - **Formatos**: Suporta SOAP (Subjective, Objective, Assessment, Plan), DAP e Notas Livres.
  - **Metadados**: `attendanceType` (tipo de atendimento), `clinicalStatus` (status clínico), `conductTags` (tags de conduta).
  - **Vínculos**: Associado a um `Patient`, `Professional` e opcionalmente a um `Appointment`.
- **ClinicalProfile**: Resumo clínico permanente do paciente (alergias, condições crônicas, medicamentos, históricos).
- **PatientAlert**: Alertas críticos exibidos para o paciente (ex: alergias graves).

### Arquivos e Upload
- **File**: Registro de arquivo final vinculado a um `Record` ou `Patient`. Contém `url`, `fileName` e `description`.
- **UploadFile**: Gerencia o estado temporário do upload (`PENDING`, `READY`, `FAILED`).

## 2. Sistema de Arquivos e Armazenamento
- **Implementação**: Localizada em `infrastructure/storage`.
- **Drivers**: Suporte para `local-file` e `S3` (AWS).
- **Fluxo de Upload**:
  1. `PrepareUploadService`: Reserva o espaço e gera URL/caminho temporário.
  2. `PromoteFileService`: Move o arquivo do temporário para o destino final e cria o registro definitivo.

## 3. Autenticação e Escopo
- **Mecanismo**: `AuthGuard` via Cookies.
- **Identificadores**: `userId` (usuário autenticado) e `professionalId` (contexto de atendimento).
- **Segurança**: O `professionalId` é essencial para filtrar pacientes e registros, garantindo o isolamento de dados.

## 4. Enums e Tags Disponíveis
- **Template**: `SOAP`, `DAP`.
- **Tipo de Atendimento**: `FIRST_VISIT`, `FOLLOW_UP`, `EVALUATION`, `PROCEDURE`, `TELEMEDICINE`, `INTERCURRENCE`.
- **Status Clínico**: `STABLE`, `IMPROVING`, `WORSENING`, `UNCHANGED`, `UNDER_OBSERVATION`.
- **Tags de Conduta**: `GUIDANCE`, `PRESCRIPTION`, `EXAM_REQUESTED`, `REFERRAL`, `FOLLOW_UP_SCHEDULED`, `THERAPY_ADJUSTMENT`.
- **Status de Agendamento**: `SCHEDULED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.

## 5. Análise de Reaproveitamento

| Componente | Status | Ação |
| :--- | :--- | :--- |
| **Upload de Arquivos** | ✅ Completo | Utilizar `PrepareUpload` e `PromoteFile`. |
| **Evoluções (SOAP)** | ✅ Completo | Reaproveitar o modelo `Record`. |
| **Perfil Clínico** | ✅ Completo | Utilizar para exibir o "header" de saúde do paciente. |
| **Integração S3** | ✅ Disponível | Já configurado via envs e driver de infraestrutura. |
| **Controle de Acesso** | ✅ Robusto | Seguir o padrão de `actor` e `professionalId`. |

## 6. Considerações
A estrutura atual é extensível e segue padrões de DDD e Clean Architecture. Não há necessidade de criar novas tabelas para "Evoluções" ou "Histórico", pois o modelo `Record` já cobre esses casos de uso de forma genérica e estruturada.
