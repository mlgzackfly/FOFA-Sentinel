import { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import { HealthCheckStatus } from './HealthCheckStatus';
import {
  type ExportData,
  type ExportFormat,
  convertToCSV,
  convertToTXT,
  getMimeType,
  getFileExtension,
  ensureFileExtension,
} from '../utils/export';
import { type HistoryItem as SharedHistoryItem } from '../../shared/types';
import { checkHostsHealth, type HealthCheckResult } from '../utils/api';
import './HistoryList.css';

interface HistoryExportButtonWrapperProps {
  historyId: number;
  exportData: ExportData | null;
  onLoadResults: () => Promise<void>;
}

function HistoryExportButtonWrapper({
  historyId,
  exportData,
  onLoadResults,
}: HistoryExportButtonWrapperProps) {
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

    const downloadFilename = ensureFileExtension(`fofa_${historyId}_${Date.now()}`, extension);
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

interface HistoryListProps {
  history: SharedHistoryItem[];
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function HistoryList({ history, onDelete, onRefresh }: HistoryListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [results, setResults] = useState<
    Record<number, Array<ExportData & { total_size?: number; result_data?: unknown }>>
  >({});
  const [loadingResults, setLoadingResults] = useState<number | null>(null);
  const [exportData, setExportData] = useState<Record<number, ExportData | null>>({});
  const [checkingAll, setCheckingAll] = useState<Record<number, boolean>>({});
  const [checkProgress, setCheckProgress] = useState<
    Record<number, { current: number; total: number }>
  >({});
  const [checkResults, setCheckResults] = useState<
    Record<number, Record<string, HealthCheckResult>>
  >({});
  const [checkSummary, setCheckSummary] = useState<
    Record<number, { total: number; alive: number; dead: number }>
  >({});

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
      setResults(prev => ({ ...prev, [id]: data }));
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
        setExportData(prev => ({ ...prev, [id]: { results: allResults } }));
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoadingResults(null);
    }
  };

  // Extract hosts from result data
  const extractHostsFromResult = useCallback((resultData: unknown): string[] => {
    const hosts: string[] = [];
    
    if (resultData && typeof resultData === 'object' && resultData !== null) {
      if ('results' in resultData && Array.isArray(resultData.results)) {
        resultData.results.forEach((row: unknown) => {
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
      }
    }
    
    return hosts;
  }, []);

  // Batch check all hosts for a history item
  const handleCheckAll = async (historyId: number) => {
    const resultData = exportData[historyId];
    if (!resultData) {
      return;
    }

    const hosts = extractHostsFromResult(resultData);
    if (hosts.length === 0) {
      return;
    }

    setCheckingAll(prev => ({ ...prev, [historyId]: true }));
    setCheckProgress(prev => ({ ...prev, [historyId]: { current: 0, total: hosts.length } }));
    setCheckSummary(prev => {
      const newSummary = { ...prev };
      delete newSummary[historyId];
      return newSummary;
    });

    try {
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

        setCheckResults(prev => ({
          ...prev,
          [historyId]: { ...prev[historyId], ...resultsMap },
        }));
        setCheckProgress(prev => ({
          ...prev,
          [historyId]: { current: Math.min(i + batchSize, hosts.length), total: hosts.length },
        }));
      }

      setCheckSummary(prev => ({
        ...prev,
        [historyId]: {
          total: hosts.length,
          alive: aliveCount,
          dead: deadCount,
        },
      }));
    } catch (error) {
      console.error('Failed to check all hosts:', error);
    } finally {
      setCheckingAll(prev => ({ ...prev, [historyId]: false }));
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
      {history.map(item => (
        <div key={item.id} className="history-item">
          <div className="history-item-header">
            <div className="history-item-main">
              <button
                className="history-item-toggle"
                onClick={() => loadResults(item.id)}
                aria-expanded={expandedId === item.id}
                aria-label={`${expandedId === item.id ? t('history.collapse') : t('history.expand')} task ${item.id}`}
              >
                <span className="toggle-icon">{expandedId === item.id ? '▼' : '▶'}</span>
                <span className="history-item-title">
                  {item.task_id || `TASK-${item.id.toString().padStart(6, '0')}`}
                </span>
              </button>
              <div className="history-item-meta">
                <span className="meta-badge">
                  {t('history.page')}: {item.page}
                </span>
                <span className="meta-badge">
                  {t('history.size')}: {item.size}
                </span>
                {item.full === 1 && <span className="meta-badge">{t('history.full')}</span>}
                <span className="meta-badge">
                  {t('history.results')}: {item.result_count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="history-item-actions">
              {item.result_count > 0 && (
                <HistoryExportButtonWrapper
                  key={`export-${item.id}-${exportData[item.id] ? 'loaded' : 'unloaded'}`}
                  historyId={item.id}
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
          <div className="history-item-time">{new Date(item.created_at).toLocaleString()}</div>
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
                  {results[item.id].map((result, idx: number) => {
                    const resultData = result.result_data;
                    const hasResults: boolean =
                      resultData !== null &&
                      resultData !== undefined &&
                      typeof resultData === 'object' &&
                      'results' in resultData &&
                      Array.isArray((resultData as { results: unknown }).results) &&
                      (resultData as { results: unknown[] }).results.length > 0;

                    return (
                      <div key={idx} className="result-item">
                        <div className="result-header">
                          <span>
                            {t('history.resultSet')} {idx + 1}
                          </span>
                          <span>
                            {t('query.results.total')}: {result.total_size || 'N/A'}
                          </span>
                          {hasResults && (
                            <button
                              className="btn-secondary btn-check-all"
                              onClick={() => handleCheckAll(item.id)}
                              disabled={checkingAll[item.id] || false}
                            >
                              {checkingAll[item.id]
                                ? `${t('query.results.checking')} (${checkProgress[item.id]?.current || 0}/${checkProgress[item.id]?.total || 0})`
                                : t('query.results.checkAll')}
                            </button>
                          )}
                        </div>
                        {checkSummary[item.id] && (
                          <div className="query-results-summary">
                            <div className="summary-item summary-total">
                              <span className="summary-label">{t('query.results.summary.total')}:</span>
                              <span className="summary-value">{checkSummary[item.id].total}</span>
                            </div>
                            <div className="summary-item summary-alive">
                              <span className="summary-label">{t('query.results.summary.alive')}:</span>
                              <span className="summary-value">{checkSummary[item.id].alive}</span>
                            </div>
                            <div className="summary-item summary-dead">
                              <span className="summary-label">{t('query.results.summary.dead')}:</span>
                              <span className="summary-value">{checkSummary[item.id].dead}</span>
                            </div>
                          </div>
                        )}
                        {hasResults ? (
                          <div className="history-results-table">
                            <table>
                              <thead>
                                <tr>
                                  {(() => {
                                    const resultsArray = (resultData as { results: unknown[] }).results;
                                    const firstResult = resultsArray[0];
                                    if (Array.isArray(firstResult)) {
                                      return (
                                        <>
                                          {firstResult.map((_, colIdx: number) => (
                                            <th key={colIdx}>COL_{colIdx + 1}</th>
                                          ))}
                                          <th className="health-check-header">STATUS</th>
                                        </>
                                      );
                                    } else if (
                                      typeof firstResult === 'object' &&
                                      firstResult !== null
                                    ) {
                                      return (
                                        <>
                                          {Object.keys(firstResult).map(key => (
                                            <th key={key}>{key.toUpperCase()}</th>
                                          ))}
                                          <th className="health-check-header">STATUS</th>
                                        </>
                                      );
                                    }
                                    return null;
                                  })()}
                                </tr>
                              </thead>
                              <tbody>
                                {(resultData as { results: unknown[] }).results.map((row: unknown, rowIdx: number) => {
                                  let hostValue = '';
                                  if (Array.isArray(row) && row.length > 0) {
                                    hostValue = String(row[0] ?? '').trim();
                                  } else if (typeof row === 'object' && row !== null) {
                                    const rowObj = row as Record<string, unknown>;
                                    hostValue = String(
                                      rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? ''
                                    ).trim();
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
                                              externalResult={checkResults[item.id]?.[hostValue]}
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
                                              externalResult={checkResults[item.id]?.[hostValue]}
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
                          <pre className="result-data">
                            {JSON.stringify(result.result_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="results-empty">
                  {t('history.noResultsSaved') || 'No results saved'}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
