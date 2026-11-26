import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {WorkingHours} from '@domain/professional/entities';

describe('WorkingHours', () => {
    // Terça, 08:00–18:00 em horário de Brasília.
    const workingHours = WorkingHours.create({
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        dayOfWeek: 2,
        startTime: '08:00',
        endTime: '18:00',
        slotDuration: 30,
    });

    describe('coversInterval', () => {
        it('covers a 16:00 local appointment (19:00 UTC)', () => {
            expect(
                workingHours.coversInterval(new Date('2026-12-01T19:00:00.000Z'), new Date('2026-12-01T19:30:00.000Z'))
            ).toBe(true);
        });

        it('covers an appointment ending exactly at the end of the window', () => {
            expect(
                workingHours.coversInterval(new Date('2026-12-01T20:30:00.000Z'), new Date('2026-12-01T21:00:00.000Z'))
            ).toBe(true);
        });

        it('rejects an appointment that starts before the window in local time', () => {
            // 07:30 local = 10:30 UTC, which would be "inside" if compared in UTC.
            expect(
                workingHours.coversInterval(new Date('2026-12-01T10:30:00.000Z'), new Date('2026-12-01T11:00:00.000Z'))
            ).toBe(false);
        });

        it('rejects an appointment that ends after the window in local time', () => {
            expect(
                workingHours.coversInterval(new Date('2026-12-01T20:45:00.000Z'), new Date('2026-12-01T21:15:00.000Z'))
            ).toBe(false);
        });

        it('compares a 21:30 local appointment against its own local day', () => {
            const evening = WorkingHours.create({
                clinicId: ClinicId.generate(),
                clinicMemberId: ClinicMemberId.generate(),
                dayOfWeek: 2,
                startTime: '18:00',
                endTime: '23:00',
                slotDuration: 30,
            });

            // 21:30–22:00 local = 00:30–01:00 UTC do dia seguinte.
            expect(
                evening.coversInterval(new Date('2026-12-02T00:30:00.000Z'), new Date('2026-12-02T01:00:00.000Z'))
            ).toBe(true);
        });

        it('rejects an interval that crosses local midnight', () => {
            expect(
                workingHours.coversInterval(new Date('2026-12-02T02:00:00.000Z'), new Date('2026-12-02T03:30:00.000Z'))
            ).toBe(false);
        });
    });
});
