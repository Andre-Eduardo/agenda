import type {ReportExportFormat} from './report-export-format';
import type {ReportExporter} from './report-exporter';

export abstract class ReportExporterResolver {
    abstract resolve(format: ReportExportFormat): ReportExporter;
}
