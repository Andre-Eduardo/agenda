import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateWorkingHoursEntry = {
    clinicId: string;
    clinicMemberId: string;
    /** 0 = Sunday .. 6 = Saturday, matches JS `Date#getDay()`. */
    dayOfWeek: number;
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    active?: boolean;
};

export type CreatedWorkingHours = {
    id: string;
    clinicMemberId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    active: boolean;
};

export async function createTestWorkingHours(entry: CreateWorkingHoursEntry): Promise<CreatedWorkingHours> {
    const now = new Date();

    const workingHours = await prisma.workingHours.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            clinicMemberId: entry.clinicMemberId,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime ?? '08:00',
            endTime: entry.endTime ?? '12:00',
            slotDuration: entry.slotDuration ?? 30,
            active: entry.active ?? true,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: workingHours.id,
        clinicMemberId: workingHours.clinicMemberId,
        dayOfWeek: workingHours.dayOfWeek,
        startTime: workingHours.startTime,
        endTime: workingHours.endTime,
        active: workingHours.active,
    };
}
