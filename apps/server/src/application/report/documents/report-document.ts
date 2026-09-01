export type ReportLocale = 'pt-BR' | 'en-US' | 'es-ES';

export type ReportValueFormat = 'currency' | 'percentage' | 'integer' | 'number' | 'date' | 'text';

export type ReportAlignment = 'left' | 'center' | 'right';

export type ReportCellValue = string | number | Date | null;

export type ReportRow = Record<string, ReportCellValue>;

export type ReportFormatContext = {
    locale: ReportLocale;
    currency: string;
    timeZone: string;
};

export type ReportColumn = {
    key: string;
    header: string;
    format: ReportValueFormat;
    align?: ReportAlignment;
    width?: number;
};

export type ReportKpiItem = {
    label: string;
    value: ReportCellValue;
    format: ReportValueFormat;
};

export type ReportKpiSection = {
    kind: 'kpi';
    id: string;
    title: string;
    items: ReportKpiItem[];
};

export type ReportTableSection = {
    kind: 'table';
    id: string;
    title: string;
    columns: ReportColumn[];
    rows: ReportRow[];
    total?: ReportRow | null;
    emptyMessage?: string;
    note?: string | null;
};

export type ReportComparisonRow = {
    label: string;
    current: number;
    previous: number;
    changePercent: number;
    format: Extract<ReportValueFormat, 'currency' | 'integer' | 'number'>;
};

export type ReportComparisonSection = {
    kind: 'comparison';
    id: string;
    title: string;
    subtitle?: string | null;
    rows: ReportComparisonRow[];
};

export type ReportTextSection = {
    kind: 'text';
    id: string;
    title: string;
    body: string;
};

export type ReportLeafSection = ReportKpiSection | ReportTableSection | ReportComparisonSection | ReportTextSection;

export type ReportColumnsSection = {
    kind: 'columns';
    id: string;
    primary: ReportLeafSection[];
    secondary: ReportLeafSection[];
};

export type ReportSection = ReportLeafSection | ReportColumnsSection;

export type ReportPeriod = {
    from: Date;
    to: Date;
    label: string;
};

export type ReportDocument = {
    title: string;
    subtitle?: string | null;
    period: ReportPeriod | null;
    generatedAt: Date;
    context: ReportFormatContext;
    fileBaseName: string;
    sections: ReportSection[];
};
