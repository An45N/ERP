/**
 * Utility functions for exporting data to CSV format
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value: any = item[col.key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert dates to readable format
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // Handle objects (like customer/supplier in invoices/bills)
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        return value.name || JSON.stringify(value);
      }
      
      // Escape commas and quotes in strings
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForExport(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date for CSV export
 */
export function formatDateForExport(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}
