import {randomUUID} from 'crypto';
/**
 * Seed: Licença da clínica de desenvolvimento.
 *
 * Só o ambiente de desenvolvimento/teste nasce com os pacotes de IA ligados.
 * Em produção, toda clínica começa no sistema base (sem linha em clinic_license).
 *
 * - Clínica Dev: até 10 profissionais (5 incluídos) e os quatro pacotes de IA,
 *   com todos os profissionais ativos liberados.
 *
 * Idempotente — recria módulos e liberações a cada execução.
 *
 * Run via: ts-node prisma/seeds/clinic-license.seed.ts
 */
import {type ClinicModuleType, PrismaClient} from '@prisma/client';
import {IDS} from './clinic.seed';

const prisma = new PrismaClient();

const MODULES: ClinicModuleType[] = ['AI_CHAT', 'AI_AGENT', 'AI_FORMS', 'AI_DOCUMENT_IMPORT'];

export async function main() {
    const now = new Date();
    const clinicId = IDS.clinic;

    const license = await prisma.clinicLicense.upsert({
        where: {clinicId},
        create: {
            id: randomUUID(),
            clinicId,
            includedProfessionals: 5,
            extraProfessionals: 0,
            maxProfessionals: 10,
            createdAt: now,
            updatedAt: now,
        },
        update: {includedProfessionals: 5, maxProfessionals: 10, updatedAt: now},
    });

    await prisma.clinicModuleAssignment.deleteMany({where: {licenseId: license.id}});
    await prisma.clinicLicenseModule.deleteMany({where: {licenseId: license.id}});

    await prisma.clinicLicenseModule.createMany({
        data: MODULES.map((moduleType) => ({
            id: randomUUID(),
            licenseId: license.id,
            moduleType,
            includedSeats: 5,
            extraSeats: 0,
            maxSeats: 10,
        })),
    });

    const professionals = await prisma.clinicMember.findMany({
        where: {clinicId, roles: {has: 'PROFESSIONAL'}, isActive: true, deletedAt: null},
    });

    await prisma.clinicModuleAssignment.createMany({
        data: professionals.flatMap((member) =>
            MODULES.map((moduleType) => ({
                id: randomUUID(),
                licenseId: license.id,
                clinicMemberId: member.id,
                moduleType,
                assignedAt: now,
            }))
        ),
    });

    console.log(
        `  ✔ Licença da Clínica Dev: ${MODULES.length} pacotes de IA, ${professionals.length} profissionais liberados`
    );
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
