// src/lib/download-utils.ts
// =============================================================================
// File Download Utilities
// =============================================================================

/**
 * Download content as a text file
 * @param filename - Name of the file to download
 * @param content - Text content to download
 * @param mime - MIME type (default: text/plain)
 */
export function downloadTextFile(
    filename: string,
    content: string,
    mime = 'text/plain;charset=utf-8;'
): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

/**
 * Download content as a CSV file
 * @param filename - Name of the CSV file
 * @param content - CSV content
 */
export function downloadCsv(filename: string, content: string): void {
    downloadTextFile(filename, content, 'text/csv;charset=utf-8;');
}
