import {Module} from '@nestjs/common';
import {type ReportExporter, ReportExporterResolver} from '@application/report/exporters';
import {RegistryReportExporterResolver} from './@shared/registry-report-exporter.resolver';
import {PdfmakeReportExporter} from './pdf/pdfmake-report.exporter';
import {XlsxReportExporter} from './xlsx/xlsx-report.exporter';

@Module({
    providers: [
        PdfmakeReportExporter,
        XlsxReportExporter,
        {
            provide: ReportExporterResolver,
            useFactory: (...exporters: ReportExporter[]) => new RegistryReportExporterResolver(exporters),
            inject: [PdfmakeReportExporter, XlsxReportExporter],
        },
    ],
    exports: [ReportExporterResolver],
})
export class ReportExporterModule {}
