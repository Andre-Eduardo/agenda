import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateMemberBlockEntry = {
    clinicId: string;
    clinicMemberId: string;
    startAt: Date;
    endAt: Date;
    reason?: string;
};

export type CreatedMemberBlock = {
    id: string;
    clinicMemberId: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
};

export async function createTestMemberBlock(entry: CreateMemberBlockEntry): Promise<CreatedMemberBlock> {
    const now = new Date();

    const block = await prisma.memberBlock.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            clinicMemberId: entry.clinicMemberId,
            startAt: entry.startAt,
            endAt: entry.endAt,
            reason: entry.reason ?? null,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: block.id,
        clinicMemberId: block.clinicMemberId,
        startAt: block.startAt,
        endAt: block.endAt,
        reason: block.reason,
    };
}
