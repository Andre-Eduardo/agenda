import type {ReportFormatContext} from '@application/report/documents/report-document';
import {ReportValueFormatter} from '../report-value.formatter';

const context: ReportFormatContext = {locale: 'pt-BR', currency: 'BRL', timeZone: 'America/Sao_Paulo'};

describe('ReportValueFormatter', () => {
    const formatter = new ReportValueFormatter(context);

    it('should expose the context locale', () => {
        expect(formatter.locale).toBe('pt-BR');
    });

    it.each([null, undefined, ''] as const)('should format %p as an empty string', (value) => {
        expect(formatter.format(value, 'text')).toBe('');
    });

    it('should format a Date value with the "date" format using the context timezone', () => {
        expect(formatter.format(new Date('2026-03-01T15:30:00Z'), 'date')).toBe('01/03/2026, 12:30');
    });

    it('should fall back to String(value) when "date" format receives a non-Date value', () => {
        expect(formatter.format('already formatted', 'date')).toBe('already formatted');
    });

    it('should fall back to String(value) for a non-numeric value with a numeric format', () => {
        expect(formatter.format('n/a', 'currency')).toBe('n/a');
    });

    it('should format a currency value', () => {
        expect(formatter.format(1234.5, 'currency')).toBe('R$ 1.234,50');
    });

    it('should format a percentage value (percentage points, not a fraction)', () => {
        expect(formatter.format(42.5, 'percentage')).toBe('42,5%');
    });

    it('should format an integer value without decimals', () => {
        expect(formatter.format(1234.9, 'integer')).toBe('1.235');
    });

    it('should format a plain number value', () => {
        expect(formatter.format(1234.5, 'number')).toBe('1.234,5');
    });

    it('should fall back to String(value) for an unmatched format/value combination', () => {
        expect(formatter.format(42, 'text')).toBe('42');
    });

    it('should format a positive change with an explicit "+" sign', () => {
        expect(formatter.formatChange(12.3)).toBe('+12,3%');
    });

    it('should format a negative change without an extra sign', () => {
        expect(formatter.formatChange(-8)).toBe('-8,0%');
    });

    it('should format a zero change without a "+" sign', () => {
        expect(formatter.formatChange(0)).toBe('0,0%');
    });
});
