import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './HistoryList.css';

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
  onExport: (id: number) => void;
  onRefresh: () => void;
}

export function HistoryList({ history, onDelete, onExport, onRefresh }: HistoryListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, any[]>>({});
  const [loadingResults, setLoadingResults] = useState<number | null>(null);

  const loadResults = async (id: number) => {
    if (results[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }

    try {
      setLoadingResults(id);
      const response = await fetch(`/api/history/${id}/results`);
      const data = await response.json();
      setResults({ ...results, [id]: data });
      setExpandedId(id);
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
                <span className="meta-badge">{t('history.results')}: {item.result_count}</span>
              </div>
            </div>
            <div className="history-item-actions">
              {item.result_count > 0 && (
                <button
                  className="btn-action"
                  onClick={() => onExport(item.id)}
                  title={t('history.exportToTxt')}
                  aria-label={`${t('history.exportToTxt')} for ${item.query}`}
                >
                  {t('common.export')}
                </button>
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

