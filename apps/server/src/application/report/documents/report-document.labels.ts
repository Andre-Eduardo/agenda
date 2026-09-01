import type {ReportLocale} from './report-document';

/**
 * O server não tem infraestrutura de i18n (i18next não é usado em src/), então os textos
 * fixos do "chrome" do relatório (cabeçalho, rodapé, colunas de comparação) vivem aqui como
 * um dicionário estático em vez de chaves de tradução resolvidas em runtime.
 */
export const ReportDocumentLabel = {
    generated_at: 'generated_at',
    period: 'period',
    report_period: 'report_period',
    page_of: 'page_of',
    report_sheet: 'report_sheet',
    total: 'total',
    current: 'current',
    previous: 'previous',
    change: 'change',
    metric: 'metric',
    no_data: 'no_data',
    truncated_rows: 'truncated_rows',
} as const;

export type ReportDocumentLabelKey = (typeof ReportDocumentLabel)[keyof typeof ReportDocumentLabel];

type LabelDictionary = Record<ReportDocumentLabelKey, string>;

const PT_BR: LabelDictionary = {
    generated_at: 'Gerado em',
    period: 'Período',
    report_period: 'Período do relatório',
    page_of: 'Página {{page}} de {{total}}',
    report_sheet: 'Relatório',
    total: 'Total',
    current: 'Atual',
    previous: 'Anterior',
    change: 'Variação',
    metric: 'Métrica',
    no_data: 'Sem dados para o período selecionado',
    truncated_rows: 'Mostrando {{shown}} de {{total}} linhas',
};

const EN_US: LabelDictionary = {
    generated_at: 'Generated at',
    period: 'Period',
    report_period: 'Report period',
    page_of: 'Page {{page}} of {{total}}',
    report_sheet: 'Report',
    total: 'Total',
    current: 'Current',
    previous: 'Previous',
    change: 'Change',
    metric: 'Metric',
    no_data: 'No data for the selected period',
    truncated_rows: 'Showing {{shown}} of {{total}} rows',
};

const ES_ES: LabelDictionary = {
    generated_at: 'Generado el',
    period: 'Período',
    report_period: 'Período del informe',
    page_of: 'Página {{page}} de {{total}}',
    report_sheet: 'Informe',
    total: 'Total',
    current: 'Actual',
    previous: 'Anterior',
    change: 'Variación',
    metric: 'Métrica',
    no_data: 'Sin datos para el período seleccionado',
    truncated_rows: 'Mostrando {{shown}} de {{total}} filas',
};

const DICTIONARIES: Record<ReportLocale, LabelDictionary> = {
    'pt-BR': PT_BR,
    'en-US': EN_US,
    'es-ES': ES_ES,
};

const INTERPOLATION_TOKEN = /\{\{\s*(\w+)\s*\}\}/g;

export const translateReportLabel = (
    locale: ReportLocale,
    key: ReportDocumentLabelKey,
    args?: Record<string, string | number>
): string => {
    const template = DICTIONARIES[locale][key];

    if (!args) {
        return template;
    }

    return template.replaceAll(INTERPOLATION_TOKEN, (_match, token: string) => String(args[token] ?? ''));
};
