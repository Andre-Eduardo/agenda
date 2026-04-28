/**
 * Seed: Default clinical document templates (system-wide, clinicId=null).
 * Run via: ts-node prisma/seeds/clinical-document-templates.seed.ts
 * Or integrate into main seed.
 *
 * Templates seeded (all default, no clinic binding):
 * - PRESCRIPTION
 * - PRESCRIPTION_SPECIAL
 * - MEDICAL_CERTIFICATE
 * - REFERRAL
 * - EXAM_REQUEST
 */
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'crypto';

const prisma = new PrismaClient();

export async function main() {
    const now = new Date();

    const templates = [
        {type: 'PRESCRIPTION', name: 'Receituário Médico'},
        {type: 'PRESCRIPTION_SPECIAL', name: 'Receituário Especial (Controlado)'},
        {type: 'MEDICAL_CERTIFICATE', name: 'Atestado Médico'},
        {type: 'REFERRAL', name: 'Encaminhamento'},
        {type: 'EXAM_REQUEST', name: 'Solicitação de Exames'},
    ] as const;

    for (const tpl of templates) {
        const existing = await prisma.clinicalDocumentTemplate.findFirst({
            where: {clinicId: null, type: tpl.type, isDefault: true},
        });

        if (!existing) {
            await prisma.clinicalDocumentTemplate.create({
                data: {
                    id: randomUUID(),
                    clinicId: null,
                    type: tpl.type,
                    isDefault: true,
                    name: tpl.name,
                    layoutJson: {},
                    createdAt: now,
                    updatedAt: now,
                },
            });
            console.log(`  ✓ Template "${tpl.name}" criado`);
        } else {
            console.log(`  - Template "${tpl.name}" já existe, pulando`);
        }
    }
}

if (require.main === module) {
    main()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}
