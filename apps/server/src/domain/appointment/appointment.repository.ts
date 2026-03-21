import { PaginatedList, Pagination } from '../@shared/repository';
import type {Appointment, AppointmentId} from './entities';

export type AppointmentSearchFilter = {
    ids?: AppointmentId[];
    term?: string;
};

export type AppointmentSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface AppointmentRepository {
    findById(id: AppointmentId): Promise<Appointment | null>;

    delete(id: AppointmentId): Promise<void>;

    search(
        pagination: Pagination<AppointmentSortOptions>,
        filter?: AppointmentSearchFilter
    ): Promise<PaginatedList<Appointment>>;

    save(appointment: Appointment): Promise<void>;
}

export abstract class AppointmentRepository {}
