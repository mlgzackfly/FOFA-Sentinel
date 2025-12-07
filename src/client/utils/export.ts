/**
 * Export utility functions for converting data to various formats
 */

export interface ExportData {
  results?: unknown[];
  [key: string]: unknown;
}

export interface ExportRow {
  [key: string]: unknown;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: ExportData): string {
  if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
    return '';
  }

  const firstRow = data.results[0];
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (Array.isArray(firstRow)) {
    headers = firstRow.map((_, idx) => `COL_${idx + 1}`);
    rows = data.results.map((row) => (Array.isArray(row) ? row : [row]));
  } else if (typeof firstRow === 'object' && firstRow !== null) {
    headers = Object.keys(firstRow as ExportRow);
    rows = data.results.map((row) => {
      if (typeof row === 'object' && row !== null) {
        return Object.values(row as ExportRow);
      }
      return [row];
    });
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const value = cell?.toString() || '';
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Convert data to TXT format (hosts only)
 */
export function convertToTXT(data: ExportData): string {
  if (data.results && Array.isArray(data.results) && data.results.length > 0) {
    const hosts: string[] = [];

    data.results.forEach((row) => {
      if (Array.isArray(row)) {
        const host = row[0];
        if (host && typeof host === 'string') {
          hosts.push(host);
        }
      } else if (typeof row === 'object' && row !== null) {
        const rowObj = row as ExportRow;
        const host = (rowObj.host || rowObj.HOST || rowObj[0]) as string | undefined;
        if (host && typeof host === 'string') {
          hosts.push(host);
        }
      }
    });

    return hosts.join('\n');
  }

  return '';
}

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'txt' | 'csv';

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  return format;
}

/**
 * Ensure filename has correct extension
 */
export function ensureFileExtension(filename: string, extension: string): string {
  if (!filename.endsWith(`.${extension}`)) {
    return `${filename}.${extension}`;
  }
  return filename;
}

