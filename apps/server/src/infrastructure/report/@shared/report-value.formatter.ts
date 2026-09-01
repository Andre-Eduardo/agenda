import type {
    ReportCellValue,
    ReportFormatContext,
    ReportLocale,
    ReportValueFormat,
} from '@application/report/documents/report-document';

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

const PERCENTAGE_OPTIONS: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
};

export class ReportValueFormatter {
    readonly locale: ReportLocale;

    constructor(private readonly context: ReportFormatContext) {
        this.locale = context.locale;
    }

    format(value: ReportCellValue, format: ReportValueFormat): string {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        const {locale, currency, timeZone} = this.context;

        if (format === 'date') {
            return value instanceof Date
                ? new Intl.DateTimeFormat(locale, {...DATE_TIME_FORMAT_OPTIONS, timeZone}).format(value)
                : String(value);
        }

        if (typeof value !== 'number') {
            return String(value);
        }

        if (format === 'currency') {
            return new Intl.NumberFormat(locale, {style: 'currency', currency}).format(value);
        }

        if (format === 'percentage') {
            return new Intl.NumberFormat(locale, PERCENTAGE_OPTIONS).format(value / 100);
        }

        if (format === 'integer') {
            return new Intl.NumberFormat(locale, {maximumFractionDigits: 0}).format(value);
        }

        if (format === 'number') {
            return new Intl.NumberFormat(locale).format(value);
        }

        return String(value);
    }

    formatChange(changePercent: number): string {
        const formatted = new Intl.NumberFormat(this.context.locale, PERCENTAGE_OPTIONS).format(changePercent / 100);

        return changePercent > 0 ? `+${formatted}` : formatted;
    }
}
