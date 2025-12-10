import {Appointment, AppointmentId} from './entities';

export interface AppointmentRepository {
    findById(id: AppointmentId): Promise<Appointment | null>;

    delete(id: AppointmentId): Promise<void>;
}

export abstract class AppointmentRepository {}
