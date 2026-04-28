/**
 * Seed: Horários de atendimento do profissional admin.
 *
 * Depende de: professional.seed (clinicMemberId fixo)
 *
 * Cria horários segunda a sexta:
 *   - Manhã:  08:00–12:00 (slots de 50 min)
 *   - Tarde:  13:00–18:00 (slots de 50 min)
 *
 * Run via: ts-node prisma/seeds/working-hours.seed.ts
 */
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'crypto';

const prisma = new PrismaClient();

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';
const CLINIC_MEMBER_ID = '00000000-0000-0000-0000-000000000011';

// dayOfWeek: 0 = domingo, 1 = segunda, ..., 5 = sexta, 6 = sábado
const SCHEDULES = [
    // Segunda a Sexta — manhã
    {day: 1, start: '08:00', end: '12:00'},
    {day: 2, start: '08:00', end: '12:00'},
    {day: 3, start: '08:00', end: '12:00'},
    {day: 4, start: '08:00', end: '12:00'},
    {day: 5, start: '08:00', end: '12:00'},
    // Segunda a Sexta — tarde
    {day: 1, start: '13:00', end: '18:00'},
    {day: 2, start: '13:00', end: '18:00'},
    {day: 3, start: '13:00', end: '18:00'},
    {day: 4, start: '13:00', end: '18:00'},
    {day: 5, start: '13:00', end: '18:00'},
];

export async function main() {
    const now = new Date();

    for (const s of SCHEDULES) {
        // Usa upsert por clinicMemberId+dayOfWeek+startTime para idempotência
        const existing = await prisma.workingHours.findFirst({
            where: {
                clinicMemberId: CLINIC_MEMBER_ID,
                dayOfWeek: s.day,
                startTime: s.start,
            },
        });

        if (existing) {
            await prisma.workingHours.update({
                where: {id: existing.id},
                data: {endTime: s.end, active: true, updatedAt: now},
            });
        } else {
            await prisma.workingHours.create({
                data: {
                    id: randomUUID(),
                    clinicId: CLINIC_ID,
                    clinicMemberId: CLINIC_MEMBER_ID,
                    dayOfWeek: s.day,
                    startTime: s.start,
                    endTime: s.end,
                    slotDuration: 50,
                    active: true,
                    createdAt: now,
                    updatedAt: now,
                },
            });
        }

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        console.log(`✔ WorkingHours: ${dayNames[s.day]} ${s.start}–${s.end}`);
    }
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
