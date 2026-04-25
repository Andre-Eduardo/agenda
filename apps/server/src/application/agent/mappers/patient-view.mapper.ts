import type {Patient} from '../../../domain/patient/entities';

export type PatientView = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    birthDate: string | null;
    professionalId: string | null;
};

export function toPatientView(p: Patient): PatientView {
    return {
        id: p.id.toString(),
        name: p.name,
        email: p.email,
        phone: p.phone?.toString() ?? null,
        gender: p.gender,
        birthDate: p.birthDate?.toISOString() ?? null,
        professionalId: p.professionalId?.toString() ?? null,
    };
}
