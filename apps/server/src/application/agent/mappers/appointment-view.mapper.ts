import type {Appointment} from '../../../domain/appointment/entities';

export type AppointmentView = {
    id: string;
    patientId: string;
    professionalId: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    type: string;
    status: string;
    note: string | null;
    canceledReason: string | null;
};

export function toAppointmentView(a: Appointment): AppointmentView {
    return {
        id: a.id.toString(),
        patientId: a.patientId.toString(),
        professionalId: a.professionalId.toString(),
        startAt: a.startAt.toISOString(),
        endAt: a.endAt.toISOString(),
        durationMinutes: a.durationMinutes,
        type: a.type,
        status: a.status,
        note: a.note,
        canceledReason: a.canceledReason,
    };
}
