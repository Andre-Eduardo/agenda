import type {ReportFormatContext} from '@application/report/documents/report-document';
import {xlsxNumberFormats} from '../xlsx-number.formats';

describe('xlsxNumberFormats', () => {
    it('should build a currency mask with the symbol before the amount and grouped decimals', () => {
        const context: ReportFormatContext = {locale: 'pt-BR', currency: 'BRL', timeZone: 'America/Sao_Paulo'};

        expect(xlsxNumberFormats(context).currency).toBe('[$R$] #,##0.00');
    });

    it('should omit the decimal mask entirely for a zero-decimal currency', () => {
        const context: ReportFormatContext = {locale: 'pt-BR', currency: 'JPY', timeZone: 'America/Sao_Paulo'};

        expect(xlsxNumberFormats(context).currency).toBe('[$JP¥] #,##0');
    });

    it('should build a currency mask with the symbol after the amount', () => {
        // de-DE formats currency as "1.234,50 €" (symbol after the amount), unlike the ReportLocale
        // union's pt-BR/en-US/es-ES which all place the symbol first — the cast only exercises that
        // branch of the mask builder and never reaches runtime through the documented locales.
        const context = {
            locale: 'de-DE',
            currency: 'EUR',
            timeZone: 'Europe/Berlin',
        } as unknown as ReportFormatContext;

        expect(xlsxNumberFormats(context).currency).toBe('#,##0.00 [$€]');
    });

    it('should build the percentage, integer, number and date masks', () => {
        const context: ReportFormatContext = {locale: 'pt-BR', currency: 'BRL', timeZone: 'America/Sao_Paulo'};
        const formats = xlsxNumberFormats(context);

        expect(formats.percentage).toBe('0.0%');
        expect(formats.integer).toBe('#,##0');
        expect(formats.number).toBe('#,##0.##');
        expect(formats.date).toBe('dd/mm/yyyy", "hh:mm');
    });
});
