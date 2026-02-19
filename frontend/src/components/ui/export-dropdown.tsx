import { useRef, useState } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToImage, exportToPdf } from '@/lib/export-utils';

interface ExportDropdownProps {
    /** The element to capture for Image/PDF. Pass a ref.current */
    targetElement?: HTMLElement | null;
    /** Base filename for the export */
    filename: string;
    /** Optional handler for CSV export */
    onExportCsv?: () => void;
    /** Disable all actions */
    disabled?: boolean;
}

export function ExportDropdown({
    targetElement,
    filename,
    onExportCsv,
    disabled = false,
}: ExportDropdownProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: 'image' | 'pdf') => {
        if (!targetElement) return;

        setIsExporting(true);
        try {
            // Small delay to ensure dropdown closes
            await new Promise((resolve) => setTimeout(resolve, 100));

            if (type === 'image') {
                await exportToImage(targetElement, filename);
            } else if (type === 'pdf') {
                await exportToPdf(targetElement, filename);
            }
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={disabled || isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={() => handleExport('image')}
                    disabled={!targetElement}
                >
                    <FileImage className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Save as Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport('pdf')}
                    disabled={!targetElement}
                >
                    <FileText className="mr-2 h-4 w-4 text-red-500" />
                    <span>Save as PDF</span>
                </DropdownMenuItem>
                {onExportCsv && (
                    <DropdownMenuItem onClick={onExportCsv}>
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
                        <span>Save as CSV</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
