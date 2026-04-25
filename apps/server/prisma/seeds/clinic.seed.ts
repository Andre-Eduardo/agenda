/**
 * Seed: Clínica de desenvolvimento com login admin.
 *
 * Cria a árvore mínima para o sistema funcionar:
 *   - User          (username: admin | email: admin@agenda.dev | role: OWNER)
 *   - Clinic        (clínica padrão de desenvolvimento, isPersonalClinic=true)
 *   - ClinicMember  (OWNER do User na Clinic)
 *   - Person        (dados pessoais — usado também por Patient)
 *   - Professional  (extensão 1:1 do ClinicMember com role=PROFESSIONAL)
 *
 * Senha: Admin@123456 (atende a política do app — maiúscula/minúscula/número/símbolo).
 *
 * IDs fixos garantem idempotência via upsert.
 *
 * Run via: ts-node prisma/seeds/clinic.seed.ts
 */
import {PrismaClient} from '@prisma/client';
import * as crypto from 'crypto';
import {promisify} from 'util';

const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

// IDs fixos para idempotência
export const IDS = {
    user: '00000000-0000-0000-0000-000000000001',
    person: '00000000-0000-0000-0000-000000000002',
    clinic: '00000000-0000-0000-0000-000000000010',
    clinicMember: '00000000-0000-0000-0000-000000000011',
    professional: '00000000-0000-0000-0000-000000000004',
};

/** Gera hash no mesmo formato que ObfuscatedPassword (sem validação de força). */
async function hashPassword(raw: string): Promise<string> {
    const KEY_SIZE = 64;
    const salt = crypto.randomBytes(16);
    const hash = (await scrypt(raw, salt, KEY_SIZE)) as Buffer;
    return `${KEY_SIZE}:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export async function main() {
    const now = new Date();

    const password = await hashPassword('Admin@123456');
    await prisma.user.upsert({
        where: {id: IDS.user},
        create: {
            id: IDS.user,
            username: 'admin',
            email: 'admin@agenda.dev',
            name: 'Administrador',
            password,
            globalRole: 'OWNER',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            username: 'admin',
            email: 'admin@agenda.dev',
            name: 'Administrador',
            globalRole: 'OWNER',
            updatedAt: now,
        },
    });
    console.log('✔ User admin criado/atualizado');

    await prisma.clinic.upsert({
        where: {id: IDS.clinic},
        create: {
            id: IDS.clinic,
            name: 'Clínica Dev',
            documentId: '00.000.000/0001-00',
            phone: '(11) 99999-0000',
            email: 'contato@agenda.dev',
            isPersonalClinic: true,
            createdAt: now,
            updatedAt: now,
        },
        update: {
            name: 'Clínica Dev',
            updatedAt: now,
        },
    });
    console.log('✔ Clinic criada/atualizada');

    await prisma.clinicMember.upsert({
        where: {id: IDS.clinicMember},
        create: {
            id: IDS.clinicMember,
            clinicId: IDS.clinic,
            userId: IDS.user,
            role: 'OWNER',
            displayName: 'Dr. Admin Silva',
            color: '#4F81BD',
            isActive: true,
            invitedByMemberId: null,
            createdAt: now,
            updatedAt: now,
        },
        update: {
            role: 'OWNER',
            displayName: 'Dr. Admin Silva',
            color: '#4F81BD',
            isActive: true,
            updatedAt: now,
        },
    });
    console.log('✔ ClinicMember (OWNER) criado/atualizado');

    await prisma.person.upsert({
        where: {id: IDS.person},
        create: {
            id: IDS.person,
            name: 'Dr. Admin Silva',
            documentId: '000.000.000-00',
            phone: '(11) 99999-0000',
            gender: 'MALE',
            personType: 'NATURAL',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            name: 'Dr. Admin Silva',
            updatedAt: now,
        },
    });
    console.log('✔ Person base criado/atualizado');

    await prisma.professional.upsert({
        where: {id: IDS.professional},
        create: {
            id: IDS.professional,
            clinicMemberId: IDS.clinicMember,
            registrationNumber: 'CRM-SP 12345',
            specialty: 'Medicina Geral',
            specialtyNormalized: 'MEDICINA',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            registrationNumber: 'CRM-SP 12345',
            specialty: 'Medicina Geral',
            specialtyNormalized: 'MEDICINA',
            updatedAt: now,
        },
    });
    console.log('✔ Professional criado/atualizado');
    console.log('');
    console.log('  Login: admin@agenda.dev');
    console.log('  Senha: Admin@123456');
    console.log('  Clinic ID:        ', IDS.clinic);
    console.log('  ClinicMember ID:  ', IDS.clinicMember);
    console.log('  Professional ID:  ', IDS.professional);
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
