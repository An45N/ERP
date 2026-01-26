import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export PDF with progress tracking
 */
export async function exportPDFWithProgress(
  data: any,
  fileName: string,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      onProgress(10);
      
      // Create PDF
      const doc = new jsPDF();
      onProgress(30);

      // Add content (this is a simplified example)
      doc.text(fileName, 14, 15);
      onProgress(50);

      if (Array.isArray(data) && data.length > 0) {
        autoTable(doc, {
          head: [Object.keys(data[0])],
          body: data.map(row => Object.values(row)),
          startY: 25,
        });
      }
      onProgress(80);

      // Save
      doc.save(fileName);
      onProgress(100);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export Excel with progress tracking
 */
export async function exportExcelWithProgress(
  data: any,
  fileName: string,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      onProgress(10);

      // Create workbook
      const wb = XLSX.utils.book_new();
      onProgress(30);

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      onProgress(50);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      onProgress(70);

      // Write file
      XLSX.writeFile(wb, fileName);
      onProgress(100);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export CSV with progress tracking
 */
export async function exportCSVWithProgress(
  data: any[],
  fileName: string,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      onProgress(10);

      if (data.length === 0) {
        reject(new Error('No data to export'));
        return;
      }

      onProgress(30);

      // Get headers
      const headers = Object.keys(data[0]);
      onProgress(50);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            const stringValue = value === null || value === undefined ? '' : String(value);
            // Escape quotes and wrap in quotes if contains comma or quote
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      onProgress(80);

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onProgress(100);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
