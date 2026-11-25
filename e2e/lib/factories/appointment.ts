import {uuidv7} from 'uuidv7';
import type {AppointmentType} from '@prisma/client';
import {prisma} from './prisma';

export type CreateAppointmentEntry = {
    clinicId: string;
    patientId: string;
    memberId: string;
    startAt: Date;
    durationMinutes?: number;
    type?: AppointmentType;
};

export async function createTestAppointment(entry: CreateAppointmentEntry) {
    const now = new Date();
    const durationMinutes = entry.durationMinutes ?? 30;

    return prisma.appointment.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            patientId: entry.patientId,
            attendedByMemberId: entry.memberId,
            createdByMemberId: entry.memberId,
            startAt: entry.startAt,
            endAt: new Date(entry.startAt.getTime() + durationMinutes * 60_000),
            durationMinutes,
            type: entry.type ?? 'RETURN',
            status: 'SCHEDULED',
            createdAt: now,
            updatedAt: now,
        },
    });
}
