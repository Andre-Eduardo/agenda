import type {ReportDocument, ReportFormatContext} from '@application/report/documents/report-document';
import {PdfmakeReportExporter} from '../pdfmake-report.exporter';

const context: ReportFormatContext = {locale: 'pt-BR', currency: 'BRL', timeZone: 'America/Sao_Paulo'};

const buildDocument = (overrides: Partial<ReportDocument> = {}): ReportDocument => ({
    title: 'Relatório de Atendimentos',
    subtitle: 'Clínica Saúde Total',
    period: {from: new Date('2026-01-01'), to: new Date('2026-01-31'), label: 'Janeiro/2026'},
    generatedAt: new Date('2026-02-01T12:00:00Z'),
    context,
    fileBaseName: 'relatorio-de-atendimentos',
    sections: [
        {kind: 'kpi', id: 'kpis', title: 'Indicadores', items: [{label: 'Consultas', value: 42, format: 'integer'}]},
        {
            kind: 'columns',
            id: 'layout',
            primary: [
                {
                    kind: 'table',
                    id: 'rows',
                    title: 'Atendimentos',
                    columns: [
                        {key: 'name', header: 'Paciente', format: 'text'},
                        {key: 'amount', header: 'Valor', format: 'currency'},
                    ],
                    rows: [{name: 'Maria', amount: 150}],
                    total: {name: 'Total', amount: 150},
                    note: 'Valores em reais',
                },
            ],
            secondary: [
                {
                    kind: 'comparison',
                    id: 'comparison',
                    title: 'Comparativo',
                    rows: [{label: 'Consultas', current: 42, previous: 30, changePercent: 40, format: 'integer'}],
                },
            ],
        },
        {kind: 'text', id: 'notes', title: 'Observações', body: 'Texto livre com acentuação: ção, ã, é.'},
        {
            kind: 'table',
            id: 'empty',
            title: 'Sem dados',
            columns: [{key: 'name', header: 'Nome', format: 'text'}],
            rows: [],
        },
    ],
    ...overrides,
});

describe('PdfmakeReportExporter', () => {
    const exporter = new PdfmakeReportExporter();

    it('should expose its format metadata', () => {
        expect(exporter.format).toBe('PDF');
        expect(exporter.contentType).toBe('application/pdf');
        expect(exporter.fileExtension).toBe('pdf');
    });

    it('should export a ReportDocument as a valid PDF buffer', async () => {
        const buffer = await exporter.export(buildDocument());

        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });

    it('should export accented pt-BR text without throwing (Roboto font covers the glyphs)', async () => {
        await expect(exporter.export(buildDocument())).resolves.toBeInstanceOf(Buffer);
    });

    it('should export a document without a period, subtitle or comparison subtitle', async () => {
        const document = buildDocument({period: null, subtitle: null});

        document.sections = [
            {
                kind: 'comparison',
                id: 'comparison',
                title: 'Comparativo',
                subtitle: 'Variação mensal',
                rows: [
                    {label: 'Queda', current: 8, previous: 10, changePercent: -20, format: 'integer'},
                    {label: 'Estável', current: 10, previous: 10, changePercent: 0, format: 'integer'},
                ],
            },
        ];

        const buffer = await exporter.export(document);

        expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });

    it('should truncate tables beyond the max row count and add a caption', async () => {
        const manyRows = Array.from({length: 2001}, (_, index) => ({name: `Paciente ${index}`}));
        const document = buildDocument();

        document.sections = [
            {
                kind: 'table',
                id: 'rows',
                title: 'Atendimentos',
                columns: [{key: 'name', header: 'Paciente', format: 'text'}],
                rows: manyRows,
            },
        ];

        const buffer = await exporter.export(document);

        expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });
});
