import {ReportDocumentLabel, translateReportLabel} from '../report-document.labels';

describe('translateReportLabel', () => {
    it('should return the plain label when no args are given', () => {
        expect(translateReportLabel('pt-BR', ReportDocumentLabel.generated_at)).toBe('Gerado em');
        expect(translateReportLabel('en-US', ReportDocumentLabel.generated_at)).toBe('Generated at');
        expect(translateReportLabel('es-ES', ReportDocumentLabel.generated_at)).toBe('Generado el');
    });

    it('should interpolate args into the template', () => {
        expect(translateReportLabel('pt-BR', ReportDocumentLabel.page_of, {page: 2, total: 5})).toBe('Página 2 de 5');
    });

    it('should fall back to an empty string for a missing interpolation token', () => {
        expect(translateReportLabel('pt-BR', ReportDocumentLabel.page_of, {page: 2})).toBe('Página 2 de ');
    });
});
