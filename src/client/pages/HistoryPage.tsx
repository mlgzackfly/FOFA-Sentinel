import { useState, useEffect } from 'react';
import { HistoryList } from '../components/HistoryList';
import { useTranslation } from '../hooks/useTranslation';
import { type HistoryItem } from '../../shared/types';
import './HistoryPage.css';

export function HistoryPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/history?limit=100');
      if (!response.ok) {
        throw new Error(t('errors.failedToLoad'));
      }
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error: any) {
      setError(error.message || t('errors.failedToLoad'));
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(t('errors.failedToDelete'));
      }
      loadHistory();
    } catch (error: any) {
      setError(error.message || t('errors.failedToDelete'));
      console.error('Failed to delete:', error);
    }
  };


  return (
    <div className="history-page">
      <div className="history-page-header">
        <h1 className="history-page-title">
          <span className="history-page-title-prefix">[</span>
          {t('history.title')}
        </h1>
        <p className="history-page-subtitle">{t('history.subtitle')}</p>
      </div>

      {error && (
        <div className="history-error">
          <span className="error-prefix">{t('common.error')}:</span> {error}
          <button className="error-dismiss" onClick={() => setError(null)} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      {loading ? (
        <div className="history-loading">{t('common.loading')}</div>
      ) : (
        <HistoryList
          history={history}
          onDelete={handleDelete}
          onRefresh={loadHistory}
        />
      )}
    </div>
  );
}

