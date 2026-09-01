import {useState} from 'react';
import {FileSpreadsheet, FileText, Loader2} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {saveFile} from '@/utils/saveFile';

/**
 * Mirrors the server's `ReportExportFormat` (`apps/server/src/application/report/exporters`).
 * Once a first report endpoint ships, replace this with the Orval-generated model.
 */
export type ReportExportFormat = 'PDF' | 'XLSX';

type ReportExportActionsProps = {
    /** The export endpoint, e.g. `/reports/appointments/export`. */
    url: string;
    /** Extra query params merged with `format` on each request (filters, date range, etc). */
    params?: Record<string, unknown>;
    /** Renders icon-only buttons for tight spaces (list toolbars, table headers). */
    compact?: boolean;
};

export function ReportExportActions({url, params, compact = false}: ReportExportActionsProps) {
    const {t} = useTranslation();
    const [exporting, setExporting] = useState<ReportExportFormat | null>(null);

    const handleExport = async (format: ReportExportFormat) => {
        setExporting(format);

        try {
            await saveFile(url, undefined, {...params, format});
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size={compact ? 'icon' : 'default'}
                disabled={exporting !== null}
                onClick={() => handleExport('PDF')}
            >
                {exporting === 'PDF' ? <Loader2 className="animate-spin" /> : <FileText />}
                {!compact && t('reportExportActions.exportPdf')}
            </Button>
            <Button
                type="button"
                variant="outline"
                size={compact ? 'icon' : 'default'}
                disabled={exporting !== null}
                onClick={() => handleExport('XLSX')}
            >
                {exporting === 'XLSX' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
                {!compact && t('reportExportActions.exportExcel')}
            </Button>
        </div>
    );
}
