import {DEFAULT_CLINIC_TIME_ZONE, toZonedParts} from '@domain/@shared/utils';

describe('toZonedParts', () => {
    it('defaults to America/Sao_Paulo', () => {
        expect(DEFAULT_CLINIC_TIME_ZONE).toBe('America/Sao_Paulo');
    });

    it('converts an afternoon UTC instant to Brasília wall-clock time', () => {
        // 16:00 em Brasília (UTC-3) = 19:00 UTC.
        expect(toZonedParts(new Date('2026-12-01T19:00:00.000Z'))).toEqual({
            date: '2026-12-01',
            dayOfWeek: 2,
            time: '16:00',
        });
    });

    it('keeps a late-evening appointment on the local day even when UTC is already the next day', () => {
        // 21:30 de terça em Brasília = 00:30 de quarta em UTC.
        expect(toZonedParts(new Date('2026-12-02T00:30:00.000Z'))).toEqual({
            date: '2026-12-01',
            dayOfWeek: 2,
            time: '21:30',
        });
    });

    it('renders midnight as 00:00', () => {
        expect(toZonedParts(new Date('2026-12-02T03:00:00.000Z')).time).toBe('00:00');
    });

    it('accepts another time zone', () => {
        expect(toZonedParts(new Date('2026-12-01T19:00:00.000Z'), 'UTC')).toEqual({
            date: '2026-12-01',
            dayOfWeek: 2,
            time: '19:00',
        });
    });
});
