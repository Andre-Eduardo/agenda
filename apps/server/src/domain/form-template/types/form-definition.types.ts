/**
 * JSON contract for FormTemplateVersion.definitionJson
 * Stored in JSONB. Every field must have a stable `id` — never rely on label alone.
 */

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "boolean"
  | "file"
  | "score"
  | "computed";

export type FormFieldOption = {
  value: string;
  label: string;
  score?: number;
};

export type FormFieldCondition = {
  /** The fieldId that triggers this condition */
  fieldId: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in";
  value: unknown;
};

export type FormFieldValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
};

export type ScoringRule = {
  id: string;
  label: string;
  ranges: Array<{
    min: number;
    max: number;
    classification: string;
    flag?: string;
  }>;
};

export type FormFieldDefinition = {
  id: string;
  type: FormFieldType;
  label: string;
  order: number;
  placeholder?: string;
  required?: boolean;
  unit?: string;
  options?: FormFieldOption[];
  repeatable?: boolean;
  showIf?: FormFieldCondition;
  validation?: FormFieldValidation;
  scoring?: {
    weight?: number;
    reverseScore?: boolean;
  };
  ui?: {
    width?: "full" | "half" | "third";
    hint?: string;
    tooltip?: string;
  };
};

export type FormSectionDefinition = {
  id: string;
  label: string;
  order: number;
  description?: string;
  repeatable?: boolean;
  fields: FormFieldDefinition[];
};

export type FormDefinitionJson = {
  id: string;
  name: string;
  specialty: string;
  category?: string;
  sections: FormSectionDefinition[];
  scoring?: {
    enabled: boolean;
    totalFieldId?: string;
    rules?: ScoringRule[];
  };
  metadata?: Record<string, unknown>;
};
