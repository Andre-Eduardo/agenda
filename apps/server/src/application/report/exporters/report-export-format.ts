export const reportExportFormats = ['PDF', 'XLSX'] as const;

export type ReportExportFormat = (typeof reportExportFormats)[number];
