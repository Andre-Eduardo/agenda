import {PaginatedList, Pagination} from '../@shared/repository';
import type {ClinicId} from '../clinic/entities';
import type {ClinicMemberId} from '../clinic-member/entities';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {AppointmentId} from '../appointment/entities';
import type {Record, RecordId, AttendanceType, ClinicalStatusTag, RecordSource} from './entities';

export type RecordSearchFilter = {
    ids?: RecordId[];
    term?: string;
    clinicId?: ClinicId;
    patientId?: PatientId;
    createdByMemberId?: ClinicMemberId;
    responsibleProfessionalId?: ProfessionalId;
    appointmentId?: AppointmentId;
    attendanceType?: AttendanceType;
    clinicalStatus?: ClinicalStatusTag;
    dateStart?: Date;
    dateEnd?: Date;
    source?: RecordSource;
};

export type RecordSortOptions = [
    'createdAt',
    'updatedAt',
    'eventDate',
];

export interface RecordRepository {
    findById(id: RecordId): Promise<Record | null>;

    delete(id: RecordId): Promise<void>;

    search(
        pagination: Pagination<RecordSortOptions>,
        filter?: RecordSearchFilter
    ): Promise<PaginatedList<Record>>;

    save(record: Record): Promise<void>;
}

export abstract class RecordRepository {}
