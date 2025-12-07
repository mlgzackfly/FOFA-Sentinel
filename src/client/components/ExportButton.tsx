import { useState, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { convertToCSV, convertToTXT, type ExportData, type ExportFormat, getMimeType, getFileExtension, ensureFileExtension } from '../utils/export';
import './ExportButton.css';

interface ExportButtonProps {
  data: ExportData;
  filename?: string;
  onExportClick?: (format: ExportFormat) => void;
  isLoading?: boolean;
}

export function ExportButton({ data, filename, onExportClick, isLoading = false }: ExportButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

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
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          break;
        case 'txt':
          content = convertToTXT(data);
          break;
        case 'csv':
          content = convertToCSV(data);
          break;
      }

      const mimeType = getMimeType(format);
      const fileExtension = getFileExtension(format);

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const downloadFilename = ensureFileExtension(
        filename || `fofa_export_${Date.now()}`,
        fileExtension
      );
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

