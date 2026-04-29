import type { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type {
  ClinicalDocument,
  ClinicalDocumentId,
  ClinicalDocumentStatus,
  ClinicalDocumentType,
} from "@domain/clinical-document/entities";

export type ClinicalDocumentSearchFilter = {
  clinicId?: ClinicId;
  patientId?: PatientId;
  type?: ClinicalDocumentType;
  status?: ClinicalDocumentStatus;
};

export type ClinicalDocumentSortOptions = ["createdAt", "updatedAt", "generatedAt"];

export type GeneratedFileData = {
  fileName: string;
  url: string;
  patientId: PatientId;
  clinicId: ClinicId;
  createdByMemberId: ClinicMemberId;
  description: string;
};

export interface ClinicalDocumentRepository {
  findById(id: ClinicalDocumentId): Promise<ClinicalDocument | null>;
  search(
    pagination: Pagination<ClinicalDocumentSortOptions>,
    filter?: ClinicalDocumentSearchFilter,
  ): Promise<PaginatedList<ClinicalDocument>>;
  save(document: ClinicalDocument): Promise<void>;
  /** Saves the File record and updates the ClinicalDocument with the fileId atomically. */
  saveWithGeneratedFile(document: ClinicalDocument, fileData: GeneratedFileData): Promise<string>;
}

export abstract class ClinicalDocumentRepository {}
