import type {ReportFormatContext, ReportValueFormat} from '@application/report/documents/report-document';

export type XlsxNumberFormats = Partial<Record<ReportValueFormat, string>>;

const GROUPED_INTEGER = '#,##0';

const PERCENTAGE_MASK = '0.0%';

const QUANTITY_MASK = '#,##0.##';

const MASK_REFERENCE_DATE = new Date(Date.UTC(2026, 10, 22, 13, 45));

const DATE_PART_TOKENS: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {
    day: 'dd',
    month: 'mm',
    year: 'yyyy',
    hour: 'hh',
    minute: 'mm',
    dayPeriod: 'AM/PM',
};

const SAFE_DATE_LITERALS = new Set(['/', ':', '-', '.', ' ']);

const decimals = (count: number): string => (count > 0 ? `.${'0'.repeat(count)}` : '');

const currencyMask = ({locale, currency}: ReportFormatContext): string => {
    const format = new Intl.NumberFormat(locale, {style: 'currency', currency});
    const parts = format.formatToParts(1);
    const symbolIndex = parts.findIndex((part) => part.type === 'currency');
    const amount = `${GROUPED_INTEGER}${decimals(format.resolvedOptions().maximumFractionDigits ?? 2)}`;
    const token = `[$${parts[symbolIndex]?.value ?? currency}]`;

    return symbolIndex > parts.findIndex((part) => part.type === 'integer')
        ? `${amount} ${token}`
        : `${token} ${amount}`;
};

const NON_BREAKING_SPACES = /[\u00A0\u202F]/g;

const dateLiteral = (value: string): string => {
    const literal = value.replaceAll(NON_BREAKING_SPACES, ' ');

    return [...literal].every((char) => SAFE_DATE_LITERALS.has(char)) ? literal : `"${literal}"`;
};

const dateMask = ({locale}: ReportFormatContext): string =>
    new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
        .formatToParts(MASK_REFERENCE_DATE)
        .map((part) => DATE_PART_TOKENS[part.type] ?? dateLiteral(part.value))
        .join('');

export const xlsxNumberFormats = (context: ReportFormatContext): XlsxNumberFormats => ({
    currency: currencyMask(context),
    percentage: PERCENTAGE_MASK,
    integer: GROUPED_INTEGER,
    number: QUANTITY_MASK,
    date: dateMask(context),
});
