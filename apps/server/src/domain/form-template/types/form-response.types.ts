/**
 * JSON contract for PatientForm.responseJson and PatientForm.computedJson
 * Stored in JSONB. Answers are keyed by stable fieldId.
 */

export type FormAnswer = {
  fieldId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueJson?: unknown;
};

export type FormResponseJson = {
  answers: FormAnswer[];
};

export type FormComputedScore = {
  fieldId: string;
  label: string;
  value: number;
  classification?: string;
  flag?: string;
};

export type FormComputedJson = {
  totalScore?: number;
  classification?: string;
  flags?: string[];
  scores?: FormComputedScore[];
  notes?: string;
  metadata?: Record<string, unknown>;
};
