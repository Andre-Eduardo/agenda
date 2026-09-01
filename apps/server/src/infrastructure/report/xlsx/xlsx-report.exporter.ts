/* eslint-disable no-param-reassign -- ExcelJS is a mutation API: styling a row or cell means
   assigning to the object it hands back, and there is no builder form to use instead. The same
   applies to the row/column cursor below — it is a plain mutable object, not a builder. */
import {Injectable} from '@nestjs/common';
import ExcelJS from 'exceljs';
import type {
    ReportCellValue,
    ReportColumn,
    ReportComparisonSection,
    ReportDocument,
    ReportFormatContext,
    ReportKpiSection,
    ReportLeafSection,
    ReportRow,
    ReportSection,
    ReportTableSection,
    ReportTextSection,
    ReportValueFormat,
} from '@application/report/documents/report-document';
import {ReportDocumentLabel as D, translateReportLabel} from '@application/report/documents/report-document.labels';
import {ReportExporter, type ReportExportFormat} from '@application/report/exporters';
import {ReportValueFormatter} from '../@shared/report-value.formatter';
import {type XlsxNumberFormats, xlsxNumberFormats} from './xlsx-number.formats';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const FORBIDDEN_SHEET_NAME_CHARS = /[*?:\\/[\]]/g;
const MAX_SHEET_NAME_LENGTH = 31;

const HEADER_FILL: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFEFEFEF'}};

const TITLE_FONT: Partial<ExcelJS.Font> = {bold: true, size: 14};
const SECTION_TITLE_FONT: Partial<ExcelJS.Font> = {bold: true, size: 12};
const BOLD_FONT: Partial<ExcelJS.Font> = {bold: true};

type DocumentTranslator = (key: (typeof D)[keyof typeof D]) => string;

type Cursor = {row: number; column: number};

type SheetWriter = {
    sheet: ExcelJS.Worksheet;
    context: ReportFormatContext;
    formats: XlsxNumberFormats;
    t: DocumentTranslator;
    secondaryColumn: number;
};

const BASE_COLUMN_WIDTH = 14;

const DATE_COLUMN_WIDTH = 18;

const LABEL_COLUMN_WIDTH = 34;

const COMPARISON_COLUMN_COUNT = 4;

const KPI_COLUMN_COUNT = 2;

const COLUMNS_GAP = 1;

@Injectable()
export class XlsxReportExporter extends ReportExporter {
    readonly format: ReportExportFormat = 'XLSX';

    readonly contentType = XLSX_CONTENT_TYPE;

    readonly fileExtension = 'xlsx';

    async export(document: ReportDocument): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const formatter = new ReportValueFormatter(document.context);
        const t = this.translator(document);
        const sheet = workbook.addWorksheet(this.sheetName(t(D.report_sheet)));

        this.addDocumentHeader(sheet, document, formatter, t);

        sheet.views = [{state: 'frozen', ySplit: sheet.rowCount}];

        const writer: SheetWriter = {
            sheet,
            context: document.context,
            formats: xlsxNumberFormats(document.context),
            t,
            secondaryColumn: this.applyColumnWidths(sheet, document.sections),
        };
        const cursor: Cursor = {row: sheet.rowCount, column: 1};

        for (const section of document.sections) {
            this.addSection(writer, section, cursor);
        }

        const written = await workbook.xlsx.writeBuffer();

        return Buffer.from(written as ArrayBuffer);
    }

    private addDocumentHeader(
        sheet: ExcelJS.Worksheet,
        document: ReportDocument,
        formatter: ReportValueFormatter,
        t: DocumentTranslator
    ): void {
        sheet.addRow([document.title]).getCell(1).font = TITLE_FONT;

        if (document.subtitle) {
            sheet.addRow([document.subtitle]).getCell(1).font = BOLD_FONT;
        }

        if (document.period) {
            sheet.addRow([t(D.period), document.period.label]);
        }

        sheet.addRow([t(D.generated_at), formatter.format(document.generatedAt, 'date')]);
    }

    private addSection(writer: SheetWriter, section: ReportSection, cursor: Cursor): void {
        if (section.kind === 'columns') {
            const startRow = cursor.row;

            for (const leaf of section.primary) {
                this.addSection(writer, leaf, cursor);
            }

            const secondaryCursor: Cursor = {row: startRow, column: writer.secondaryColumn};

            for (const leaf of section.secondary) {
                this.addSection(writer, leaf, secondaryCursor);
            }

            cursor.row = Math.max(cursor.row, secondaryCursor.row);

            return;
        }

        if (section.kind === 'kpi') {
            this.addKpiBlock(writer, section, cursor);

            return;
        }

        if (section.kind === 'comparison') {
            this.addComparisonBlock(writer, section, cursor);

            return;
        }

        if (section.kind === 'table') {
            this.addTableBlock(writer, section, cursor);

            return;
        }

        if (section.kind === 'text') {
            this.addTextBlock(writer, section, cursor);

            return;
        }

        /* istanbul ignore next -- unreachable: TypeScript enforces exhaustiveness over ReportSection['kind'] */
        throw new Error(`Unsupported report section kind: ${JSON.stringify(section satisfies never)}`);
    }

    private addKpiBlock(writer: SheetWriter, section: ReportKpiSection, cursor: Cursor): void {
        this.addSectionTitle(writer, section.title, KPI_COLUMN_COUNT, cursor);

        for (const item of section.items) {
            const row = this.writeRow(writer, cursor, [
                item.label,
                this.cellValue(item.value, item.format, writer.context),
            ]);

            this.applyNumberFormat(writer, row.getCell(cursor.column + 1), item.format);
        }
    }

    private addComparisonBlock(writer: SheetWriter, section: ReportComparisonSection, cursor: Cursor): void {
        const {t} = writer;

        this.addSectionTitle(writer, section.title, COMPARISON_COLUMN_COUNT, cursor);

        if (section.subtitle) {
            this.addCenteredRow(writer, section.subtitle, COMPARISON_COLUMN_COUNT, cursor);
        }

        this.addHeaderRow(writer, [t(D.metric), t(D.current), t(D.previous), t(D.change)], cursor);

        for (const entry of section.rows) {
            const row = this.writeRow(writer, cursor, [
                entry.label,
                entry.current,
                entry.previous,
                entry.changePercent / 100,
            ]);

            this.applyNumberFormat(writer, row.getCell(cursor.column + 1), entry.format);
            this.applyNumberFormat(writer, row.getCell(cursor.column + 2), entry.format);
            this.applyNumberFormat(writer, row.getCell(cursor.column + 3), 'percentage');
        }
    }

    private addTableBlock(writer: SheetWriter, section: ReportTableSection, cursor: Cursor): void {
        this.addSectionTitle(writer, section.title, section.columns.length, cursor);
        this.addHeaderRow(
            writer,
            section.columns.map((column) => column.header),
            cursor
        );

        for (const row of section.rows) {
            this.addDataRow(writer, section.columns, row, cursor);
        }

        if (section.total) {
            const row = this.addDataRow(writer, section.columns, section.total, cursor);

            this.applyFont(row, cursor.column, section.columns.length, BOLD_FONT);
        }
    }

    private addTextBlock(writer: SheetWriter, section: ReportTextSection, cursor: Cursor): void {
        this.addSectionTitle(writer, section.title, 1, cursor);

        const row = this.writeRow(writer, cursor, [section.body]);

        row.getCell(cursor.column).alignment = {wrapText: true, vertical: 'top'};
    }

    private addDataRow(writer: SheetWriter, columns: ReportColumn[], source: ReportRow, cursor: Cursor): ExcelJS.Row {
        const row = this.writeRow(
            writer,
            cursor,
            columns.map((column) => this.cellValue(source[column.key] ?? null, column.format, writer.context))
        );

        columns.forEach((column, index) => {
            this.applyNumberFormat(writer, row.getCell(cursor.column + index), column.format);
            row.getCell(cursor.column + index).alignment = {horizontal: column.align ?? 'left'};
        });

        return row;
    }

    private cellValue(
        value: ReportCellValue,
        format: ReportValueFormat,
        context: ReportFormatContext
    ): ReportCellValue {
        if (value === null || value === undefined) {
            return null;
        }

        if (format === 'percentage' && typeof value === 'number') {
            return value / 100;
        }

        if (format === 'date' && value instanceof Date) {
            return this.toWallClockDate(value, context.timeZone);
        }

        return value;
    }

    /**
     * Excel dates are timezone-naive serial numbers, so writing a raw UTC `Date` would show the
     * UTC instant rather than the time the clinic actually sees. This reconstructs a UTC-labelled
     * `Date` whose numeric fields equal the wall-clock time in `timeZone`, which is what ExcelJS
     * needs to render the value correctly regardless of the server's own timezone.
     */
    private toWallClockDate(date: Date, timeZone: string): Date {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date);

        const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00';

        return new Date(
            `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`
        );
    }

    private applyNumberFormat(writer: SheetWriter, cell: ExcelJS.Cell, format: ReportValueFormat): void {
        const numberFormat = writer.formats[format];

        if (!numberFormat) {
            return;
        }

        if (typeof cell.value === 'number' || (format === 'date' && cell.value instanceof Date)) {
            cell.numFmt = numberFormat;
        }
    }

    private applyFont(row: ExcelJS.Row, column: number, count: number, font: Partial<ExcelJS.Font>): void {
        for (let index = 0; index < count; index++) {
            row.getCell(column + index).font = font;
        }
    }

    private writeRow(writer: SheetWriter, cursor: Cursor, values: ReportCellValue[]): ExcelJS.Row {
        cursor.row += 1;

        const row = writer.sheet.getRow(cursor.row);

        values.forEach((value, index) => {
            row.getCell(cursor.column + index).value = value;
        });

        return row;
    }

    private addSectionTitle(writer: SheetWriter, title: string, columnCount: number, cursor: Cursor): void {
        this.writeRow(writer, cursor, []);

        const row = this.addCenteredRow(writer, title, columnCount, cursor);

        row.getCell(cursor.column).font = SECTION_TITLE_FONT;
    }

    private addCenteredRow(writer: SheetWriter, text: string, columnCount: number, cursor: Cursor): ExcelJS.Row {
        const row = this.writeRow(writer, cursor, [text]);

        if (columnCount > 1) {
            writer.sheet.mergeCells(row.number, cursor.column, row.number, cursor.column + columnCount - 1);
        }

        row.getCell(cursor.column).alignment = {horizontal: 'center'};

        return row;
    }

    private addHeaderRow(writer: SheetWriter, values: string[], cursor: Cursor): void {
        const row = this.writeRow(writer, cursor, values);

        this.applyFont(row, cursor.column, values.length, BOLD_FONT);

        for (let index = 0; index < values.length; index++) {
            row.getCell(cursor.column + index).fill = HEADER_FILL;
        }

        row.commit();
    }

    private applyColumnWidths(sheet: ExcelJS.Worksheet, sections: ReportSection[]): number {
        const primarySections: ReportLeafSection[] = [];
        const secondarySections: ReportLeafSection[] = [];

        for (const section of sections) {
            if (section.kind === 'columns') {
                primarySections.push(...section.primary);
                secondarySections.push(...section.secondary);
            } else {
                primarySections.push(section);
            }
        }

        const primaryWidths = this.columnWidths(primarySections);

        this.setColumnWidths(sheet, primaryWidths, 1);

        const secondaryColumn = primaryWidths.length + COLUMNS_GAP + 1;

        if (secondarySections.length > 0) {
            this.setColumnWidths(sheet, this.columnWidths(secondarySections), secondaryColumn);
        }

        return secondaryColumn;
    }

    private columnWidths(sections: ReportLeafSection[]): number[] {
        const widths: number[] = [LABEL_COLUMN_WIDTH];

        const widen = (index: number, width: number): void => {
            widths[index] = Math.max(widths[index] ?? 0, width);
        };

        for (const section of sections) {
            if (section.kind === 'table') {
                section.columns.forEach((column, index) => {
                    const minWidth = column.format === 'date' ? DATE_COLUMN_WIDTH : BASE_COLUMN_WIDTH;

                    widen(index, Math.max(minWidth, (column.width ?? 1) * BASE_COLUMN_WIDTH));
                });
            }

            if (section.kind === 'comparison') {
                for (let index = 1; index < COMPARISON_COLUMN_COUNT; index++) {
                    widen(index, BASE_COLUMN_WIDTH);
                }
            }

            if (section.kind === 'kpi') {
                widen(1, BASE_COLUMN_WIDTH);
            }
        }

        return widths;
    }

    private setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[], startColumn: number): void {
        widths.forEach((width, index) => {
            sheet.getColumn(startColumn + index).width = width;
        });
    }

    private sheetName(name: string): string {
        const cleaned = name.replaceAll(FORBIDDEN_SHEET_NAME_CHARS, ' ').replaceAll(/\s+/g, ' ').trim();

        /* istanbul ignore next -- defensive fallback: the only caller passes a static, non-empty translated label */
        return (cleaned || 'Sheet').slice(0, MAX_SHEET_NAME_LENGTH).trim();
    }

    private translator(document: ReportDocument): DocumentTranslator {
        return (key) => translateReportLabel(document.context.locale, key);
    }
}
