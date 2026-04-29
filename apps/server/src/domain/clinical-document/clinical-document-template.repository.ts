import type { ClinicId } from "@domain/clinic/entities";
import type {
  ClinicalDocumentTemplate,
  ClinicalDocumentTemplateId,
  ClinicalDocumentType,
} from "@domain/clinical-document/entities";

export interface ClinicalDocumentTemplateRepository {
  findById(id: ClinicalDocumentTemplateId): Promise<ClinicalDocumentTemplate | null>;
  findByClinicAndType(
    clinicId: ClinicId,
    type: ClinicalDocumentType,
  ): Promise<ClinicalDocumentTemplate | null>;
  findDefaultByType(type: ClinicalDocumentType): Promise<ClinicalDocumentTemplate | null>;
  findAllByClinic(clinicId: ClinicId): Promise<ClinicalDocumentTemplate[]>;
  save(template: ClinicalDocumentTemplate): Promise<void>;
}

export abstract class ClinicalDocumentTemplateRepository {}
