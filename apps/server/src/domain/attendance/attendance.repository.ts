import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';

/** Dados da triagem. Todos opcionais: a recepção pode só liberar o paciente. */
export type TriageMeasurements = {
    weightKg: number | null;
    heightCm: number | null;
    systolicPressure: number | null;
    diastolicPressure: number | null;
    heartRate: number | null;
    temperatureCelsius: number | null;
    oxygenSaturation: number | null;
    notes: string | null;
};

export type AppointmentTriage = TriageMeasurements & {
    appointmentId: string;
    releasedAt: Date | null;
    releasedByMemberId: string | null;
    updatedAt: Date;
};

export type AttendanceStatus = 'ARRIVED' | 'IN_PROGRESS';

/** Paciente que chegou (ou está em atendimento), como a fila do profissional e da recepção o mostram. */
export type AttendanceItem = {
    appointmentId: string;
    patientId: string;
    patientName: string;
    attendedByMemberId: string;
    startAt: Date;
    arrivedAt: Date | null;
    calledAt: Date | null;
    status: AttendanceStatus;
    /** Último destino anunciado (ex.: "Sala 3"). */
    destination: string | null;
    callCount: number;
    triageStarted: boolean;
    triageReleasedAt: Date | null;
    /** Sala da consulta ou sala padrão do profissional, para pré-preencher a chamada. */
    suggestedDestination: string | null;
};

export type AttendanceFilter = {
    /** null = todas as agendas da clínica. */
    attendedByMemberIds: ClinicMemberId[] | null;
    from: Date;
    to: Date;
};

export interface AttendanceRepository {
    list(clinicId: ClinicId, filter: AttendanceFilter): Promise<AttendanceItem[]>;
    findTriage(clinicId: ClinicId, appointmentId: AppointmentId): Promise<AppointmentTriage | null>;
    saveTriage(
        clinicId: ClinicId,
        appointmentId: AppointmentId,
        actorMemberId: ClinicMemberId,
        measurements: TriageMeasurements,
        release: boolean
    ): Promise<AppointmentTriage>;
    /** Sala da consulta ou sala padrão do profissional. */
    suggestedDestination(clinicId: ClinicId, appointmentId: AppointmentId): Promise<string | null>;
}

export const AttendanceRepository = Symbol('AttendanceRepository');
