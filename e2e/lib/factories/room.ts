import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateRoomEntry = {
    clinicId: string;
    name?: string;
    active?: boolean;
};

export type CreatedRoom = {
    id: string;
    clinicId: string;
    name: string;
    active: boolean;
};

export async function createTestRoom(entry: CreateRoomEntry): Promise<CreatedRoom> {
    const suffix = randomBytes(4).toString('hex');
    const now = new Date();

    const room = await prisma.room.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            name: entry.name ?? `Sala ${suffix}`,
            active: entry.active ?? true,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: room.id,
        clinicId: room.clinicId,
        name: room.name,
        active: room.active,
    };
}

/** Shortcut for tests that need room management already enabled without exercising the toggle UI. */
export async function setClinicRoomManagementEnabled(clinicId: string, enabled: boolean): Promise<void> {
    await prisma.clinic.update({
        where: {id: clinicId},
        data: {roomManagementEnabled: enabled},
    });
}
