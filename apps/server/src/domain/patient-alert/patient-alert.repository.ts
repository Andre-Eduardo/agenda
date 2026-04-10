import type {PaginatedList, Pagination} from '../@shared/repository';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {PatientAlert, PatientAlertId} from './entities';

export type PatientAlertSearchFilter = {
    patientId?: PatientId;
    professionalId?: ProfessionalId;
    isActive?: boolean;
};

export type PatientAlertSortOptions = ['createdAt', 'updatedAt', 'severity'];

export interface PatientAlertRepository {
    findById(id: PatientAlertId): Promise<PatientAlert | null>;
    save(alert: PatientAlert): Promise<void>;
    delete(id: PatientAlertId): Promise<void>;
    search(
        pagination: Pagination<PatientAlertSortOptions>,
        filter?: PatientAlertSearchFilter,
    ): Promise<PaginatedList<PatientAlert>>;
}

export abstract class PatientAlertRepository {}
