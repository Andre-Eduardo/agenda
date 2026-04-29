import type { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { FormTemplate, FormTemplateId } from "@domain/form-template/entities";

export type FormTemplateFilter = {
  specialtyLabel?: string;
  isPublic?: boolean;
  clinicId?: ClinicId | null;
  createdByMemberId?: ClinicMemberId | null;
  includeDeleted?: boolean;
};

export type FormTemplateSortOptions = ["createdAt", "updatedAt", "name"];

export interface FormTemplateRepository {
  findById(id: FormTemplateId): Promise<FormTemplate | null>;
  findByCode(code: string): Promise<FormTemplate | null>;
  save(template: FormTemplate): Promise<void>;
  search(
    pagination: Pagination<FormTemplateSortOptions>,
    filter?: FormTemplateFilter,
  ): Promise<PaginatedList<FormTemplate>>;
}

export abstract class FormTemplateRepository {}
