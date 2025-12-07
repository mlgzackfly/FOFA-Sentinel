import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './QueryResults.css';

interface QueryResultsProps {
  result: any;
  tab: string;
}

export function QueryResults({ result, tab }: QueryResultsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  if (result.error) {
    return (
      <div className="query-results">
        <div className="query-results-error">
          <span className="error-prefix">{t('common.error')}:</span> {result.errmsg || t('errors.unknown')}
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    const text = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (tab) {
      case 'search':
        return (
          <div className="query-results-content">
            <div className="query-results-header">
              <div className="query-results-meta">
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.query')}:</span> {result.query || 'N/A'}
                </span>
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.total')}:</span> {result.size || 0}
                </span>
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.page')}:</span> {result.page || 1}
                </span>
              </div>
              <button 
                className="btn-secondary" 
                onClick={handleExport}
                aria-label="Copy results to clipboard"
              >
                {copied ? t('common.copied') : t('query.results.copyJson')}
              </button>
            </div>
            {result.results && result.results.length > 0 ? (
              <div className="query-results-table">
                <table>
                  <thead>
                    <tr>
                      {(() => {
                        const firstResult = result.results[0];
                        if (Array.isArray(firstResult)) {
                          return firstResult.map((_: any, idx: number) => (
                            <th key={idx}>COL_{idx + 1}</th>
                          ));
                        } else if (typeof firstResult === 'object') {
                          return Object.keys(firstResult).map((key) => (
                            <th key={key}>{key.toUpperCase()}</th>
                          ));
                        }
                        return null;
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row: any, rowIdx: number) => {
                      if (Array.isArray(row)) {
                        return (
                          <tr key={rowIdx}>
                            {row.map((cell: any, cellIdx: number) => (
                              <td key={cellIdx}>{cell || '-'}</td>
                            ))}
                          </tr>
                        );
                      } else if (typeof row === 'object') {
                        return (
                          <tr key={rowIdx}>
                            {Object.values(row).map((cell: any, cellIdx: number) => (
                              <td key={cellIdx}>{cell || '-'}</td>
                            ))}
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="query-results-empty">{t('common.noResults')}</div>
            )}
          </div>
        );
      case 'stats':
      case 'host':
      case 'account':
        return (
          <div className="query-results-content">
            <pre className="query-results-json">{JSON.stringify(result, null, 2)}</pre>
            <button 
              className="btn-secondary" 
              onClick={handleExport}
              aria-label="Copy results to clipboard"
            >
              {copied ? 'COPIED!' : 'COPY JSON'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="query-results">
      <div className="query-results-title">
        <span className="title-prefix">{'>'}</span>
        {t('query.results.title')}
      </div>
      {renderContent()}
    </div>
  );
}

