/**
 * Seed: Profissional de desenvolvimento com login admin.
 *
 * Cria:
 *   - User  (username: admin | email: admin@agenda.dev | role: OWNER)
 *   - Person (profissional)
 *   - ProfessionalConfig
 *   - Professional
 *
 * Senha: Admin@123456
 * IMPORTANTE: A política do app exige senha forte (maiúscula, minúscula, número, símbolo).
 * "123456" não atende — use Admin@123456 nos testes de login.
 *
 * IDs fixos garantem idempotência via upsert.
 *
 * Run via: ts-node prisma/seeds/professional.seed.ts
 */
import {PrismaClient} from '@prisma/client';
import * as crypto from 'crypto';
import {promisify} from 'util';

const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

// IDs fixos para idempotência
const IDS = {
    user: '00000000-0000-0000-0000-000000000001',
    person: '00000000-0000-0000-0000-000000000002',
    config: '00000000-0000-0000-0000-000000000003',
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

    // 1. Senha
    const password = await hashPassword('Admin@123456');

    // 2. User
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

    // 3. Person
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
    console.log('✔ Person (profissional) criado/atualizado');

    // 4. ProfessionalConfig
    await prisma.professionalConfig.upsert({
        where: {id: IDS.config},
        create: {
            id: IDS.config,
            color: '#4F81BD',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            color: '#4F81BD',
            updatedAt: now,
        },
    });
    console.log('✔ ProfessionalConfig criado/atualizado');

    // 5. Professional
    await prisma.professional.upsert({
        where: {id: IDS.professional},
        create: {
            id: IDS.professional,
            personId: IDS.person,
            configId: IDS.config,
            userId: IDS.user,
            specialty: 'Medicina Geral',
            specialtyNormalized: 'MEDICINA',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            specialty: 'Medicina Geral',
            specialtyNormalized: 'MEDICINA',
            updatedAt: now,
        },
    });
    console.log('✔ Professional criado/atualizado');
    console.log('');
    console.log('  Login: admin@agenda.dev');
    console.log('  Senha: Admin@123456');
    console.log('  Professional ID:', IDS.professional);
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
