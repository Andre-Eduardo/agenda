import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateRecordEntry = {
    clinicId: string;
    patientId: string;
    memberId: string;
    professionalId: string;
    title: string;
    subjective: string;
};

export async function createTestRecord(entry: CreateRecordEntry) {
    const now = new Date();

    return prisma.record.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            patientId: entry.patientId,
            createdByMemberId: entry.memberId,
            responsibleProfessionalId: entry.professionalId,
            title: entry.title,
            subjective: entry.subjective,
            attendanceType: 'FOLLOW_UP',
            source: 'MANUAL',
            conductTags: [],
            eventDate: now,
            createdAt: now,
            updatedAt: now,
        },
    });
}
