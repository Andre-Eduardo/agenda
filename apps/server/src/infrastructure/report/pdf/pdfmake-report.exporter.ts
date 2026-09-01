import {Injectable} from '@nestjs/common';
import type {Content, ContextPageSize, Margins, TableCell, TDocumentDefinitions} from 'pdfmake/interfaces';
import PdfPrinter from 'pdfmake/js/Printer';
import type {
    ReportColumn,
    ReportColumnsSection,
    ReportComparisonSection,
    ReportDocument,
    ReportKpiSection,
    ReportSection,
    ReportTableSection,
    ReportTextSection,
} from '@application/report/documents/report-document';
import {ReportDocumentLabel as D, translateReportLabel} from '@application/report/documents/report-document.labels';
import {ReportExporter, type ReportExportFormat} from '@application/report/exporters';
import {ReportValueFormatter} from '../@shared/report-value.formatter';
import {ROBOTO_FONT_FAMILY, robotoFonts, robotoVirtualFs} from './pdfmake-fonts';

const MAX_TABLE_ROWS = 2000;

const KPIS_PER_ROW = 4;

const KPI_GAP = 8;

const COLUMNS_PRIMARY_WIDTH = '66%';
const COLUMNS_SECONDARY_WIDTH = '33%';
const COLUMNS_GAP = 16;

const MARGINS = {
    page: [28, 76, 28, 40],
    header: [28, 16, 28, 0],
    headerCompany: [0, 8, 0, 0],
    headerMeta: [0, 2, 0, 0],
    headerRule: [0, 6, 0, 0],
    reportPeriod: [0, 8, 0, 0],
    footer: [28, 10, 28, 0],
    heading: [0, 14, 0, 6],
    card: [6, 6, 6, 6],
    cardValue: [0, 2, 0, 0],
    cardRow: [0, 0, 0, KPI_GAP],
    subtitle: [0, 0, 0, 4],
    caption: [0, 4, 0, 0],
} satisfies Record<string, Margins>;

const COLORS = {
    muted: '#6b7280',
    border: '#d1d5db',
    headerFill: '#dfdfec',
    positive: '#15803d',
    negative: '#b91c1c',
} as const;

type Translator = (key: (typeof D)[keyof typeof D]) => string;

/**
 * pdfmake >=0.3 calls `urlResolver.resolve()`/`resolved()` for every embedded font, even when the
 * font is a plain in-memory Buffer (not a URL) — this report never loads fonts from a URL, so the
 * resolver is a no-op that satisfies the interface pdfmake now requires unconditionally.
 */
const NOOP_URL_RESOLVER = {
    resolve: (): void => undefined,
    resolved: (): Promise<void> => Promise.resolve(),
};

@Injectable()
export class PdfmakeReportExporter extends ReportExporter {
    readonly format: ReportExportFormat = 'PDF';

    readonly contentType = 'application/pdf';

    readonly fileExtension = 'pdf';

    private readonly printer = new PdfPrinter(robotoFonts, robotoVirtualFs, NOOP_URL_RESOLVER);

    export(document: ReportDocument): Promise<Buffer> {
        return this.toBuffer(this.definition(document));
    }

    private definition(document: ReportDocument): TDocumentDefinitions {
        const formatter = new ReportValueFormatter(document.context);
        const t: Translator = (key) => translateReportLabel(document.context.locale, key);

        return {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: MARGINS.page,
            defaultStyle: {font: ROBOTO_FONT_FAMILY, fontSize: 9},
            header: (_currentPage: number, _pageCount: number, pageSize: ContextPageSize) =>
                this.header(document, formatter, t, pageSize),
            footer: (currentPage: number, pageCount: number) => ({
                margin: MARGINS.footer,
                columns: [
                    {
                        text: `${t(D.generated_at)}: ${formatter.format(document.generatedAt, 'date')}`,
                        color: COLORS.muted,
                        fontSize: 8,
                    },
                    {
                        text: translateReportLabel(document.context.locale, D.page_of, {
                            page: currentPage,
                            total: pageCount,
                        }),
                        alignment: 'right',
                        color: COLORS.muted,
                        fontSize: 8,
                    },
                ],
            }),
            content: [
                ...(document.period ? [this.reportPeriod(document.period.label, t)] : []),
                ...document.sections.map((section) => this.section(section, formatter, t)),
            ],
        };
    }

    private header(
        document: ReportDocument,
        formatter: ReportValueFormatter,
        t: Translator,
        pageSize: ContextPageSize
    ): Content {
        const [left, , right] = MARGINS.header;
        const ruleWidth = pageSize.width - left - right;

        return {
            margin: MARGINS.header,
            stack: [
                {text: document.title, bold: true, fontSize: 15, alignment: 'center'},
                ...(document.subtitle
                    ? [{text: document.subtitle, bold: true, fontSize: 12, margin: MARGINS.headerCompany}]
                    : []),
                {
                    margin: MARGINS.headerMeta,
                    columns: [
                        {
                            text: [
                                {text: `${t(D.generated_at)}: `, color: COLORS.muted},
                                {text: formatter.format(document.generatedAt, 'date')},
                            ],
                            fontSize: 8,
                        },
                        ...(document.period
                            ? [
                                  {
                                      text: [
                                          {text: `${t(D.period)}: `, color: COLORS.muted},
                                          {text: document.period.label},
                                      ],
                                      alignment: 'right' as const,
                                      fontSize: 8,
                                  },
                              ]
                            : []),
                    ],
                },
                {
                    margin: MARGINS.headerRule,
                    canvas: [
                        {type: 'line', x1: 0, y1: 0, x2: ruleWidth, y2: 0, lineWidth: 0.5, lineColor: COLORS.border},
                    ],
                },
            ],
        };
    }

    private reportPeriod(label: string, t: Translator): Content {
        return {
            text: [
                {text: `${t(D.report_period)}: `, color: COLORS.muted},
                {text: label, bold: true},
            ],
            fontSize: 9,
            margin: MARGINS.reportPeriod,
        };
    }

    private columnsSection(section: ReportColumnsSection, formatter: ReportValueFormatter, t: Translator): Content {
        return {
            columnGap: COLUMNS_GAP,
            columns: [
                {width: COLUMNS_PRIMARY_WIDTH, stack: section.primary.map((s) => this.section(s, formatter, t))},
                {width: COLUMNS_SECONDARY_WIDTH, stack: section.secondary.map((s) => this.section(s, formatter, t))},
            ],
        };
    }

    private section(section: ReportSection, formatter: ReportValueFormatter, t: Translator): Content {
        if (section.kind === 'kpi') {
            return this.kpiSection(section, formatter);
        }

        if (section.kind === 'comparison') {
            return this.comparisonSection(section, formatter, t);
        }

        if (section.kind === 'table') {
            return this.tableSection(section, formatter, t);
        }

        if (section.kind === 'text') {
            return this.textSection(section);
        }

        if (section.kind === 'columns') {
            return this.columnsSection(section, formatter, t);
        }

        /* istanbul ignore next -- unreachable: TypeScript enforces exhaustiveness over ReportSection['kind'] */
        throw new Error(`Unsupported report section kind: ${JSON.stringify(section satisfies never)}`);
    }

    private heading(text: string, pageBreak = false): Content {
        return {text, bold: true, fontSize: 11, margin: MARGINS.heading, ...(pageBreak && {pageBreak: 'before'})};
    }

    private kpiSection(section: ReportKpiSection, formatter: ReportValueFormatter): Content {
        const cards: TableCell[] = section.items.map((item) => ({
            stack: [
                {text: item.label, color: COLORS.muted, fontSize: 8},
                {text: formatter.format(item.value, item.format), bold: true, fontSize: 13, margin: MARGINS.cardValue},
            ],
            margin: MARGINS.card,
        }));

        const rows: Content[] = [];

        for (let index = 0; index < cards.length; index += KPIS_PER_ROW) {
            const slice: TableCell[] = cards.slice(index, index + KPIS_PER_ROW);
            const filledCount = slice.length;

            // Pad the row to keep the grid aligned with rows above/below, but leave the
            // trailing slots blank (no fillColor) instead of rendering an empty card.
            while (slice.length < KPIS_PER_ROW) {
                slice.push({stack: []});
            }

            const body: TableCell[] = [];
            const widths: Array<string | number> = [];

            slice.forEach((card, cardIndex) => {
                if (cardIndex > 0) {
                    body.push({text: ''});
                    widths.push(KPI_GAP);
                }

                body.push(card);
                widths.push('*');
            });

            rows.push({
                table: {widths, body: [body]},
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    fillColor: (_row: number, _node: unknown, column: number) =>
                        column % 2 === 0 && column / 2 < filledCount ? COLORS.headerFill : null,
                },
                margin: MARGINS.cardRow,
            });
        }

        return [this.heading(section.title), ...rows];
    }

    private comparisonSection(
        section: ReportComparisonSection,
        formatter: ReportValueFormatter,
        t: Translator
    ): Content {
        const body = [
            this.headerCells(
                [t(D.metric), t(D.current), t(D.previous), t(D.change)],
                ['left', 'right', 'right', 'right']
            ),
            ...section.rows.map((row) => [
                {text: row.label},
                {text: formatter.format(row.current, row.format), alignment: 'right' as const},
                {text: formatter.format(row.previous, row.format), alignment: 'right' as const},
                {
                    text: formatter.formatChange(row.changePercent),
                    alignment: 'right' as const,
                    color: this.changeColor(row.changePercent),
                },
            ]),
        ];

        return [
            this.heading(section.title),
            ...(section.subtitle
                ? [{text: section.subtitle, color: COLORS.muted, fontSize: 8, margin: MARGINS.subtitle}]
                : []),
            {table: {headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body}, layout: this.tableLayout()},
        ];
    }

    private textSection(section: ReportTextSection): Content {
        return [this.heading(section.title), {text: section.body}];
    }

    private tableSection(section: ReportTableSection, formatter: ReportValueFormatter, t: Translator): Content {
        const heading = this.heading(section.title);

        if (section.rows.length === 0) {
            return [heading, {text: section.emptyMessage ?? t(D.no_data), color: COLORS.muted, italics: true}];
        }

        const shown = section.rows.slice(0, MAX_TABLE_ROWS);

        const body = [
            this.headerCells(
                section.columns.map((column) => column.header),
                section.columns.map((column) => column.align ?? 'left')
            ),
            ...shown.map((row) =>
                section.columns.map((column) => ({
                    text: formatter.format(row[column.key] ?? null, column.format),
                    alignment: column.align ?? 'left',
                }))
            ),
        ];

        const {total} = section;

        if (total) {
            body.push(
                section.columns.map((column) => ({
                    text: formatter.format(total[column.key] ?? null, column.format),
                    alignment: column.align ?? 'left',
                    bold: true,
                }))
            );
        }

        const truncated = section.rows.length > shown.length;

        return [
            heading,
            {
                table: {headerRows: 1, keepWithHeaderRows: 1, widths: this.widths(section.columns), body},
                layout: this.tableLayout(),
            },
            ...(section.note ? [this.caption(section.note)] : []),
            ...(truncated
                ? [
                      this.caption(
                          translateReportLabel(formatter.locale, D.truncated_rows, {
                              shown: shown.length,
                              total: section.rows.length,
                          })
                      ),
                  ]
                : []),
        ];
    }

    private caption(text: string): Content {
        return {text, color: COLORS.muted, italics: true, fontSize: 8, margin: MARGINS.caption};
    }

    private headerCells(headers: string[], alignments: Array<'left' | 'center' | 'right'>): Content[] {
        return headers.map((header, index) => ({
            text: header,
            bold: true,
            alignment: alignments[index] ?? 'left',
            fillColor: COLORS.headerFill,
        }));
    }

    private widths(columns: ReportColumn[]): Array<string | number> {
        return columns.map((column) => (column.width && column.width > 1 ? '*' : 'auto'));
    }

    private changeColor(changePercent: number): string | undefined {
        if (changePercent > 0) {
            return COLORS.positive;
        }

        return changePercent < 0 ? COLORS.negative : undefined;
    }

    private tableLayout() {
        return {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => COLORS.border,
            paddingTop: () => 4,
            paddingBottom: () => 4,
        };
    }

    private async toBuffer(definition: TDocumentDefinitions): Promise<Buffer> {
        const pdf = await this.printer.createPdfKitDocument(definition);

        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];

            pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdf.on('end', () => resolve(Buffer.concat(chunks)));
            pdf.on('error', reject);
            pdf.end();
        });
    }
}
