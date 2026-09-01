declare module 'pdfmake/js/Printer' {
    import type {TDocumentDefinitions, TFontDictionary} from 'pdfmake/interfaces';

    type PdfPrinterUrlResolver = {
        resolve(url: string, headers: Record<string, string>): void;
        resolved(): Promise<void>;
    };

    type PdfPrinterVirtualFs = {
        existsSync(path: string): boolean;
        readFileSync(path: string): Buffer;
    };

    export default class PdfPrinter {
        constructor(fonts: TFontDictionary, virtualFs?: PdfPrinterVirtualFs, urlResolver?: PdfPrinterUrlResolver);

        createPdfKitDocument(documentDefinitions: TDocumentDefinitions): Promise<PDFKit.PDFDocument>;
    }
}
