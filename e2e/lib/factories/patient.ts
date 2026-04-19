import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreatePatientEntry = {
    professionalId: string;
    name?: string;
    documentId?: string;
    email?: string;
    phone?: string;
    birthDate?: Date;
};

export type CreatedPatient = {
    id: string;
    personId: string;
    name: string;
    documentId: string;
    professionalId: string;
};

export async function createTestPatient(entry: CreatePatientEntry): Promise<CreatedPatient> {
    const suffix = randomBytes(4).toString('hex');
    const now = new Date();
    const name = entry.name ?? `Paciente Teste ${suffix}`;
    const documentId = entry.documentId ?? `111.222.${suffix.slice(0, 3)}-${suffix.slice(3, 5)}`;

    const person = await prisma.person.create({
        data: {
            id: uuidv7(),
            name,
            documentId,
            phone: entry.phone ?? null,
            personType: 'NATURAL',
            createdAt: now,
            updatedAt: now,
        },
    });

    await prisma.patient.create({
        data: {
            id: person.id,
            documentId,
            email: entry.email ?? null,
            birthDate: entry.birthDate ?? null,
            professionalId: entry.professionalId,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: person.id,
        personId: person.id,
        name,
        documentId,
        professionalId: entry.professionalId,
    };
}

export async function createTestPatients(entries: CreatePatientEntry[]): Promise<CreatedPatient[]> {
    const patients: CreatedPatient[] = [];
    for (const entry of entries) {
        patients.push(await createTestPatient(entry));
    }
    return patients;
}
