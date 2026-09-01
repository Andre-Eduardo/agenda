import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import type {ClinicId} from '@domain/clinic/entities';
import type {
    ReportAlignment,
    ReportCellValue,
    ReportColumn,
    ReportColumnsSection,
    ReportComparisonRow,
    ReportComparisonSection,
    ReportDocument,
    ReportFormatContext,
    ReportKpiItem,
    ReportKpiSection,
    ReportLeafSection,
    ReportLocale,
    ReportPeriod,
    ReportRow,
    ReportSection,
    ReportTableSection,
    ReportTextSection,
    ReportValueFormat,
} from '../documents/report-document';
import {type ReportDocumentLabelKey, translateReportLabel} from '../documents/report-document.labels';

const DEFAULT_REPORT_CURRENCY = 'BRL';

const DEFAULT_REPORT_TIME_ZONE = 'America/Sao_Paulo';

export type ReportBuildContext = ReportFormatContext & {
    clinicName: string;
    t: (key: ReportDocumentLabelKey, args?: Record<string, string | number>) => string;
};

export type ReportAssemblyInput<TData, TPayload> = {
    payload: TPayload;
    data: TData;
    locale: ReportLocale;
};

const SLUG_MAX_LENGTH = 40;

const DEFAULT_ALIGNMENT: Record<ReportValueFormat, ReportAlignment> = {
    currency: 'right',
    percentage: 'right',
    integer: 'right',
    number: 'right',
    date: 'right',
    text: 'left',
};

/**
 * Builder base reutilizável por qualquer relatório de negócio: resolve a clínica (multi-tenant),
 * monta o contexto de formatação (locale/moeda/timezone) e expõe helpers protegidos para montar
 * seções sem repetir boilerplate. Subclasses concretas implementam apenas `title`/`period`/
 * `fileBaseName`/`sections`.
 */
export abstract class ReportDocumentAssembler<TData, TPayload extends {clinicId: ClinicId}> {
    protected abstract readonly clinicRepository: ClinicRepository;

    async toDocument({payload, data, locale}: ReportAssemblyInput<TData, TPayload>): Promise<ReportDocument> {
        const clinic = await this.clinicRepository.findById(payload.clinicId);

        if (!clinic) {
            throw new ResourceNotFoundException('clinic.not_found', payload.clinicId.toString());
        }

        const context: ReportFormatContext = {
            locale,
            currency: DEFAULT_REPORT_CURRENCY,
            timeZone: DEFAULT_REPORT_TIME_ZONE,
        };

        const build: ReportBuildContext = {
            ...context,
            clinicName: clinic.name,
            t: (key, args) => translateReportLabel(locale, key, args),
        };

        return {
            title: this.title(build),
            subtitle: clinic.name,
            period: this.period(data, build),
            generatedAt: new Date(),
            context,
            fileBaseName: this.fileBaseName(payload, build),
            sections: this.sections(data, build),
        };
    }

    protected abstract title(context: ReportBuildContext): string;

    protected abstract period(data: TData, context: ReportBuildContext): ReportPeriod | null;

    protected abstract fileBaseName(payload: TPayload, context: ReportBuildContext): string;

    protected abstract sections(data: TData, context: ReportBuildContext): ReportSection[];

    protected kpiSection(id: string, title: string, items: ReportKpiItem[]): ReportKpiSection {
        return {kind: 'kpi', id, title, items};
    }

    protected kpi(label: string, value: ReportCellValue, format: ReportValueFormat): ReportKpiItem {
        return {label, value, format};
    }

    protected table(
        id: string,
        title: string,
        columns: ReportColumn[],
        rows: ReportRow[],
        options: {total?: ReportRow | null; emptyMessage?: string; note?: string | null} = {}
    ): ReportTableSection {
        return {kind: 'table', id, title, columns, rows, ...options};
    }

    protected comparison(
        id: string,
        title: string,
        rows: ReportComparisonRow[],
        subtitle?: string | null
    ): ReportComparisonSection {
        return {kind: 'comparison', id, title, rows, subtitle};
    }

    protected paragraph(id: string, title: string, body: string): ReportTextSection {
        return {kind: 'text', id, title, body};
    }

    protected columns(id: string, primary: ReportLeafSection[], secondary: ReportLeafSection[]): ReportColumnsSection {
        return {kind: 'columns', id, primary, secondary};
    }

    protected column(
        key: string,
        header: string,
        format: ReportValueFormat,
        options: {width?: number; align?: ReportAlignment} = {}
    ): ReportColumn {
        return {key, header, format, align: options.align ?? DEFAULT_ALIGNMENT[format], width: options.width};
    }

    protected text(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'text', {width});
    }

    protected currency(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'currency', {width});
    }

    protected percentage(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'percentage', {width});
    }

    protected integer(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'integer', {width});
    }

    protected number(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'number', {width});
    }

    protected date(key: string, header: string, width?: number): ReportColumn {
        return this.column(key, header, 'date', {width});
    }

    protected sumRow(rows: ReportRow[], keys: string[], label: {key: string; value: string}): ReportRow {
        const total: ReportRow = {[label.key]: label.value};

        for (const key of keys) {
            total[key] = rows.reduce((sum, row) => sum + (typeof row[key] === 'number' ? row[key] : 0), 0);
        }

        return total;
    }

    protected slug(value: string): string {
        return value
            .normalize('NFD')
            .replaceAll(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, '-')
            .replaceAll(/^-+|-+$/g, '')
            .slice(0, SLUG_MAX_LENGTH);
    }
}
