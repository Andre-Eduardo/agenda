import {type ReportExporter, ReportExporterResolver, type ReportExportFormat} from '@application/report/exporters';
import {ReportExceptions} from '@application/report/report.exceptions';
import {InvalidInputException} from '@domain/@shared/exceptions';

export class RegistryReportExporterResolver extends ReportExporterResolver {
    private readonly byFormat: ReadonlyMap<ReportExportFormat, ReportExporter>;

    constructor(exporters: ReportExporter[]) {
        super();
        this.byFormat = new Map(exporters.map((exporter) => [exporter.format, exporter]));
    }

    resolve(format: ReportExportFormat): ReportExporter {
        const exporter = this.byFormat.get(format);

        if (!exporter) {
            throw new InvalidInputException(ReportExceptions.unsupported_export_format, [
                {field: 'format', reason: format},
            ]);
        }

        return exporter;
    }
}
