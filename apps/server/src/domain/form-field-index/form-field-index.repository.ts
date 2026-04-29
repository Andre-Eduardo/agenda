import type { AiSpecialtyGroup } from "@domain/form-template/entities";
import type { PatientFormId } from "@domain/patient-form/entities";
import type { FormFieldIndex, FormFieldIndexId } from "@domain/form-field-index/entities";

export type FormFieldIndexFilter = {
  patientFormId?: PatientFormId;
  fieldId?: string;
  specialtyGroup?: AiSpecialtyGroup;
};

export interface FormFieldIndexRepository {
  findById(id: FormFieldIndexId): Promise<FormFieldIndex | null>;
  findByPatientFormAndField(
    patientFormId: PatientFormId,
    fieldId: string,
  ): Promise<FormFieldIndex | null>;
  listByPatientForm(patientFormId: PatientFormId): Promise<FormFieldIndex[]>;
  search(filter: FormFieldIndexFilter): Promise<FormFieldIndex[]>;
  saveMany(entries: FormFieldIndex[]): Promise<void>;
  deleteByPatientForm(patientFormId: PatientFormId): Promise<void>;
}

export abstract class FormFieldIndexRepository {}
