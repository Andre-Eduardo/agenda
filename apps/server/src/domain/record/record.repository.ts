import {PaginatedList, Pagination} from '../@shared/repository';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {AppointmentId} from '../appointment/entities';
import type {Record, RecordId, AttendanceType, ClinicalStatusTag} from './entities';

export type RecordSearchFilter = {
    ids?: RecordId[];
    term?: string;
    patientId?: PatientId;
    professionalId?: ProfessionalId;
    appointmentId?: AppointmentId;
    attendanceType?: AttendanceType;
    clinicalStatus?: ClinicalStatusTag;
    dateStart?: Date;
    dateEnd?: Date;
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
