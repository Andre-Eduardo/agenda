import type {ReportDocument} from '../documents/report-document';
import type {ReportExportFormat} from './report-export-format';

export abstract class ReportExporter {
    abstract readonly format: ReportExportFormat;

    abstract readonly contentType: string;

    abstract readonly fileExtension: string;

    abstract export(document: ReportDocument): Promise<Buffer>;
}
