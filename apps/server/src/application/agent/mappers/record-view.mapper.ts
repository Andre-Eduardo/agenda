import type {Record} from '../../../domain/record/entities';

export type RecordView = {
    id: string;
    clinicId: string;
    patientId: string;
    createdByMemberId: string;
    responsibleProfessionalId: string;
    title: string | null;
    description: string | null;
    attendanceType: string | null;
    clinicalStatus: string | null;
    conductTags: string[];
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    freeNotes: string | null;
    eventDate: string | null;
    appointmentId: string | null;
    source: string;
    createdAt: string;
};

export function toRecordView(r: Record): RecordView {
    return {
        id: r.id.toString(),
        clinicId: r.clinicId.toString(),
        patientId: r.patientId.toString(),
        createdByMemberId: r.createdByMemberId.toString(),
        responsibleProfessionalId: r.responsibleProfessionalId.toString(),
        title: r.title,
        description: r.description,
        attendanceType: r.attendanceType,
        clinicalStatus: r.clinicalStatus,
        conductTags: r.conductTags,
        subjective: r.subjective,
        objective: r.objective,
        assessment: r.assessment,
        plan: r.plan,
        freeNotes: r.freeNotes,
        eventDate: r.eventDate?.toISOString() ?? null,
        appointmentId: r.appointmentId?.toString() ?? null,
        source: r.source,
        createdAt: r.createdAt.toISOString(),
    };
}
