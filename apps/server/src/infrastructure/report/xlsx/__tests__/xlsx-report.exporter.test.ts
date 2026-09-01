import ExcelJS from 'exceljs';
import type {ReportDocument, ReportFormatContext} from '@application/report/documents/report-document';
import {XlsxReportExporter} from '../xlsx-report.exporter';

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
                        {key: 'date', header: 'Data', format: 'date'},
                    ],
                    rows: [{name: 'Maria', amount: 150, date: new Date('2026-01-15T15:30:00Z')}],
                    total: {name: 'Total', amount: 150, date: null},
                },
            ],
            secondary: [
                {
                    kind: 'comparison',
                    id: 'comparison',
                    title: 'Comparativo',
                    subtitle: 'Variação mensal',
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

const reopen = async (buffer: Buffer): Promise<ExcelJS.Workbook> => {
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    return workbook;
};

describe('XlsxReportExporter', () => {
    const exporter = new XlsxReportExporter();

    it('should expose its format metadata', () => {
        expect(exporter.format).toBe('XLSX');
        expect(exporter.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(exporter.fileExtension).toBe('xlsx');
    });

    it('should export a ReportDocument as a valid XLSX buffer', async () => {
        const buffer = await exporter.export(buildDocument());

        expect(Buffer.isBuffer(buffer)).toBe(true);
        // XLSX files are zip archives, whose magic bytes start with "PK".
        expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
    });

    it('should write the document title, subtitle and generated-at header rows', async () => {
        const workbook = await reopen(await exporter.export(buildDocument()));
        const sheet = workbook.worksheets[0];

        expect(sheet.getCell('A1').value).toBe('Relatório de Atendimentos');
        expect(sheet.getCell('A2').value).toBe('Clínica Saúde Total');
        expect(sheet.getCell('A3').value).toBe('Período');
        expect(sheet.getCell('B3').value).toBe('Janeiro/2026');
        expect(sheet.getCell('A4').value).toBe('Gerado em');
    });

    it('should apply a currency number format to a currency cell', async () => {
        const workbook = await reopen(await exporter.export(buildDocument()));
        const sheet = workbook.worksheets[0];

        const amountCell = sheet.getCell('B11');

        expect(amountCell.value).toBe(150);
        expect(amountCell.numFmt).toContain('R$');
    });

    it('should sanitize the sheet name and cap it at 31 characters', async () => {
        const buffer = await exporter.export(buildDocument());
        const workbook = await reopen(buffer);

        expect(workbook.worksheets[0].name).toBe('Relatório');
        expect(workbook.worksheets[0].name.length).toBeLessThanOrEqual(31);
    });

    it('should export a document without a period, subtitle, comparison subtitle or total row', async () => {
        const document = buildDocument({period: null, subtitle: null});

        document.sections = [
            {
                kind: 'table',
                id: 'rows',
                title: 'Atendimentos',
                columns: [{key: 'name', header: 'Paciente', format: 'text'}],
                rows: [{name: 'Maria'}],
            },
        ];

        const buffer = await exporter.export(document);
        const workbook = await reopen(buffer);
        const sheet = workbook.worksheets[0];

        expect(sheet.getCell('A1').value).toBe('Relatório de Atendimentos');
        expect(sheet.getCell('A2').value).toBe('Gerado em');
        expect(sheet.getCell('A4').value).toBe('Atendimentos');
    });
});
