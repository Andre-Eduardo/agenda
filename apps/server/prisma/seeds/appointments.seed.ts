/**
 * Seed: Consultas de desenvolvimento.
 *
 * Depende de: professional.seed + patients.seed
 *
 * Cria consultas cobrindo diferentes status e tipos:
 *   - 3 consultas passadas (COMPLETED)
 *   - 1 consulta passada (NO_SHOW)
 *   - 2 consultas futuras (SCHEDULED)
 *   - 1 consulta futura (CONFIRMED)
 *   - 1 consulta cancelada (CANCELLED)
 *
 * Run via: ts-node prisma/seeds/appointments.seed.ts
 */
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'crypto';

const prisma = new PrismaClient();

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';
const CLINIC_MEMBER_ID = '00000000-0000-0000-0000-000000000011';
const PATIENT_IDS = {
    ana: '00000000-0000-0000-0001-000000000001',
    carlos: '00000000-0000-0000-0001-000000000002',
    maria: '00000000-0000-0000-0001-000000000003',
    joao: '00000000-0000-0000-0001-000000000004',
};

/** Cria uma data relativa a hoje */
function relativeDate(daysOffset: number, hour: number, minute = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
}

export async function main() {
    const now = new Date();

    const appointments = [
        // --- Passadas ---
        {
            patientId: PATIENT_IDS.ana,
            startAt: relativeDate(-30, 9, 0),
            endAt: relativeDate(-30, 9, 50),
            type: 'FIRST_VISIT' as const,
            status: 'COMPLETED' as const,
            note: 'Primeira consulta. Anamnese completa realizada.',
        },
        {
            patientId: PATIENT_IDS.ana,
            startAt: relativeDate(-14, 10, 0),
            endAt: relativeDate(-14, 10, 50),
            type: 'RETURN' as const,
            status: 'COMPLETED' as const,
            note: 'Retorno. Exames dentro do esperado.',
        },
        {
            patientId: PATIENT_IDS.maria,
            startAt: relativeDate(-7, 14, 0),
            endAt: relativeDate(-7, 14, 50),
            type: 'RETURN' as const,
            status: 'COMPLETED' as const,
            note: 'Acompanhamento. Pressão controlada.',
        },
        {
            patientId: PATIENT_IDS.carlos,
            startAt: relativeDate(-3, 9, 0),
            endAt: relativeDate(-3, 9, 50),
            type: 'FIRST_VISIT' as const,
            status: 'NO_SHOW' as const,
            note: null,
        },
        {
            patientId: PATIENT_IDS.joao,
            startAt: relativeDate(-5, 11, 0),
            endAt: relativeDate(-5, 11, 50),
            type: 'FIRST_VISIT' as const,
            status: 'CANCELLED' as const,
            canceledAt: relativeDate(-6, 8, 0),
            canceledReason: 'Paciente solicitou cancelamento.',
        },
        // --- Futuras ---
        {
            patientId: PATIENT_IDS.ana,
            startAt: relativeDate(7, 10, 0),
            endAt: relativeDate(7, 10, 50),
            type: 'RETURN' as const,
            status: 'CONFIRMED' as const,
            note: 'Retorno programado.',
        },
        {
            patientId: PATIENT_IDS.carlos,
            startAt: relativeDate(3, 9, 0),
            endAt: relativeDate(3, 9, 50),
            type: 'FIRST_VISIT' as const,
            status: 'SCHEDULED' as const,
            note: null,
        },
        {
            patientId: PATIENT_IDS.maria,
            startAt: relativeDate(14, 14, 0),
            endAt: relativeDate(14, 14, 50),
            type: 'RETURN' as const,
            status: 'SCHEDULED' as const,
            note: null,
        },
    ];

    for (const appt of appointments) {
        await prisma.appointment.create({
            data: {
                id: randomUUID(),
                clinicId: CLINIC_ID,
                attendedByMemberId: CLINIC_MEMBER_ID,
                createdByMemberId: CLINIC_MEMBER_ID,
                patientId: appt.patientId,
                startAt: appt.startAt,
                endAt: appt.endAt,
                durationMinutes: 50,
                type: appt.type,
                status: appt.status,
                canceledAt: 'canceledAt' in appt ? appt.canceledAt : null,
                canceledReason: 'canceledReason' in appt ? appt.canceledReason : null,
                note: appt.note ?? null,
                createdAt: now,
                updatedAt: now,
            },
        });

        console.log(`✔ Appointment: ${appt.patientId.slice(-4)} | ${appt.status} | ${appt.startAt.toLocaleDateString('pt-BR')}`);
    }

    console.log(`\nTotal: ${appointments.length} consultas criadas.`);
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
