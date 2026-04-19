import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';
import type {CreatedUser, CreateUserEntry} from './user';
import {createTestUser} from './user';

export type Specialty =
    | 'PSICOLOGIA'
    | 'MEDICINA'
    | 'FISIOTERAPIA'
    | 'FONOAUDIOLOGIA'
    | 'NUTRICAO'
    | 'TERAPIA_OCUPACIONAL'
    | 'ENFERMAGEM'
    | 'OUTROS';

export type CreateProfessionalEntry = {
    user?: CreateUserEntry | CreatedUser;
    personName?: string;
    documentId?: string;
    specialty?: string;
    specialtyNormalized?: Specialty;
    configColor?: string;
};

export type CreatedProfessional = {
    id: string;
    personId: string;
    configId: string;
    userId: string;
    user: CreatedUser;
    personName: string;
};

function isCreatedUser(value: CreateUserEntry | CreatedUser | undefined): value is CreatedUser {
    return !!value && typeof (value as CreatedUser).id === 'string' && 'password' in value;
}

export async function createTestProfessional(
    entry: CreateProfessionalEntry = {}
): Promise<CreatedProfessional> {
    const suffix = randomBytes(4).toString('hex');

    const user = isCreatedUser(entry.user)
        ? entry.user
        : await createTestUser({
              name: entry.personName ?? `Prof ${suffix}`,
              ...(entry.user ?? {}),
          });

    const now = new Date();

    const person = await prisma.person.create({
        data: {
            id: uuidv7(),
            name: entry.personName ?? user.name,
            documentId: entry.documentId ?? `000.000.${suffix.slice(0, 3)}-${suffix.slice(3, 5)}`,
            personType: 'NATURAL',
            createdAt: now,
            updatedAt: now,
        },
    });

    const config = await prisma.professionalConfig.create({
        data: {
            id: uuidv7(),
            color: entry.configColor ?? '#4F46E5',
            createdAt: now,
            updatedAt: now,
        },
    });

    const professional = await prisma.professional.create({
        data: {
            id: uuidv7(),
            personId: person.id,
            configId: config.id,
            userId: user.id,
            specialty: entry.specialty ?? 'Clínica Geral',
            specialtyNormalized: entry.specialtyNormalized ?? 'MEDICINA',
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: professional.id,
        personId: person.id,
        configId: config.id,
        userId: user.id,
        user,
        personName: person.name,
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
