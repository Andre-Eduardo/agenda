/**
 * Tipo de entidade alvo de uma permissão por documento.
 * Modelo polimórfico: a FK não é formal — a integridade
 * é garantida pela aplicação.
 */
export enum DocumentEntityType {
  RECORD = "RECORD",
  FILE = "FILE",
  IMPORTED_DOCUMENT = "IMPORTED_DOCUMENT",
  PATIENT_FORM = "PATIENT_FORM",
  CLINICAL_PROFILE = "CLINICAL_PROFILE",
  PATIENT_ALERT = "PATIENT_ALERT",
}
