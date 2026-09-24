import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreatePatientEntry = {
    clinicId: string;
    name?: string;
    documentId?: string;
    email?: string;
    phone?: string;
    birthDate?: Date;
    /**
     * Clinic member ids granted FULL access to the patient (ClinicPatientAccess). Defaults to every active
     * PROFESSIONAL member of the clinic, as if one of them had registered the patient through the API, which
     * is what CreatePatientService does. OWNER and ADMIN never need it. Pass [] to seed a patient that no
     * non-manager member can open.
     */
    grantAccessTo?: string[];
};

export type CreatedPatient = {
    id: string;
    personId: string;
    name: string;
    documentId: string;
    clinicId: string;
};

function randomDigits(length: number): string {
    let out = '';
    for (const byte of randomBytes(length)) {
        out += (byte % 10).toString();
    }
    return out;
}

export async function createTestPatient(entry: CreatePatientEntry): Promise<CreatedPatient> {
    const suffix = randomBytes(4).toString('hex');
    const now = new Date();
    const name = entry.name ?? `Paciente Teste ${suffix}`;
    const documentId = entry.documentId ?? `111.222.${randomDigits(3)}-${randomDigits(2)}`;

    const person = await prisma.person.create({
        data: {
            id: uuidv7(),
            name,
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
            clinicId: entry.clinicId,
            createdAt: now,
            updatedAt: now,
        },
    });

    const memberIds =
        entry.grantAccessTo ??
        (
            await prisma.clinicMember.findMany({
                where: {clinicId: entry.clinicId, roles: {has: 'PROFESSIONAL'}, isActive: true, deletedAt: null},
                select: {id: true},
            })
        ).map((member) => member.id);

    await prisma.clinicPatientAccess.createMany({
        data: memberIds.map((memberId) => ({
            id: uuidv7(),
            clinicId: entry.clinicId,
            memberId,
            patientId: person.id,
            accessLevel: 'FULL',
            createdAt: now,
            updatedAt: now,
        })),
    });

    return {
        id: person.id,
        personId: person.id,
        name,
        documentId,
        clinicId: entry.clinicId,
    };
}

export async function createTestPatients(entries: CreatePatientEntry[]): Promise<CreatedPatient[]> {
    const patients: CreatedPatient[] = [];
    for (const entry of entries) {
        patients.push(await createTestPatient(entry));
    }
    return patients;
}
