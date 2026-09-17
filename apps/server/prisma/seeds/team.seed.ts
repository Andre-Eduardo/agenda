import * as crypto from 'crypto';
import {promisify} from 'util';
/**
 * Seed: Equipe adicional da clínica de desenvolvimento.
 *
 * O seed de `clinic.seed.ts` cria apenas o OWNER (que também tem o papel
 * PROFESSIONAL). Este seed complementa com:
 *   - Beatriz: apenas PROFESSIONAL (tem agenda própria, sem gerenciar outras).
 *   - Carlos: ADMIN + PROFESSIONAL — exemplo de membro com múltiplos papéis:
 *     tem agenda própria E gerencia a clínica/outras agendas.
 *   - Ana: apenas SECRETARY, sem registro Professional (sem agenda própria).
 *   - Concessão de acesso de agenda (ProfessionalAgendaAccess) da secretária
 *     para os dois profissionais, para testar o fluxo de múltiplas agendas.
 *
 * Depende de: clinic.seed (clinicId fixo)
 *
 * Senha de todos: Admin@123456 (mesma do admin, apenas para dev/teste).
 *
 * Run via: ts-node prisma/seeds/team.seed.ts
 */
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';

const IDS = {
    beatriz: {
        user: '00000000-0000-0000-0000-000000000012',
        clinicMember: '00000000-0000-0000-0000-000000000015',
        professional: '00000000-0000-0000-0000-000000000018',
    },
    carlos: {
        user: '00000000-0000-0000-0000-000000000013',
        clinicMember: '00000000-0000-0000-0000-000000000016',
        professional: '00000000-0000-0000-0000-000000000019',
    },
    ana: {
        user: '00000000-0000-0000-0000-000000000014',
        clinicMember: '00000000-0000-0000-0000-000000000017',
    },
};

const AGENDA_ACCESS_IDS = {
    anaToBeatriz: '00000000-0000-0000-0000-000000000020',
    anaToCarlos: '00000000-0000-0000-0000-000000000021',
};

/** Gera hash no mesmo formato que ObfuscatedPassword (sem validação de força). */
async function hashPassword(raw: string): Promise<string> {
    const KEY_SIZE = 64;
    const salt = crypto.randomBytes(16);
    const hash = (await scrypt(raw, salt, KEY_SIZE)) as Buffer;

    return `${KEY_SIZE}:${salt.toString('base64')}:${hash.toString('base64')}`;
}

async function upsertUser(id: string, username: string, email: string, name: string, password: string, now: Date) {
    await prisma.user.upsert({
        where: {id},
        create: {
            id,
            username,
            email,
            name,
            password,
            globalRole: 'NONE',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            username,
            email,
            name,
            updatedAt: now,
        },
    });
}

async function upsertClinicMember(
    id: string,
    userId: string,
    roles: Array<'PROFESSIONAL' | 'SECRETARY' | 'ADMIN'>,
    displayName: string,
    color: string,
    invitedByMemberId: string,
    now: Date
) {
    await prisma.clinicMember.upsert({
        where: {id},
        create: {
            id,
            clinicId: CLINIC_ID,
            userId,
            roles,
            displayName,
            color,
            isActive: true,
            invitedByMemberId,
            createdAt: now,
            updatedAt: now,
        },
        update: {
            roles,
            displayName,
            color,
            isActive: true,
            updatedAt: now,
        },
    });
}

export async function main() {
    const now = new Date();
    const password = await hashPassword('Admin@123456');
    const OWNER_MEMBER_ID = '00000000-0000-0000-0000-000000000011';

    // --- Beatriz Costa (Psicóloga) ---
    await upsertUser(IDS.beatriz.user, 'beatriz', 'beatriz@agenda.dev', 'Beatriz Costa', password, now);
    await upsertClinicMember(
        IDS.beatriz.clinicMember,
        IDS.beatriz.user,
        ['PROFESSIONAL'],
        'Dra. Beatriz Costa',
        '#8E6FCE',
        OWNER_MEMBER_ID,
        now
    );
    await prisma.professional.upsert({
        where: {id: IDS.beatriz.professional},
        create: {
            id: IDS.beatriz.professional,
            clinicMemberId: IDS.beatriz.clinicMember,
            registrationNumber: 'CRP-SP 54321',
            specialty: 'Psicologia',
            specialtyNormalized: 'SAUDE_MENTAL',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            registrationNumber: 'CRP-SP 54321',
            specialty: 'Psicologia',
            specialtyNormalized: 'SAUDE_MENTAL',
            updatedAt: now,
        },
    });
    console.log('✔ Profissional Beatriz Costa (Psicologia) criado/atualizado');

    // --- Carlos Mendes (Nutricionista) ---
    await upsertUser(IDS.carlos.user, 'carlos', 'carlos@agenda.dev', 'Carlos Mendes', password, now);
    // Admin AND professional — illustrates a member accumulating roles: Carlos
    // has his own agenda (PROFESSIONAL) and can also manage the clinic (ADMIN).
    await upsertClinicMember(
        IDS.carlos.clinicMember,
        IDS.carlos.user,
        ['ADMIN', 'PROFESSIONAL'],
        'Carlos Mendes',
        '#4FA37D',
        OWNER_MEMBER_ID,
        now
    );
    await prisma.professional.upsert({
        where: {id: IDS.carlos.professional},
        create: {
            id: IDS.carlos.professional,
            clinicMemberId: IDS.carlos.clinicMember,
            registrationNumber: 'CRN-SP 98765',
            specialty: 'Nutrição',
            specialtyNormalized: 'NUTRICAO_DIETETICA',
            createdAt: now,
            updatedAt: now,
        },
        update: {
            registrationNumber: 'CRN-SP 98765',
            specialty: 'Nutrição',
            specialtyNormalized: 'NUTRICAO_DIETETICA',
            updatedAt: now,
        },
    });
    console.log('✔ Profissional Carlos Mendes (Nutrição) criado/atualizado');

    // --- Ana Souza (Secretária) — perfil sem registro Professional ---
    await upsertUser(IDS.ana.user, 'ana', 'ana@agenda.dev', 'Ana Souza', password, now);
    await upsertClinicMember(
        IDS.ana.clinicMember,
        IDS.ana.user,
        ['SECRETARY'],
        'Ana Souza',
        '#D98E4A',
        OWNER_MEMBER_ID,
        now
    );
    console.log('✔ Membro Ana Souza (Secretária) criado/atualizado');

    // --- Concede à Ana acesso para gerenciar as agendas dos dois profissionais ---
    await prisma.professionalAgendaAccess.upsert({
        where: {id: AGENDA_ACCESS_IDS.anaToBeatriz},
        create: {
            id: AGENDA_ACCESS_IDS.anaToBeatriz,
            clinicId: CLINIC_ID,
            granteeMemberId: IDS.ana.clinicMember,
            professionalMemberId: IDS.beatriz.clinicMember,
            reason: 'Recepção agenda consultas de psicologia',
            createdAt: now,
            updatedAt: now,
        },
        update: {updatedAt: now},
    });
    await prisma.professionalAgendaAccess.upsert({
        where: {id: AGENDA_ACCESS_IDS.anaToCarlos},
        create: {
            id: AGENDA_ACCESS_IDS.anaToCarlos,
            clinicId: CLINIC_ID,
            granteeMemberId: IDS.ana.clinicMember,
            professionalMemberId: IDS.carlos.clinicMember,
            reason: 'Recepção agenda consultas de nutrição',
            createdAt: now,
            updatedAt: now,
        },
        update: {updatedAt: now},
    });
    console.log('✔ Acesso de agenda de Ana Souza a Beatriz e Carlos concedido');

    console.log('');
    console.log('Novos logins (senha Admin@123456 para todos):');
    console.log('  beatriz@agenda.dev  — Beatriz Costa (Psicóloga)');
    console.log('  carlos@agenda.dev   — Carlos Mendes (Nutricionista)');
    console.log('  ana@agenda.dev      — Ana Souza (Secretária)');
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
