import type {PaginatedList, Pagination} from '../@shared/repository';
import type {ClinicId} from '../clinic/entities';
import type {ClinicMemberId} from '../clinic-member/entities';
import type {PatientId} from '../patient/entities';
import type {PatientAlert, PatientAlertId} from './entities';

export type PatientAlertSearchFilter = {
    clinicId?: ClinicId;
    patientId?: PatientId;
    createdByMemberId?: ClinicMemberId;
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
