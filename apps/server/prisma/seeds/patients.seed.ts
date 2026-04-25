/**
 * Seed: Pacientes de desenvolvimento.
 *
 * Depende de: clinic.seed (clinicId fixo)
 *
 * Cria 4 pacientes com perfis variados para cobrir cenários de testes:
 *   - Ana (retorno frequente, alérgica)
 *   - Carlos (primeira consulta, jovem)
 *   - Maria (idosa, múltiplas condições)
 *   - João (sem dados opcionais)
 *
 * Run via: ts-node prisma/seeds/patients.seed.ts
 */
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';

const PATIENTS = [
    {
        personId: '00000000-0000-0000-0001-000000000001',
        name: 'Ana Beatriz Costa',
        documentId: '111.111.111-11',
        phone: '(11) 98888-1111',
        gender: 'FEMALE' as const,
        birthDate: new Date('1990-03-15'),
        email: 'ana.costa@email.com',
        emergencyContactName: 'João Costa',
        emergencyContactPhone: '(11) 97777-1111',
    },
    {
        personId: '00000000-0000-0000-0001-000000000002',
        name: 'Carlos Eduardo Mendes',
        documentId: '222.222.222-22',
        phone: '(11) 98888-2222',
        gender: 'MALE' as const,
        birthDate: new Date('2001-07-22'),
        email: 'carlos.mendes@email.com',
        emergencyContactName: null,
        emergencyContactPhone: null,
    },
    {
        personId: '00000000-0000-0000-0001-000000000003',
        name: 'Maria das Graças Oliveira',
        documentId: '333.333.333-33',
        phone: '(11) 98888-3333',
        gender: 'FEMALE' as const,
        birthDate: new Date('1950-11-08'),
        email: null,
        emergencyContactName: 'Pedro Oliveira',
        emergencyContactPhone: '(11) 97777-3333',
    },
    {
        personId: '00000000-0000-0000-0001-000000000004',
        name: 'João Batista Ferreira',
        documentId: '444.444.444-44',
        phone: null,
        gender: 'MALE' as const,
        birthDate: null,
        email: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
    },
];

export async function main() {
    const now = new Date();

    for (const p of PATIENTS) {
        // Person
        await prisma.person.upsert({
            where: {id: p.personId},
            create: {
                id: p.personId,
                name: p.name,
                documentId: p.documentId,
                phone: p.phone,
                gender: p.gender,
                personType: 'NATURAL',
                createdAt: now,
                updatedAt: now,
            },
            update: {name: p.name, updatedAt: now},
        });

        // Patient (id == personId por design do schema)
        await prisma.patient.upsert({
            where: {id: p.personId},
            create: {
                id: p.personId,
                documentId: p.documentId,
                birthDate: p.birthDate,
                email: p.email,
                emergencyContactName: p.emergencyContactName,
                emergencyContactPhone: p.emergencyContactPhone,
                clinicId: CLINIC_ID,
                createdAt: now,
                updatedAt: now,
            },
            update: {
                birthDate: p.birthDate,
                email: p.email,
                emergencyContactName: p.emergencyContactName,
                emergencyContactPhone: p.emergencyContactPhone,
                updatedAt: now,
            },
        });

        console.log(`✔ Paciente criado/atualizado: ${p.name}`);
    }
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
