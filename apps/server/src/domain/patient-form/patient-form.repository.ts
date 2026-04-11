import type {PaginatedList, Pagination} from '../@shared/repository';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {FormTemplateId} from '../form-template/entities';
import type {Specialty} from '../form-template/entities';
import type {PatientForm, PatientFormId, FormResponseStatus} from './entities';

export type PatientFormFilter = {
    patientId?: PatientId;
    professionalId?: ProfessionalId;
    templateId?: FormTemplateId;
    status?: FormResponseStatus;
    specialty?: Specialty;
};

export type PatientFormSortOptions = ['appliedAt', 'createdAt', 'updatedAt', 'completedAt'];

export interface PatientFormRepository {
    findById(id: PatientFormId): Promise<PatientForm | null>;
    save(form: PatientForm): Promise<void>;
    search(
        pagination: Pagination<PatientFormSortOptions>,
        filter?: PatientFormFilter,
    ): Promise<PaginatedList<PatientForm>>;
}

export abstract class PatientFormRepository {}
