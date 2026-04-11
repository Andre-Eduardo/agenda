import type {PaginatedList, Pagination} from '../@shared/repository';
import type {ProfessionalId} from '../professional/entities';
import type {FormTemplate, FormTemplateId, Specialty} from './entities';

export type FormTemplateFilter = {
    specialty?: Specialty;
    isPublic?: boolean;
    professionalId?: ProfessionalId | null;
    includeDeleted?: boolean;
};

export type FormTemplateSortOptions = ['createdAt', 'updatedAt', 'name'];

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
