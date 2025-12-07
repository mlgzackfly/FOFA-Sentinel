import { useState, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './ExportButton.css';

type ExportFormat = 'json' | 'txt' | 'csv';

interface ExportButtonProps {
  data: any;
  filename?: string;
  query?: string;
  onExportClick?: (format: 'json' | 'txt' | 'csv') => void;
  isLoading?: boolean;
}

export function ExportButton({ data, filename, query, onExportClick, isLoading = false }: ExportButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const convertToCSV = (data: any): string => {
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return '';
    }

    const firstRow = data.results[0];
    let headers: string[] = [];
    let rows: any[][] = [];

    if (Array.isArray(firstRow)) {
      headers = firstRow.map((_, idx) => `COL_${idx + 1}`);
      rows = data.results.map((row: any[]) => row);
    } else if (typeof firstRow === 'object') {
      headers = Object.keys(firstRow);
      rows = data.results.map((row: any) => Object.values(row));
    }

    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell: any) => {
          const value = cell?.toString() || '';
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  };

  const convertToTXT = (data: any): string => {
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      const hosts: string[] = [];
      
      data.results.forEach((row: any) => {
        if (Array.isArray(row)) {
          const host = row[0];
          if (host && typeof host === 'string') {
            hosts.push(host);
          }
        } else if (typeof row === 'object') {
          const host = row.host || row.HOST || row[0];
          if (host && typeof host === 'string') {
            hosts.push(host);
          }
        }
      });

      return hosts.join('\n');
    }

    return '';
  };

  const handleExport = async (format: ExportFormat) => {
    if (onExportClick) {
      setIsOpen(false);
      onExportClick(format);
      return;
    }

    setExporting(true);
    setIsOpen(false);

    try {
      let content = '';
      let mimeType = '';
      let extension = '';

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'txt':
          content = convertToTXT(data);
          mimeType = 'text/plain';
          extension = 'txt';
          break;
        case 'csv':
          content = convertToCSV(data);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let downloadFilename = filename || `fofa_export_${Date.now()}`;
      if (!downloadFilename.endsWith(`.${extension}`)) {
        downloadFilename = `${downloadFilename}.${extension}`;
      }
      a.download = downloadFilename;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const formats: { value: ExportFormat; label: string }[] = [
    { value: 'json', label: 'JSON' },
    { value: 'txt', label: 'TXT' },
    { value: 'csv', label: 'CSV' },
  ];

  if (!data || !data.results || (Array.isArray(data.results) && data.results.length === 0)) {
    if (!onExportClick) {
      return null;
    }
  }

  return (
    <div className="export-button-container" ref={buttonRef}>
      <button
        className="btn-secondary export-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting || isLoading}
        aria-label={t('common.export')}
        aria-expanded={isOpen}
      >
        {isLoading ? (t('common.loading') || 'LOADING...') : exporting ? (t('common.exporting') || 'EXPORTING...') : t('common.export')}
        <span className="export-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <>
          <div className="export-overlay" onClick={() => setIsOpen(false)} />
          <div className="export-dropdown">
            {formats.map((format) => (
              <button
                key={format.value}
                className="export-option"
                onClick={() => handleExport(format.value)}
                aria-label={`${t('common.export')} as ${format.label}`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

