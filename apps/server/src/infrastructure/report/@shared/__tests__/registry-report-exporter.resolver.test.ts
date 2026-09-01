import {mock} from 'jest-mock-extended';
import type {ReportExporter} from '@application/report/exporters';
import {InvalidInputException} from '@domain/@shared/exceptions';
import {RegistryReportExporterResolver} from '../registry-report-exporter.resolver';

describe('RegistryReportExporterResolver', () => {
    it('should resolve the exporter registered for the requested format', () => {
        const pdfExporter = mock<ReportExporter>({format: 'PDF'});
        const xlsxExporter = mock<ReportExporter>({format: 'XLSX'});
        const resolver = new RegistryReportExporterResolver([pdfExporter, xlsxExporter]);

        expect(resolver.resolve('PDF')).toBe(pdfExporter);
        expect(resolver.resolve('XLSX')).toBe(xlsxExporter);
    });

    it('should throw when no exporter is registered for the requested format', () => {
        const resolver = new RegistryReportExporterResolver([mock<ReportExporter>({format: 'PDF'})]);

        expect(() => resolver.resolve('XLSX')).toThrow(InvalidInputException);
    });
});
