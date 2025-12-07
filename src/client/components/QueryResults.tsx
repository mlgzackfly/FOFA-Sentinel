import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import { type FofaQueryResult } from '../../shared/types';
import { type ExportData } from '../utils/export';
import './QueryResults.css';

interface QueryResultsProps {
  result: FofaQueryResult;
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
          <span className="error-prefix">{t('common.error')}:</span>{' '}
          {result.errmsg || t('errors.unknown')}
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
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
                  <span className="meta-label">{t('query.results.query')}:</span>{' '}
                  {'query' in result && result.query ? String(result.query) : 'N/A'}
                </span>
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.total')}:</span>{' '}
                  {'size' in result && typeof result.size === 'number' ? result.size : 0}
                </span>
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.page')}:</span>{' '}
                  {'page' in result && typeof result.page === 'number' ? result.page : 1}
                </span>
                <span className="meta-item">
                  <span className="meta-label">{t('query.results.displayed')}:</span>{' '}
                  {'results' in result && Array.isArray(result.results) ? result.results.length : 0}{' '}
                  {t('query.results.of')}{' '}
                  {'size' in result && typeof result.size === 'number' ? result.size : 0}
                </span>
              </div>
              <div className="query-results-actions">
                <button
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label="Copy results to clipboard"
                >
                  {copied ? t('common.copied') : t('query.results.copyJson')}
                </button>
                {'results' in result ? (
                  <ExportButton
                    data={
                      { results: Array.isArray(result.results) ? result.results : [] } as ExportData
                    }
                    filename={`fofa_${('query' in result ? result.query : 'query') || 'query'}_${Date.now()}`}
                  />
                ) : null}
              </div>
            </div>
            {'results' in result && Array.isArray(result.results) && result.results.length > 0 ? (
              <div className="query-results-table">
                <table>
                  <thead>
                    <tr>
                      {(() => {
                        const firstResult = result.results[0];
                        if (Array.isArray(firstResult)) {
                          return firstResult.map((_, idx: number) => (
                            <th key={idx}>COL_{idx + 1}</th>
                          ));
                        } else if (typeof firstResult === 'object' && firstResult !== null) {
                          return Object.keys(firstResult).map(key => (
                            <th key={key}>{key.toUpperCase()}</th>
                          ));
                        }
                        return null;
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row: unknown, rowIdx: number) => {
                      if (Array.isArray(row)) {
                        return (
                          <tr key={rowIdx}>
                            {row.map((cell: unknown, cellIdx: number) => (
                              <td key={cellIdx}>{String(cell ?? '-')}</td>
                            ))}
                          </tr>
                        );
                      } else if (typeof row === 'object' && row !== null) {
                        return (
                          <tr key={rowIdx}>
                            {Object.values(row).map((cell: unknown, cellIdx: number) => (
                              <td key={cellIdx}>{String(cell ?? '-')}</td>
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
            <div className="query-results-actions">
              <button
                className="btn-secondary"
                onClick={handleCopy}
                aria-label="Copy results to clipboard"
              >
                {copied ? t('common.copied') : t('query.results.copyJson')}
              </button>
              <ExportButton
                data={{ results: [], ...result } as ExportData}
                filename={`fofa_${tab}_${Date.now()}`}
              />
            </div>
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
