import type {ClinicId} from '../clinic/entities';
import type {AppointmentId} from '../appointment/entities';
import type {AppointmentPayment, AppointmentPaymentId, AppointmentPaymentStatus, PaymentMethod} from './entities';

export type AppointmentPaymentSearchFilter = {
    clinicId: ClinicId;
    startDate: Date;
    endDate: Date;
    attendedByMemberId?: string;
    paymentMethod?: PaymentMethod;
    status?: AppointmentPaymentStatus;
};

export interface AppointmentPaymentRepository {
    findById(id: AppointmentPaymentId): Promise<AppointmentPayment | null>;
    findByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentPayment | null>;
    findByAppointmentIds(appointmentIds: AppointmentId[]): Promise<AppointmentPayment[]>;
    save(payment: AppointmentPayment): Promise<void>;
    search(filter: AppointmentPaymentSearchFilter, page: number, pageSize: number): Promise<{data: AppointmentPayment[]; total: number}>;
}

export abstract class AppointmentPaymentRepository {}
