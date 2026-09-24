import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import type {AiSpecialtyGroup} from '@prisma/client';
import {prisma} from './prisma';
import type {ClinicMemberRole} from './clinic-member';
import type {CreatedUser, CreateUserEntry} from './user';
import {createTestUser, isCreatedUser} from './user';

export type CreateProfessionalEntry = {
    user?: CreateUserEntry | CreatedUser;
    /** Roles held besides PROFESSIONAL (e.g. ['OWNER'] for a member who also manages the clinic). */
    additionalRoles?: Exclude<ClinicMemberRole, 'PROFESSIONAL'>[];
    displayName?: string;
    specialty?: string;
    specialtyNormalized?: AiSpecialtyGroup;
    color?: string;
};

export type CreatedProfessional = {
    id: string;
    clinicMemberId: string;
    clinicId: string;
    userId: string;
    user: CreatedUser;
};

export async function createTestProfessional(
    entry: CreateProfessionalEntry = {}
): Promise<CreatedProfessional> {
    const suffix = randomBytes(4).toString('hex');

    const user = isCreatedUser(entry.user)
        ? entry.user
        : await createTestUser({
              name: entry.displayName ?? `Prof ${suffix}`,
              ...(entry.user ?? {}),
          });

    const now = new Date();

    const clinic = await prisma.clinic.create({
        data: {
            id: uuidv7(),
            name: `Clínica ${suffix}`,
            isPersonalClinic: true,
            createdAt: now,
            updatedAt: now,
        },
    });

    const clinicMember = await prisma.clinicMember.create({
        data: {
            id: uuidv7(),
            clinicId: clinic.id,
            userId: user.id,
            roles: ['PROFESSIONAL', ...(entry.additionalRoles ?? [])],
            displayName: entry.displayName ?? user.name,
            color: entry.color ?? '#4F46E5',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        },
    });

    const professional = await prisma.professional.create({
        data: {
            id: uuidv7(),
            clinicMemberId: clinicMember.id,
            specialty: entry.specialty ?? 'Clínica Geral',
            specialtyNormalized: entry.specialtyNormalized ?? null,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: professional.id,
        clinicMemberId: clinicMember.id,
        clinicId: clinic.id,
        userId: user.id,
        user,
    };
}

export async function createTestProfessionals(
    entries: CreateProfessionalEntry[]
): Promise<CreatedProfessional[]> {
    const professionals: CreatedProfessional[] = [];
    for (const entry of entries) {
        professionals.push(await createTestProfessional(entry));
    }
    return professionals;
}
