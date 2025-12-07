import { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import { HealthCheckStatus } from './HealthCheckStatus';
import { type FofaQueryResult } from '../../shared/types';
import { type ExportData } from '../utils/export';
import { checkHostsHealth, type HealthCheckResult } from '../utils/api';
import './QueryResults.css';

interface QueryResultsProps {
  result: FofaQueryResult;
  tab: string;
}

export function QueryResults({ result, tab }: QueryResultsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [checkResults, setCheckResults] = useState<Record<string, HealthCheckResult>>({});
  const [checkSummary, setCheckSummary] = useState<{ total: number; alive: number; dead: number } | null>(null);

  // Extract all hosts from results - must be before early returns
  const extractHosts = useCallback((): string[] => {
    if (!result || !('results' in result) || !Array.isArray(result.results)) {
      return [];
    }

    const hosts: string[] = [];
    result.results.forEach((row: unknown) => {
      let hostValue = '';
      if (Array.isArray(row) && row.length > 0) {
        hostValue = String(row[0] ?? '').trim();
      } else if (typeof row === 'object' && row !== null) {
        const rowObj = row as Record<string, unknown>;
        hostValue = String(
          rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? ''
        ).trim();
      }
      if (hostValue && !hosts.includes(hostValue)) {
        hosts.push(hostValue);
      }
    });
    return hosts;
  }, [result]);

  const handleCopy = async () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Early returns after all hooks
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

  // Batch check all hosts
  const handleCheckAll = async () => {
    const hosts = extractHosts();
    if (hosts.length === 0) {
      return;
    }

    setCheckingAll(true);
    setCheckProgress({ current: 0, total: hosts.length });
    setCheckSummary(null);

    try {
      // Check hosts in batches to avoid overwhelming the server
      const batchSize = 10;
      const resultsMap: Record<string, HealthCheckResult> = {};
      let aliveCount = 0;
      let deadCount = 0;

      for (let i = 0; i < hosts.length; i += batchSize) {
        const batch = hosts.slice(i, i + batchSize);
        const batchResults = await checkHostsHealth(batch, { timeout: 5000 });

        batchResults.forEach((checkResult) => {
          resultsMap[checkResult.host] = checkResult;
          if (checkResult.alive) {
            aliveCount++;
          } else {
            deadCount++;
          }
        });

        setCheckResults({ ...resultsMap });
        setCheckProgress({ current: Math.min(i + batchSize, hosts.length), total: hosts.length });
      }

      setCheckSummary({
        total: hosts.length,
        alive: aliveCount,
        dead: deadCount,
      });
    } catch (error) {
      console.error('Failed to check all hosts:', error);
    } finally {
      setCheckingAll(false);
    }
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
                {'results' in result && Array.isArray(result.results) && result.results.length > 0 ? (
                  <button
                    className="btn-secondary btn-check-all"
                    onClick={handleCheckAll}
                    disabled={checkingAll}
                    aria-label="Check all hosts"
                  >
                    {checkingAll
                      ? `${t('query.results.checking')} (${checkProgress.current}/${checkProgress.total})`
                      : t('query.results.checkAll')}
                  </button>
                ) : null}
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
            {checkSummary && (
              <div className="query-results-summary">
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('query.results.summary.total')}:</span>
                  <span className="summary-value">{checkSummary.total}</span>
                </div>
                <div className="summary-item summary-alive">
                  <span className="summary-label">{t('query.results.summary.alive')}:</span>
                  <span className="summary-value">{checkSummary.alive}</span>
                </div>
                <div className="summary-item summary-dead">
                  <span className="summary-label">{t('query.results.summary.dead')}:</span>
                  <span className="summary-value">{checkSummary.dead}</span>
                </div>
              </div>
            )}
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
                      // Extract host from row (usually first column or 'host' field)
                      let hostValue = '';
                      if (Array.isArray(row) && row.length > 0) {
                        hostValue = String(row[0] ?? '');
                      } else if (typeof row === 'object' && row !== null) {
                        const rowObj = row as Record<string, unknown>;
                        hostValue =
                          String(rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? '');
                      }

                      if (Array.isArray(row)) {
                        return (
                          <tr key={rowIdx}>
                            {row.map((cell: unknown, cellIdx: number) => (
                              <td key={cellIdx}>{String(cell ?? '-')}</td>
                            ))}
                            <td className="health-check-cell">
                              {hostValue ? (
                                <HealthCheckStatus
                                  host={hostValue}
                                  externalResult={checkResults[hostValue]}
                                />
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      } else if (typeof row === 'object' && row !== null) {
                        return (
                          <tr key={rowIdx}>
                            {Object.values(row).map((cell: unknown, cellIdx: number) => (
                              <td key={cellIdx}>{String(cell ?? '-')}</td>
                            ))}
                            <td className="health-check-cell">
                              {hostValue ? (
                                <HealthCheckStatus
                                  host={hostValue}
                                  externalResult={checkResults[hostValue]}
                                />
                              ) : (
                                '-'
                              )}
                            </td>
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
