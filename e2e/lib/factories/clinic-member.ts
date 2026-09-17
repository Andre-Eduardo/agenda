import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';
import type {CreatedUser, CreateUserEntry} from './user';
import {createTestUser, isCreatedUser} from './user';

export type ClinicMemberRole = 'OWNER' | 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'VIEWER';

export type CreateClinicMemberEntry = {
    clinicId: string;
    user?: CreateUserEntry | CreatedUser;
    role?: ClinicMemberRole;
    displayName?: string;
    color?: string;
    isActive?: boolean;
};

export type CreatedClinicMember = {
    id: string;
    clinicId: string;
    userId: string;
    role: ClinicMemberRole;
    displayName: string | null;
    user: CreatedUser;
};

/** A plain ClinicMember (no Professional row) — use for SECRETARY/ADMIN/VIEWER test fixtures. */
export async function createTestClinicMember(entry: CreateClinicMemberEntry): Promise<CreatedClinicMember> {
    const user = isCreatedUser(entry.user)
        ? entry.user
        : await createTestUser({name: entry.displayName ?? 'Membro Teste', ...(entry.user ?? {})});

    const now = new Date();

    const member = await prisma.clinicMember.create({
        data: {
            id: uuidv7(),
            clinicId: entry.clinicId,
            userId: user.id,
            role: entry.role ?? 'SECRETARY',
            displayName: entry.displayName ?? user.name,
            color: entry.color ?? null,
            isActive: entry.isActive ?? true,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: member.id,
        clinicId: member.clinicId,
        userId: member.userId,
        role: member.role as ClinicMemberRole,
        displayName: member.displayName,
        user,
    };
}
