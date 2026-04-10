import {PaginatedList, Pagination} from '../@shared/repository';
import type {Appointment, AppointmentId, AppointmentStatus} from './entities';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';

export type AppointmentSearchFilter = {
    ids?: AppointmentId[];
    term?: string;
    professionalId?: ProfessionalId;
    patientId?: PatientId;
    status?: AppointmentStatus[];
    dateFrom?: Date;
    dateTo?: Date;
};

export type AppointmentSortOptions = [
    'createdAt',
    'updatedAt',
    'startAt',
];

export interface AppointmentRepository {
    findById(id: AppointmentId): Promise<Appointment | null>;

    delete(id: AppointmentId): Promise<void>;

    search(
        pagination: Pagination<AppointmentSortOptions>,
        filter?: AppointmentSearchFilter
    ): Promise<PaginatedList<Appointment>>;

    save(appointment: Appointment): Promise<void>;

    findConflicts(
        professionalId: ProfessionalId,
        startAt: Date,
        endAt: Date,
        excludeId?: AppointmentId
    ): Promise<Appointment[]>;
}

export abstract class AppointmentRepository {}
