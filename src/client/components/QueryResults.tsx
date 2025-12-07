import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExportButton } from './ExportButton';
import { HealthCheckStatus } from './HealthCheckStatus';
import { RSCScanStatus } from './RSCScanStatus';
import { type FofaQueryResult } from '../../shared/types';
import { type ExportData } from '../utils/export';
import {
  checkHostsHealth,
  type HealthCheckResult,
  scanRSCs,
  type RSCScanResult,
  scanWithPoc,
  type PocScanResult,
} from '../utils/api';
import { createPocSession, getAllPocScripts } from '../utils/poc-api';
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
  const [checkSummary, setCheckSummary] = useState<{
    total: number;
    alive: number;
    dead: number;
  } | null>(null);
  const [scanningAll, setScanningAll] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scanResults, setScanResults] = useState<Record<string, RSCScanResult | PocScanResult>>({});
  const [scanSummary, setScanSummary] = useState<{
    total: number;
    vulnerable: number;
    safe: number;
  } | null>(null);
  const [saveToPoc, setSaveToPoc] = useState(false);
  const [pocSessionId, setPocSessionId] = useState<string | null>(null);
  const [selectedPocScript, setSelectedPocScript] = useState<string>('');
  const [pocScripts, setPocScripts] = useState<Array<{ scriptId: string; name: string; enabled: boolean }>>([]);

  // Load PoC scripts on mount
  useEffect(() => {
    const loadPocScripts = async () => {
      try {
        const data = await getAllPocScripts();
        setPocScripts(data.scripts.filter(s => s.enabled).map(s => ({
          scriptId: s.scriptId,
          name: s.name,
          enabled: s.enabled,
        })));
      } catch (error) {
        console.error('Failed to load PoC scripts:', error);
      }
    };
    loadPocScripts();
  }, []);

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
        hostValue = String(rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? '').trim();
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

        batchResults.forEach(checkResult => {
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

  // Batch scan all hosts - supports both RSC scan and PoC scan
  const handleScanAll = async () => {
    const hosts = extractHosts();
    if (hosts.length === 0) {
      return;
    }

    // If PoC script is selected, use PoC scan; otherwise use RSC scan
    const usePocScan = selectedPocScript && selectedPocScript !== '';

    setScanningAll(true);
    setScanProgress({ current: 0, total: hosts.length });
    setScanSummary(null);

    let sessionId: string | null = null;

    try {
      // Create PoC session if saveToPoc is enabled
      if (saveToPoc) {
        const query = 'query' in result && result.query ? String(result.query) : undefined;
        const pocName = usePocScan
          ? `PoC Scan: ${pocScripts.find(s => s.scriptId === selectedPocScript)?.name || 'Custom PoC'}`
          : `Scan: ${query || 'RSC Scan'}`;
        const pocDescription = usePocScan
          ? `PoC vulnerability scan for ${hosts.length} hosts`
          : `RSC vulnerability scan for ${hosts.length} hosts`;
        const session = await createPocSession(pocName, pocDescription, query);
        sessionId = session.sessionId;
        setPocSessionId(sessionId);
      }

      // Scan hosts in batches to avoid overwhelming the server
      const batchSize = 5;
      const resultsMap: Record<string, RSCScanResult | PocScanResult> = {};
      let vulnerableCount = 0;
      let safeCount = 0;
      const allResults: (RSCScanResult | PocScanResult)[] = [];

      for (let i = 0; i < hosts.length; i += batchSize) {
        const batch = hosts.slice(i, i + batchSize);
        let batchResults: (RSCScanResult | PocScanResult)[] = [];

        if (usePocScan) {
          // Use PoC scan
          batchResults = await scanWithPoc(batch, selectedPocScript, {
            timeout: 15,
            sessionId: sessionId || undefined,
            saveToPoc: false, // Don't create new session, use existing sessionId
          });
        } else {
          // Use RSC scan
          batchResults = await scanRSCs(batch, {
            timeout: 15,
            sessionId: sessionId || undefined,
            saveToPoc: false, // Don't create new session, use existing sessionId
          });
        }

        batchResults.forEach(scanResult => {
          resultsMap[scanResult.host] = scanResult;
          allResults.push(scanResult);
          if (scanResult.vulnerable === true) {
            vulnerableCount++;
          } else if (scanResult.vulnerable === false) {
            safeCount++;
          }
        });

        setScanResults({ ...resultsMap });
        setScanProgress({ current: Math.min(i + batchSize, hosts.length), total: hosts.length });
      }

      setScanSummary({
        total: hosts.length,
        vulnerable: vulnerableCount,
        safe: safeCount,
      });
    } catch (error) {
      console.error('Failed to scan all hosts:', error);
    } finally {
      setScanningAll(false);
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
                {'results' in result &&
                Array.isArray(result.results) &&
                result.results.length > 0 ? (
                  <>
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
                    <div className="scan-actions-group">
                      <label className="poc-select-label">
                        <span>{t('query.results.selectPoc')}:</span>
                        <select
                          className="poc-select"
                          value={selectedPocScript}
                          onChange={e => setSelectedPocScript(e.target.value)}
                          disabled={scanningAll}
                        >
                          <option value="">{t('query.results.useRscScan')}</option>
                          {pocScripts.map(script => (
                            <option key={script.scriptId} value={script.scriptId}>
                              {script.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="save-to-poc-checkbox">
                        <input
                          type="checkbox"
                          checked={saveToPoc}
                          onChange={e => setSaveToPoc(e.target.checked)}
                          disabled={scanningAll}
                        />
                        <span>{t('query.results.saveToPoc')}</span>
                      </label>
                      <button
                        className="btn-secondary btn-scan-all"
                        onClick={handleScanAll}
                        disabled={scanningAll}
                        aria-label="Scan all hosts"
                      >
                        {scanningAll
                          ? `${t('query.results.scanning')} (${scanProgress.current}/${scanProgress.total})`
                          : t('query.results.scanAll')}
                      </button>
                    </div>
                    {pocSessionId && (
                      <div className="poc-session-link">
                        <a
                          href="#"
                      onClick={e => {
                        e.preventDefault();
                        // Navigate to Scan Results page
                        window.location.hash = '#scan-results';
                      }}
                        >
                          {t('query.results.viewInPoc')}
                        </a>
                      </div>
                    )}
                  </>
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
            {scanSummary && (
              <div className="query-results-summary">
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('query.results.summary.total')}:</span>
                  <span className="summary-value">{scanSummary.total}</span>
                </div>
                <div className="summary-item summary-vulnerable">
                  <span className="summary-label">{t('query.results.summary.vulnerable')}:</span>
                  <span className="summary-value">{scanSummary.vulnerable}</span>
                </div>
                <div className="summary-item summary-safe">
                  <span className="summary-label">{t('query.results.summary.safe')}:</span>
                  <span className="summary-value">{scanSummary.safe}</span>
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
                      <th>{t('query.results.status')}</th>
                      <th>{t('query.results.rscScan')}</th>
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
                        hostValue = String(
                          rowObj.host ?? rowObj.HOST ?? rowObj.Host ?? rowObj[0] ?? ''
                        );
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
                            <td className="rsc-scan-cell">
                              {hostValue ? (
                                <RSCScanStatus
                                  host={hostValue}
                                  externalResult={scanResults[hostValue]}
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
                            <td className="rsc-scan-cell">
                              {hostValue ? (
                                <RSCScanStatus
                                  host={hostValue}
                                  externalResult={scanResults[hostValue]}
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
