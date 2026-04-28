/**
 * Seed: Perfis clínicos e alertas dos pacientes.
 *
 * Depende de: clinic.seed + patients.seed
 *
 * Para cada paciente cria:
 *   - ClinicalProfile  — alergias, condições, medicações, histórico
 *   - PatientAlert[]   — alertas ativos por severidade
 *
 * IDs fixos garantem idempotência via upsert.
 */
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';
const MEMBER_ID = '00000000-0000-0000-0000-000000000011';
const PROFESSIONAL_ID = '00000000-0000-0000-0000-000000000004';

const PATIENT = {
    ana: '00000000-0000-0000-0001-000000000001',
    carlos: '00000000-0000-0000-0001-000000000002',
    maria: '00000000-0000-0000-0001-000000000003',
    joao: '00000000-0000-0000-0001-000000000004',
};

// ─── Perfis clínicos ──────────────────────────────────────────────────────────

const PROFILES = [
    {
        id: '00000000-0000-0000-0002-000000000001',
        patientId: PATIENT.ana,
        allergies: 'Dipirona — reação cutânea moderada, documentada em 2023.',
        chronicConditions: 'Hipertensão arterial leve (estágio 1).',
        currentMedications: 'Losartana 50 mg 1×/dia (desde mar/2026).',
        surgicalHistory: null,
        familyHistory: 'Hipertensão: mãe e avó materna.',
        socialHistory: 'Não tabagista, consumo eventual de álcool.',
        generalNotes: 'Paciente aderente ao tratamento. Controle pressórico satisfatório.',
    },
    {
        id: '00000000-0000-0000-0002-000000000003',
        patientId: PATIENT.maria,
        allergies: 'Penicilina — reação anafilática documentada. Evitar todos os beta-lactâmicos.',
        chronicConditions: 'Diabetes mellitus tipo 2. Hipertensão arterial. Artrite reumatoide.',
        currentMedications:
            'Metformina 850 mg 2×/dia. Losartana 50 mg 1×/dia. Prednisona 5 mg 1×/dia.',
        surgicalHistory: 'Colecistectomia laparoscópica (2018).',
        familyHistory: 'Diabetes: mãe e irmã. Hipertensão: pai.',
        socialHistory: 'Viúva, mora com filha. Sedentária. Ex-tabagista (parou 2010).',
        generalNotes:
            'Paciente idosa com múltiplas comorbidades. Requere acompanhamento frequente e ajuste cuidadoso de medicações.',
    },
];

// ─── Alertas ──────────────────────────────────────────────────────────────────

const ALERTS: {
    id: string;
    patientId: string;
    title: string;
    description: string | null;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}[] = [
    // Ana
    {
        id: '00000000-0000-0000-0003-000000000001',
        patientId: PATIENT.ana,
        title: 'Alergia: Dipirona',
        description: 'Reação cutânea moderada. Não administrar dipirona ou derivados (metamizol).',
        severity: 'HIGH',
    },
    {
        id: '00000000-0000-0000-0003-000000000002',
        patientId: PATIENT.ana,
        title: 'Hipertensão arterial em acompanhamento',
        description: 'PA alvo < 130/80. Verificar PA em todo atendimento.',
        severity: 'MEDIUM',
    },
    // Maria
    {
        id: '00000000-0000-0000-0003-000000000003',
        patientId: PATIENT.maria,
        title: 'Alergia: Penicilina',
        description: 'Reação anafilática documentada. Evitar todos os beta-lactâmicos.',
        severity: 'HIGH',
    },
    {
        id: '00000000-0000-0000-0003-000000000004',
        patientId: PATIENT.maria,
        title: 'Diabetes tipo 2',
        description: 'Monitorar glicemia. Manter HbA1c < 7%.',
        severity: 'MEDIUM',
    },
    {
        id: '00000000-0000-0000-0003-000000000005',
        patientId: PATIENT.maria,
        title: 'Artrite reumatoide',
        description: 'Em uso de corticoide. Atenção a infecções e interações medicamentosas.',
        severity: 'LOW',
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function main() {
    const now = new Date();

    for (const p of PROFILES) {
        await prisma.clinicalProfile.upsert({
            where: {id: p.id},
            create: {
                id: p.id,
                clinicId: CLINIC_ID,
                patientId: p.patientId,
                createdByMemberId: MEMBER_ID,
                responsibleProfessionalId: PROFESSIONAL_ID,
                allergies: p.allergies,
                chronicConditions: p.chronicConditions,
                currentMedications: p.currentMedications,
                surgicalHistory: p.surgicalHistory,
                familyHistory: p.familyHistory,
                socialHistory: p.socialHistory,
                generalNotes: p.generalNotes,
                createdAt: now,
                updatedAt: now,
            },
            update: {
                allergies: p.allergies,
                chronicConditions: p.chronicConditions,
                currentMedications: p.currentMedications,
                surgicalHistory: p.surgicalHistory,
                familyHistory: p.familyHistory,
                socialHistory: p.socialHistory,
                generalNotes: p.generalNotes,
                updatedAt: now,
            },
        });
        console.log(`✔ ClinicalProfile: ${p.patientId.slice(-4)}`);
    }

    for (const a of ALERTS) {
        await prisma.patientAlert.upsert({
            where: {id: a.id},
            create: {
                id: a.id,
                clinicId: CLINIC_ID,
                patientId: a.patientId,
                createdByMemberId: MEMBER_ID,
                title: a.title,
                description: a.description,
                severity: a.severity,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            update: {
                title: a.title,
                description: a.description,
                severity: a.severity,
                isActive: true,
                updatedAt: now,
            },
        });
        console.log(`✔ PatientAlert [${a.severity}]: ${a.title}`);
    }
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
