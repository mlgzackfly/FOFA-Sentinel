import { useState, useCallback, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { HealthCheckStatus } from './HealthCheckStatus';
import { RSCScanStatus } from './RSCScanStatus';
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
import {
  checkHostsHealth,
  type HealthCheckResult,
  scanRSCs,
  type RSCScanResult,
} from '../utils/api';
import { createPocSession } from '../utils/poc-api';
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
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    setExporting(true);

    try {
      // Get data to export - use existing exportData or fetch from API
      let dataToExport = exportData;

      if (!dataToExport) {
        setIsLoading(true);
        try {
          // Fetch data directly from API
          const response = await fetch(`/api/history/${historyId}/results`);
          if (!response.ok) {
            throw new Error('Failed to fetch results');
          }
          const data = await response.json();

          // Also trigger parent's loadResults to update state
          await onLoadResults();

          // Extract all results from the response
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
            dataToExport = { results: allResults };
          } else {
            console.error('No results to export');
            setExporting(false);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to load results:', error);
          setExporting(false);
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }

      // Data is loaded, proceed with export
      let content = '';
      switch (format) {
        case 'json':
          content = JSON.stringify(dataToExport, null, 2);
          break;
        case 'txt':
          content = convertToTXT(dataToExport);
          break;
        case 'csv':
          content = convertToCSV(dataToExport);
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

  // Always show dropdown button, even if data is not loaded
  return (
    <div className="export-button-container" ref={buttonRef}>
      <button
        className="btn-secondary export-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting || isLoading}
        aria-label={t('common.export')}
        aria-expanded={isOpen}
      >
        {isLoading
          ? t('common.loading') || 'LOADING...'
          : exporting
            ? t('common.exporting') || 'EXPORTING...'
            : t('common.export')}
        <span className="export-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <>
          <div className="export-overlay" onClick={() => setIsOpen(false)} />
          <div className="export-dropdown">
            {formats.map(format => (
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
  const [scanningAll, setScanningAll] = useState<Record<number, boolean>>({});
  const [scanProgress, setScanProgress] = useState<
    Record<number, { current: number; total: number }>
  >({});
  const [scanResults, setScanResults] = useState<Record<number, Record<string, RSCScanResult>>>({});
  const [scanSummary, setScanSummary] = useState<
    Record<number, { total: number; vulnerable: number; safe: number }>
  >({});
  const [saveToPoc, setSaveToPoc] = useState<Record<number, boolean>>({});

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
            hostValue = String(rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? '').trim();
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

        batchResults.forEach(checkResult => {
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

  // Batch scan all hosts for RSC vulnerability
  const handleScanAll = async (historyId: number) => {
    const resultData = exportData[historyId];
    if (!resultData) {
      return;
    }

    const hosts = extractHostsFromResult(resultData);
    if (hosts.length === 0) {
      return;
    }

    setScanningAll(prev => ({ ...prev, [historyId]: true }));
    setScanProgress(prev => ({ ...prev, [historyId]: { current: 0, total: hosts.length } }));
    setScanSummary(prev => {
      const newSummary = { ...prev };
      delete newSummary[historyId];
      return newSummary;
    });

    let sessionId: string | null = null;

    try {
      // Create PoC session if saveToPoc is enabled
      if (saveToPoc[historyId]) {
        const historyItem = history.find(h => h.id === historyId);
        const session = await createPocSession(
          `History Scan: ${historyItem?.query || 'RSC Scan'}`,
          `RSC vulnerability scan from history #${historyId}`,
          historyItem?.query
        );
        sessionId = session.sessionId;
      }

      const batchSize = 5;
      const resultsMap: Record<string, RSCScanResult> = {};
      let vulnerableCount = 0;
      let safeCount = 0;

      for (let i = 0; i < hosts.length; i += batchSize) {
        const batch = hosts.slice(i, i + batchSize);

        // Create session on first batch if saveToPoc is enabled
        if (saveToPoc[historyId] && i === 0 && !sessionId) {
          const historyItem = history.find(h => h.id === historyId);
          const session = await createPocSession(
            `History Scan: ${historyItem?.query || 'RSC Scan'}`,
            `RSC vulnerability scan from history #${historyId}`,
            historyItem?.query
          );
          sessionId = session.sessionId;
        }

        const batchResults = await scanRSCs(batch, {
          timeout: 15,
          sessionId: sessionId || undefined,
          saveToPoc: false, // Don't create new session, use existing sessionId
        });

        batchResults.forEach(scanResult => {
          resultsMap[scanResult.host] = scanResult;
          if (scanResult.vulnerable === true) {
            vulnerableCount++;
          } else if (scanResult.vulnerable === false) {
            safeCount++;
          }
        });

        setScanResults(prev => ({
          ...prev,
          [historyId]: { ...prev[historyId], ...resultsMap },
        }));
        setScanProgress(prev => ({
          ...prev,
          [historyId]: { current: Math.min(i + batchSize, hosts.length), total: hosts.length },
        }));
      }

      setScanSummary(prev => ({
        ...prev,
        [historyId]: {
          total: hosts.length,
          vulnerable: vulnerableCount,
          safe: safeCount,
        },
      }));
    } catch (error) {
      console.error('Failed to scan all hosts:', error);
    } finally {
      setScanningAll(prev => ({ ...prev, [historyId]: false }));
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
                            <>
                              <button
                                className="btn-secondary btn-check-all"
                                onClick={() => handleCheckAll(item.id)}
                                disabled={checkingAll[item.id] || false}
                              >
                                {checkingAll[item.id]
                                  ? `${t('query.results.checking')} (${checkProgress[item.id]?.current || 0}/${checkProgress[item.id]?.total || 0})`
                                  : t('query.results.checkAll')}
                              </button>
                              <div className="scan-actions-group">
                                <label className="save-to-poc-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={saveToPoc[item.id] || false}
                                    onChange={e =>
                                      setSaveToPoc(prev => ({
                                        ...prev,
                                        [item.id]: e.target.checked,
                                      }))
                                    }
                                    disabled={scanningAll[item.id] || false}
                                  />
                                  <span>{t('query.results.saveToPoc')}</span>
                                </label>
                                <button
                                  className="btn-secondary btn-scan-all"
                                  onClick={() => handleScanAll(item.id)}
                                  disabled={scanningAll[item.id] || false}
                                >
                                  {scanningAll[item.id]
                                    ? `${t('query.results.scanning')} (${scanProgress[item.id]?.current || 0}/${scanProgress[item.id]?.total || 0})`
                                    : t('query.results.scanAll')}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        {checkSummary[item.id] && (
                          <div className="query-results-summary">
                            <div className="summary-item summary-total">
                              <span className="summary-label">
                                {t('query.results.summary.total')}:
                              </span>
                              <span className="summary-value">{checkSummary[item.id].total}</span>
                            </div>
                            <div className="summary-item summary-alive">
                              <span className="summary-label">
                                {t('query.results.summary.alive')}:
                              </span>
                              <span className="summary-value">{checkSummary[item.id].alive}</span>
                            </div>
                            <div className="summary-item summary-dead">
                              <span className="summary-label">
                                {t('query.results.summary.dead')}:
                              </span>
                              <span className="summary-value">{checkSummary[item.id].dead}</span>
                            </div>
                          </div>
                        )}
                        {scanSummary[item.id] && (
                          <div className="query-results-summary">
                            <div className="summary-item summary-total">
                              <span className="summary-label">
                                {t('query.results.summary.total')}:
                              </span>
                              <span className="summary-value">{scanSummary[item.id].total}</span>
                            </div>
                            <div className="summary-item summary-vulnerable">
                              <span className="summary-label">
                                {t('query.results.summary.vulnerable')}:
                              </span>
                              <span className="summary-value">
                                {scanSummary[item.id].vulnerable}
                              </span>
                            </div>
                            <div className="summary-item summary-safe">
                              <span className="summary-label">
                                {t('query.results.summary.safe')}:
                              </span>
                              <span className="summary-value">{scanSummary[item.id].safe}</span>
                            </div>
                          </div>
                        )}
                        {hasResults ? (
                          <div className="history-results-table">
                            <table>
                              <thead>
                                <tr>
                                  {(() => {
                                    const resultsArray = (resultData as { results: unknown[] })
                                      .results;
                                    const firstResult = resultsArray[0];
                                    if (Array.isArray(firstResult)) {
                                      return (
                                        <>
                                          {firstResult.map((_, colIdx: number) => (
                                            <th key={colIdx}>COL_{colIdx + 1}</th>
                                          ))}
                                          <th className="health-check-header">STATUS</th>
                                          <th className="rsc-scan-header">
                                            {t('query.results.rscScan')}
                                          </th>
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
                                          <th className="rsc-scan-header">
                                            {t('query.results.rscScan')}
                                          </th>
                                        </>
                                      );
                                    }
                                    return null;
                                  })()}
                                </tr>
                              </thead>
                              <tbody>
                                {(resultData as { results: unknown[] }).results.map(
                                  (row: unknown, rowIdx: number) => {
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
                                          <td className="rsc-scan-cell">
                                            {hostValue ? (
                                              <RSCScanStatus
                                                host={hostValue}
                                                externalResult={scanResults[item.id]?.[hostValue]}
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
                                          {Object.values(row).map(
                                            (cell: unknown, cellIdx: number) => (
                                              <td key={cellIdx}>{String(cell ?? '-')}</td>
                                            )
                                          )}
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
                                          <td className="rsc-scan-cell">
                                            {hostValue ? (
                                              <RSCScanStatus
                                                host={hostValue}
                                                externalResult={scanResults[item.id]?.[hostValue]}
                                              />
                                            ) : (
                                              '-'
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    }
                                    return null;
                                  }
                                )}
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
