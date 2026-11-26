import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';

export type PatientCallIdentity = {
    title: string;
    message: string;
    foregroundColor: string;
    backgroundColor: string;
    useClinicLogo: boolean;
    soundEnabled: boolean;
    displaySeconds: number;
};

export const defaultPatientCallIdentity: PatientCallIdentity = {
    title: 'Painel de chamada',
    message: 'Dirija-se ao local indicado',
    foregroundColor: '#FFFFFF',
    backgroundColor: '#17324D',
    useClinicLogo: true,
    soundEnabled: false,
    displaySeconds: 15,
};

export type PatientCallPanel = PatientCallIdentity & {
    enabled: boolean;
    publicToken: string | null;
    clinicLogoUrl: string | null;
};

export type PatientCallEntry = {
    appointmentId: string;
    code: string;
    arrivedAt: Date;
    callCount: number;
    destination: string | null;
};

export type PatientCallQueueItem = PatientCallEntry & {patientName: string};

export type PublicPatientCall = {
    code: string;
    destination: string;
    expiresAt: Date;
};

export type PublicPatientCallPanel = Omit<PatientCallIdentity, 'useClinicLogo' | 'displaySeconds'> & {
    logoUrl: string | null;
    call: PublicPatientCall | null;
};

export interface PatientCallRepository {
    isEnabled(clinicId: ClinicId): Promise<boolean>;
    getPanel(clinicId: ClinicId): Promise<PatientCallPanel>;
    savePanel(clinicId: ClinicId, identity: PatientCallIdentity): Promise<PatientCallPanel>;
    publishPanel(clinicId: ClinicId): Promise<PatientCallPanel>;
    revokePanel(clinicId: ClinicId): Promise<PatientCallPanel>;
    getPublicPanel(token: string): Promise<PublicPatientCallPanel | null>;
    listQueue(clinicId: ClinicId, patientIds: PatientId[] | null): Promise<PatientCallQueueItem[]>;
    lockAppointment(clinicId: ClinicId, appointmentId: AppointmentId): Promise<void>;
    joinQueue(clinicId: ClinicId, appointmentId: AppointmentId, arrivedAt: Date): Promise<string | null>;
    findEntry(clinicId: ClinicId, appointmentId: AppointmentId): Promise<PatientCallEntry | null>;
    announce(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        destination: string
    ): Promise<PatientCallEntry>;
    remove(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        reason: string
    ): Promise<void>;
}

export const PatientCallRepository = Symbol('PatientCallRepository');
