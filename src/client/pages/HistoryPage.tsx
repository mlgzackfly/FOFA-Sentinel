import { useState, useEffect } from 'react';
import { HistoryList } from '../components/HistoryList';
import './HistoryPage.css';

export function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history?limit=100');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      loadHistory();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleExport = async (id: number) => {
    try {
      const response = await fetch(`/api/history/${id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fofa_export_${id}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <div className="history-page">
      <div className="history-page-header">
        <h1 className="history-page-title">
          <span className="history-page-title-prefix">[</span>
          QUERY HISTORY
        </h1>
        <p className="history-page-subtitle">View and manage your search history</p>
      </div>

      {loading ? (
        <div className="history-loading">LOADING...</div>
      ) : (
        <HistoryList
          history={history}
          onDelete={handleDelete}
          onExport={handleExport}
          onRefresh={loadHistory}
        />
      )}
    </div>
  );
}

