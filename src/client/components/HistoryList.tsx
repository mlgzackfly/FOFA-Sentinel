import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import './HistoryList.css';

interface HistoryExportButtonWrapperProps {
  historyId: number;
  query: string;
  exportData: any;
  onLoadResults: () => Promise<void>;
}

function HistoryExportButtonWrapper({ historyId, query, exportData, onLoadResults }: HistoryExportButtonWrapperProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportClick = async (format: 'json' | 'txt' | 'csv') => {
    if (!exportData && !isLoading) {
      setIsLoading(true);
      try {
        await onLoadResults();
      } catch (error) {
        console.error('Failed to load results:', error);
        setIsLoading(false);
        return;
      }
    }

    if (!exportData) {
      setIsLoading(false);
      return;
    }

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

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'txt':
        content = convertToTXT(exportData);
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      case 'csv':
        content = convertToCSV(exportData);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let downloadFilename = `fofa_${historyId}_${Date.now()}`;
    if (!downloadFilename.endsWith(`.${extension}`)) {
      downloadFilename = `${downloadFilename}.${extension}`;
    }
    a.download = downloadFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsLoading(false);
  };

  return (
    <ExportButton
      data={exportData}
      filename={`fofa_${historyId}_${Date.now()}`}
      query={query}
      onExportClick={handleExportClick}
      isLoading={isLoading}
    />
  );
}

interface HistoryItem {
  id: number;
  query: string;
  fields: string | null;
  page: number;
  size: number;
  full: number;
  created_at: string;
  result_count: number;
}

interface HistoryListProps {
  history: HistoryItem[];
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function HistoryList({ history, onDelete, onRefresh }: HistoryListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, any[]>>({});
  const [loadingResults, setLoadingResults] = useState<number | null>(null);
  const [exportData, setExportData] = useState<Record<number, any>>({});

  const loadResults = async (id: number, expand: boolean = true) => {
    if (results[id] && exportData[id]) {
      if (expand) {
        setExpandedId(expandedId === id ? null : id);
      }
      return;
    }

    try {
      setLoadingResults(id);
      const response = await fetch(`/api/history/${id}/results`);
      const data = await response.json();
      setResults((prev) => ({ ...prev, [id]: data }));
      if (expand) {
        setExpandedId(id);
      }
      
      const allResults: any[] = [];
      data.forEach((result: any) => {
        if (result.result_data && result.result_data.results && Array.isArray(result.result_data.results)) {
          allResults.push(...result.result_data.results);
        } else if (result.result_data && Array.isArray(result.result_data)) {
          allResults.push(...result.result_data);
        }
      });
      
      if (allResults.length > 0) {
        setExportData((prev) => ({ ...prev, [id]: { results: allResults } }));
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoadingResults(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="history-list-empty">
        <span className="empty-prefix">{'>'}</span>
        {t('common.noHistory')}
      </div>
    );
  }

  return (
    <div className="history-list">
      <div className="history-list-header">
        <button className="btn-secondary" onClick={onRefresh}>
          {t('common.refresh')}
        </button>
      </div>
      {history.map((item) => (
        <div key={item.id} className="history-item">
          <div className="history-item-header">
            <div className="history-item-main">
              <button
                className="history-item-toggle"
                onClick={() => loadResults(item.id)}
                aria-expanded={expandedId === item.id}
                aria-label={`${expandedId === item.id ? t('history.collapse') : t('history.expand')} query results for ${item.query}`}
              >
                <span className="toggle-icon">
                  {expandedId === item.id ? '▼' : '▶'}
                </span>
                <span className="history-item-query">{item.query}</span>
              </button>
              <div className="history-item-meta">
                <span className="meta-badge">{t('history.page')}: {item.page}</span>
                <span className="meta-badge">{t('history.size')}: {item.size}</span>
                {item.full === 1 && <span className="meta-badge">{t('history.full')}</span>}
                <span className="meta-badge">{t('history.results')}: {item.result_count.toLocaleString()}</span>
              </div>
            </div>
            <div className="history-item-actions">
              {item.result_count > 0 && (
                <HistoryExportButtonWrapper
                  key={`export-${item.id}-${exportData[item.id] ? 'loaded' : 'unloaded'}`}
                  historyId={item.id}
                  query={item.query}
                  exportData={exportData[item.id]}
                  onLoadResults={() => loadResults(item.id, false)}
                />
              )}
              <button
                className="btn-action btn-danger"
                onClick={() => onDelete(item.id)}
                title={t('history.deleteQuery')}
                aria-label={`${t('history.deleteQuery')} ${item.query}`}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
          <div className="history-item-time">
            {new Date(item.created_at).toLocaleString()}
          </div>
          {expandedId === item.id && (
            <div className="history-item-results">
              {loadingResults === item.id ? (
                <div className="results-loading">{t('common.loading')}</div>
              ) : results[item.id] && results[item.id].length > 0 ? (
                <div className="results-content">
                  {results[item.id].map((result: any, idx: number) => (
                    <div key={idx} className="result-item">
                      <div className="result-header">
                        <span>{t('history.resultSet')} {idx + 1}</span>
                        <span>{t('query.results.total')}: {result.total_size || 'N/A'}</span>
                      </div>
                      <pre className="result-data">
                        {JSON.stringify(result.result_data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="results-empty">{t('history.noResultsSaved')}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
