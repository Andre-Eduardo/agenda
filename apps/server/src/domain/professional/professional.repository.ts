import type { ClinicMemberId } from "@domain/clinic-member/entities";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { Professional, ProfessionalId } from "@domain/professional/entities";

export type ProfessionalSearchFilter = {
  ids?: ProfessionalId[];
  clinicMemberId?: ClinicMemberId;
  term?: string;
};

export type ProfessionalSortOptions = ["createdAt", "updatedAt"];

export interface ProfessionalRepository {
  findById(id: ProfessionalId): Promise<Professional | null>;
  findByClinicMemberId(clinicMemberId: ClinicMemberId): Promise<Professional | null>;

  delete(id: ProfessionalId): Promise<void>;

  search(
    pagination: Pagination<ProfessionalSortOptions>,
    filter?: ProfessionalSearchFilter,
  ): Promise<PaginatedList<Professional>>;

  save(professional: Professional): Promise<void>;
}

export abstract class ProfessionalRepository {}
