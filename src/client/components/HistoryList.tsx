import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import { type ExportData, type ExportFormat, convertToCSV, convertToTXT, getMimeType, getFileExtension, ensureFileExtension } from '../utils/export';
import { type HistoryItem as SharedHistoryItem } from '../../shared/types';
import './HistoryList.css';

interface HistoryExportButtonWrapperProps {
  historyId: number;
  query: string;
  exportData: ExportData | null;
  onLoadResults: () => Promise<void>;
}

function HistoryExportButtonWrapper({ historyId, query, exportData, onLoadResults }: HistoryExportButtonWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportClick = async (format: ExportFormat) => {
    if (!exportData) {
      if (!isLoading) {
        setIsLoading(true);
        try {
          await onLoadResults();
        } catch (error) {
          console.error('Failed to load results:', error);
          setIsLoading(false);
          return;
        }
      }
      return;
    }

    let content = '';
    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        break;
      case 'txt':
        content = convertToTXT(exportData);
        break;
      case 'csv':
        content = convertToCSV(exportData);
        break;
    }

    const mimeType = getMimeType(format);
    const extension = getFileExtension(format);

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const downloadFilename = ensureFileExtension(
      `fofa_${historyId}_${Date.now()}`,
      extension
    );
    a.download = downloadFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsLoading(false);
  };

  if (!exportData) {
    return null;
  }

  return (
    <ExportButton
      data={exportData}
      filename={`fofa_${historyId}_${Date.now()}`}
      onExportClick={handleExportClick}
      isLoading={isLoading}
    />
  );
}

interface HistoryItem {
  id: number;
  task_id: string;
  query: string;
  fields: string | null;
  page: number;
  size: number;
  full: number;
  created_at: string;
  result_count: number;
}

interface HistoryListProps {
  history: SharedHistoryItem[];
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function HistoryList({ history, onDelete, onRefresh }: HistoryListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Array<ExportData & { total_size?: number; result_data?: unknown }>>>({});
  const [loadingResults, setLoadingResults] = useState<number | null>(null);
  const [exportData, setExportData] = useState<Record<number, ExportData | null>>({});

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
      
      const allResults: unknown[] = [];
      data.forEach((result: { result_data?: unknown }) => {
        const resultData = result.result_data;
        if (resultData && typeof resultData === 'object' && resultData !== null) {
          if ('results' in resultData && Array.isArray(resultData.results)) {
            allResults.push(...resultData.results);
          } else if (Array.isArray(resultData)) {
            allResults.push(...resultData);
          }
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
                aria-label={`${expandedId === item.id ? t('history.collapse') : t('history.expand')} task ${item.id}`}
              >
                <span className="toggle-icon">
                  {expandedId === item.id ? '▼' : '▶'}
                </span>
                <span className="history-item-title">{item.task_id || `TASK-${item.id.toString().padStart(6, '0')}`}</span>
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
              <div className="history-item-query-section">
                <div className="query-section-label">{t('history.query')}:</div>
                <div className="query-section-content">{item.query}</div>
              </div>
              {loadingResults === item.id ? (
                <div className="results-loading">{t('common.loading')}</div>
              ) : results[item.id] && results[item.id].length > 0 ? (
                <div className="results-content">
                  {results[item.id].map((result, idx: number) => (
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
                <div className="results-empty">{t('history.noResultsSaved') || 'No results saved'}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
