import type {PaginatedList, Pagination} from '../@shared/repository';
import type {ClinicId} from '../clinic/entities';
import type {ClinicMemberId} from '../clinic-member/entities';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {FormTemplateId, AiSpecialtyGroup} from '../form-template/entities';
import type {PatientForm, PatientFormId, FormResponseStatus} from './entities';

export type PatientFormFilter = {
    clinicId?: ClinicId;
    patientId?: PatientId;
    createdByMemberId?: ClinicMemberId;
    responsibleProfessionalId?: ProfessionalId;
    templateId?: FormTemplateId;
    status?: FormResponseStatus;
    specialty?: AiSpecialtyGroup;
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
