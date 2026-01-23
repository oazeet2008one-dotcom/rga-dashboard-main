// =============================================================================
// useFileDownload Hook - Blob to File Download Utility
// =============================================================================

import { useCallback } from 'react';

/**
 * Hook to handle blob-to-file download with proper cleanup.
 * 
 * Abstracts the complex logic of:
 * 1. Creating an Object URL from a Blob
 * 2. Triggering a download via temporary anchor element
 * 3. Cleaning up to prevent memory leaks
 * 
 * @example
 * ```tsx
 * function ExportButton() {
 *   const { downloadBlob } = useFileDownload();
 *   
 *   const handleExport = async () => {
 *     const blob = await api.getReport();
 *     downloadBlob(blob, 'report.csv');
 *   };
 *   
 *   return <button onClick={handleExport}>Export</button>;
 * }
 * ```
 */
export function useFileDownload() {
    /**
     * Download a Blob as a file in the browser.
     * 
     * @param blob - The blob data to download
     * @param filename - The name for the downloaded file
     */
    const downloadBlob = useCallback((blob: Blob, filename: string) => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Append to body (required for Firefox)
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Cleanup: remove element and revoke URL to prevent memory leaks
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, []);

    return { downloadBlob };
}

// =============================================================================
// Standalone Utility (Non-Hook Version)
// =============================================================================

/**
 * Download a Blob as a file (standalone version for use outside React).
 * 
 * @param blob - The blob data to download
 * @param filename - The name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export default useFileDownload;
