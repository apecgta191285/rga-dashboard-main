import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Export an HTML element as a PNG image
 */
export async function exportToImage(element: HTMLElement, filename: string) {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Retina resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff', // Ensure white background
        });

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export to image failed:', error);
        throw error;
    }
}

/**
 * Export an HTML element as a PDF document
 */
export async function exportToPdf(element: HTMLElement, filename: string) {
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        // Calculate PDF dimensions based on A4 landscape or fit content
        // Default to A4 Landscape for dashboard widgets
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const canvasRatio = canvas.height / canvas.width;

        // Fit width, adjust height
        const printWidth = pageWidth - 20; // 10mm margins
        const printHeight = printWidth * canvasRatio;

        pdf.addImage(imgData, 'PNG', 10, 10, printWidth, printHeight);
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Export to PDF failed:', error);
        throw error;
    }
}
