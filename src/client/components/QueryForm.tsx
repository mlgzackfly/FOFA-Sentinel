import { useState, useEffect, useRef } from 'react';
import {
  searchFofa,
  getFofaStats,
  getFofaHostAggregation,
  getFofaAccountInfo,
  searchAllFofa,
  scanWithPoc,
} from '../utils/api';
import { getAllPocScripts, startBackgroundScan, getPocSession } from '../utils/poc-api';
import { useTranslation } from '../hooks/useTranslation';
import './QueryForm.css';

type QueryTab = 'search' | 'stats' | 'host' | 'account';

import { type FofaQueryResult } from '../../shared/types';

interface QueryFormProps {
  tab: QueryTab;
  onResult: (result: FofaQueryResult, pocScriptId?: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function QueryForm({ tab, onResult, loading, setLoading }: QueryFormProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [fields, setFields] = useState('host,ip,port');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['host', 'ip', 'port']));

  // Common FOFA fields options
  const commonFields = [
    { value: 'host', label: 'Host' },
    { value: 'ip', label: 'IP' },
    { value: 'port', label: 'Port' },
    { value: 'protocol', label: 'Protocol' },
    { value: 'country', label: 'Country' },
    { value: 'title', label: 'Title' },
    { value: 'domain', label: 'Domain' },
    { value: 'os', label: 'OS' },
    { value: 'server', label: 'Server' },
    { value: 'icp', label: 'ICP' },
    { value: 'link', label: 'Link' },
    { value: 'header', label: 'Header' },
    { value: 'banner', label: 'Banner' },
    { value: 'cert', label: 'Cert' },
    { value: 'body', label: 'Body' },
    { value: 'icon', label: 'Icon' },
    { value: 'fid', label: 'FID' },
    { value: 'cidr', label: 'CIDR' },
    { value: 'city', label: 'City' },
    { value: 'asn', label: 'ASN' },
    { value: 'latitude', label: 'Latitude' },
    { value: 'longitude', label: 'Longitude' },
    { value: 'product', label: 'Product' },
    { value: 'version', label: 'Version' },
    { value: 'lastupdatetime', label: 'Last Update Time' },
    { value: 'jarm', label: 'JARM' },
  ];

  // Update fields string when selectedFields changes
  useEffect(() => {
    const fieldsArray = Array.from(selectedFields).filter(Boolean);
    const newFieldsString = fieldsArray.join(',') || '';
    if (newFieldsString !== fields) {
      setFields(newFieldsString);
    }
  }, [selectedFields]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize selectedFields from fields string on mount
  useEffect(() => {
    if (fields) {
      const fieldsArray = fields.split(',').map(f => f.trim()).filter(Boolean);
      setSelectedFields(new Set(fieldsArray));
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldToggle = (fieldValue: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldValue)) {
      newSelected.delete(fieldValue);
    } else {
      newSelected.add(fieldValue);
    }
    setSelectedFields(newSelected);
  };
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(100);
  const [fetchAll, setFetchAll] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'custom'>('all');
  const [dateAfter, setDateAfter] = useState('');
  const [dateBefore, setDateBefore] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    fetched: number;
    total: number;
    pages: number;
    message: string;
  } | null>(null);
  const [selectedPocScript, setSelectedPocScript] = useState<string>('');
  const [pocScripts, setPocScripts] = useState<
    Array<{ scriptId: string; name: string; enabled: boolean }>
  >([]);
  const [pocScanning, setPocScanning] = useState(false);
  const [pocProgress, setPocProgress] = useState({ current: 0, total: 0 });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load PoC scripts on mount
  useEffect(() => {
    const loadPocScripts = async () => {
      try {
        const data = await getAllPocScripts();
        setPocScripts(
          data.scripts
            .filter(s => s.enabled)
            .map(s => ({
              scriptId: s.scriptId,
              name: s.name,
              enabled: s.enabled,
            }))
        );
      } catch (error) {
        console.error('Failed to load PoC scripts:', error);
      }
    };
    loadPocScripts();
  }, []);

  const encodeBase64 = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      throw new Error(t('errors.invalidQuery'));
    }
  };

  const buildQueryWithDateFilter = (baseQuery: string): string => {
    // Remove any existing date-related syntax from the query
    const cleanedQuery = baseQuery
      .replace(/\s*&&\s*after="[^"]*"/gi, '')
      .replace(/\s*&&\s*before="[^"]*"/gi, '')
      .replace(/after="[^"]*"\s*&&\s*/gi, '')
      .replace(/before="[^"]*"\s*&&\s*/gi, '')
      .replace(/\s*&&\s*after="[^"]*"\s*&&\s*before="[^"]*"/gi, '')
      .replace(/\s*&&\s*before="[^"]*"\s*&&\s*after="[^"]*"/gi, '')
      .replace(/after="[^"]*"/gi, '')
      .replace(/before="[^"]*"/gi, '')
      .replace(/\s*&&\s*&&/g, ' &&')
      .replace(/^\s*&&\s*/, '')
      .replace(/\s*&&\s*$/, '')
      .trim();

    // If date filter is set to "all" or no dates are selected, return cleaned query
    if (dateFilter === 'all' || (!dateAfter && !dateBefore)) {
      return cleanedQuery;
    }

    // Build date query from date picker values
    let dateQuery = '';
    if (dateAfter) {
      dateQuery += `after="${dateAfter}"`;
    }
    if (dateBefore) {
      if (dateQuery) dateQuery += ' && ';
      dateQuery += `before="${dateBefore}"`;
    }

    if (cleanedQuery) {
      return `${cleanedQuery} && ${dateQuery}`;
    }
    return dateQuery;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalQuery = buildQueryWithDateFilter(query);
      const qbase64 = encodeBase64(finalQuery);
      let result;

      switch (tab) {
        case 'search':
          if (fetchAll) {
            setProgress({
              fetched: 0,
              total: 0,
              pages: 0,
              message: t('query.fetchingAll') || 'Fetching all results...',
            });
            result = await searchAllFofa(
              {
                qbase64,
                fields: fields || undefined,
                size: Math.min(size, 10000),
                maxResults: 100000,
              },
              progressData => {
                setProgress(progressData);
              }
            );
            setProgress(null);
          } else {
            result = await searchFofa({
              qbase64,
              fields: fields || undefined,
              page,
              size,
              full: true,
            });
          }

          if (result && !result.error) {
            const historyResponse = await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: finalQuery,
                query_base64: qbase64,
                fields,
                page: fetchAll ? 1 : page,
                size: fetchAll ? result.fetched || result.results?.length || 0 : size,
                full: 1,
              }),
            });
            const historyData = await historyResponse.json();
            if (historyData.id) {
              await fetch(`/api/history/${historyData.id}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  result_data: result,
                  total_size: result.size || result.fetched || result.results?.length || 0,
                  page: fetchAll ? 1 : result.page || 1,
                }),
              });
            }
          }
          break;
        case 'stats':
          result = await getFofaStats({
            qbase64,
          });
          break;
        case 'host':
          result = await getFofaHostAggregation({
            qbase64,
            size: size || undefined,
          });
          break;
        case 'account':
          result = await getFofaAccountInfo();
          break;
      }

      // Pass selectedPocScript to QueryResults
      onResult(result, selectedPocScript || undefined);

      // Auto-execute PoC scan if selected and result has hosts (only for search tab)
      // Run this asynchronously to avoid blocking the UI
      if (
        selectedPocScript &&
        tab === 'search' &&
        result &&
        !result.error &&
        'results' in result &&
        Array.isArray(result.results) &&
        result.results.length > 0
      ) {
        // Execute in background without blocking
        executeAutoPocScan(result, finalQuery).catch(err => {
          console.error('Auto PoC scan failed:', err);
          setPocScanning(false);
          setPocProgress({ current: 0, total: 0 });
        });
      } else {
        // Reset PoC scanning state if no scan is needed
        setPocScanning(false);
        setPocProgress({ current: 0, total: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
      onResult({ error: true, errmsg: err instanceof Error ? err.message : t('errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  // Extract hosts from query result
  const extractHostsFromResult = (result: FofaQueryResult): string[] => {
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
  };

  // Auto-execute PoC scan after query completes
  const executeAutoPocScan = async (result: FofaQueryResult, query: string) => {
    const hosts = extractHostsFromResult(result);
    if (hosts.length === 0) {
      return;
    }

    if (!selectedPocScript) {
      return;
    }

    setPocScanning(true);
    setPocProgress({ current: 0, total: hosts.length });

    try {
      // Get PoC script name for session name
      const pocScript = pocScripts.find(s => s.scriptId === selectedPocScript);
      const pocName = pocScript
        ? `Auto Scan: ${pocScript.name} - ${query || 'FOFA Query'}`
        : `Auto Scan: ${query || 'FOFA Query'}`;
      const pocDescription = pocScript
        ? `Automatic PoC scan (${pocScript.name}) for ${hosts.length} hosts from FOFA query`
        : `Automatic PoC scan for ${hosts.length} hosts from FOFA query`;

      // Start background scan - this will run on server and continue even if user navigates away
      const response = await startBackgroundScan(hosts, {
        pocScriptId: selectedPocScript,
        timeout: 30,
        name: pocName,
        description: pocDescription,
        query: query,
        useRscScan: false,
      });

      // Update progress to show scan started (0/hosts.length means started but not yet scanned)
      setPocProgress({ current: 0, total: hosts.length });

      // Clear any existing poll interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Poll session status to update progress
      const pollInterval = setInterval(async () => {
        try {
          const session = await getPocSession(response.sessionId);
          if (session) {
            const scanned = session.scannedHosts || 0;
            const total = session.totalHosts || hosts.length;
            setPocProgress({ current: scanned, total: total });

            // If scan is completed or failed, stop polling
            if (session.status === 'completed' || session.status === 'failed') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              // Keep scanning state for a moment to show completion, then reset
              setTimeout(() => {
                setPocScanning(false);
                setPocProgress({ current: 0, total: 0 });
              }, 2000);
            }
          }
        } catch (pollError) {
          console.error('Failed to poll session status:', pollError);
          // Continue polling even if one request fails
        }
      }, 2000); // Poll every 2 seconds

      pollIntervalRef.current = pollInterval;

      // Stop polling after 5 minutes (safety timeout)
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setPocScanning(false);
        setPocProgress({ current: 0, total: 0 });
      }, 5 * 60 * 1000);

      console.log(`Background PoC scan started for ${hosts.length} hosts, session: ${response.sessionId}`);
    } catch (error) {
      console.error('Failed to start auto PoC scan:', error);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setPocScanning(false);
      setPocProgress({ current: 0, total: 0 });
    }
  };

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  if (tab === 'account') {
    return (
      <div className="query-form">
        <form onSubmit={handleSubmit} className="query-form-content">
          <div className="query-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              aria-label="Get FOFA account information"
            >
              {loading ? t('common.loading') : t('query.getAccountInfo')}
            </button>
          </div>
        </form>
        {error && <div className="query-form-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="query-form">
      <form onSubmit={handleSubmit} className="query-form-content">
        <div className="query-form-field">
          <label className="query-form-label">
            <span className="label-prefix">$</span>
            {t('query.queryLabel')}
          </label>
          <textarea
            className="query-form-input query-form-textarea"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='ip="103.35.168.38"'
            required
            rows={3}
          />
        </div>

        {tab === 'search' && (
          <>
            <div className="query-form-field">
              <label className="query-form-label">
                <span className="label-prefix">#</span>
                {t('query.fieldsLabel')}
              </label>
              <div className="fields-checkbox-group">
                <div className="fields-checkbox-grid">
                  {commonFields.map(field => (
                    <label key={field.value} className="fields-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field.value)}
                        onChange={() => handleFieldToggle(field.value)}
                        disabled={loading}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
                <div className="fields-custom-input">
                  <input
                    type="text"
                    className="query-form-input"
                    value={fields}
                    onChange={e => {
                      setFields(e.target.value);
                      const fieldsArray = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
                      setSelectedFields(new Set(fieldsArray));
                    }}
                    placeholder="host,ip,port (or use checkboxes above)"
                    disabled={loading}
                  />
                  <small className="fields-hint">
                    {t('query.fieldsHint') || 'Select fields above or enter custom fields separated by commas'}
                  </small>
                </div>
              </div>
            </div>

            <div className="query-form-row">
              <div className="query-form-field">
                <label className="query-form-label">
                  <span className="label-prefix">#</span>
                  {t('query.pageLabel')}
                </label>
                <input
                  type="number"
                  className="query-form-input"
                  value={page}
                  onChange={e => setPage(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>

              <div className="query-form-field">
                <label className="query-form-label">
                  <span className="label-prefix">#</span>
                  {t('query.sizeLabel')}
                </label>
                <input
                  type="number"
                  className="query-form-input"
                  value={size}
                  onChange={e => setSize(parseInt(e.target.value) || 100)}
                  min={1}
                  max={10000}
                />
              </div>
            </div>

            <div className="query-form-field">
              <label className="query-form-checkbox">
                <input
                  type="checkbox"
                  checked={fetchAll}
                  onChange={e => setFetchAll(e.target.checked)}
                />
                <span>{t('query.fetchAllLabel')}</span>
              </label>
            </div>

            <div className="query-form-field">
              <label className="query-form-label">
                <span className="label-prefix">#</span>
                {t('query.dateFilter')}
              </label>
              <div className="query-form-date-options">
                <label className="query-form-radio">
                  <input
                    type="radio"
                    name="dateFilter"
                    value="all"
                    checked={dateFilter === 'all'}
                    onChange={e => setDateFilter(e.target.value as 'all' | 'custom')}
                  />
                  <span>{t('query.dateFilterAll')}</span>
                </label>
                <label className="query-form-radio">
                  <input
                    type="radio"
                    name="dateFilter"
                    value="custom"
                    checked={dateFilter === 'custom'}
                    onChange={e => setDateFilter(e.target.value as 'all' | 'custom')}
                  />
                  <span>{t('query.dateFilterCustom')}</span>
                </label>
              </div>
              {dateFilter === 'custom' && (
                <div className="query-form-date-inputs">
                  <div className="query-form-date-field">
                    <label className="query-form-date-label">{t('query.dateAfter')}</label>
                    <input
                      type="date"
                      className="query-form-input"
                      value={dateAfter}
                      onChange={e => setDateAfter(e.target.value)}
                    />
                  </div>
                  <div className="query-form-date-field">
                    <label className="query-form-date-label">{t('query.dateBefore')}</label>
                    <input
                      type="date"
                      className="query-form-input"
                      value={dateBefore}
                      onChange={e => setDateBefore(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'host' && (
          <div className="query-form-field">
            <label className="query-form-label">
              <span className="label-prefix">#</span>
              SIZE
            </label>
            <input
              type="number"
              className="query-form-input"
              value={size}
              onChange={e => setSize(parseInt(e.target.value) || 100)}
              min={1}
            />
          </div>
        )}

        {tab === 'search' && (
          <div className="query-form-field">
            <label className="query-form-label">
              <span className="label-prefix">⚠</span>
              {t('query.pocScanLabel')}
            </label>
            <select
              className="query-form-input query-form-select"
              value={selectedPocScript}
              onChange={e => setSelectedPocScript(e.target.value)}
              disabled={loading || pocScanning}
            >
              <option value="">{t('query.pocScanNone')}</option>
              {pocScripts.map(script => (
                <option key={script.scriptId} value={script.scriptId}>
                  {script.name}
                </option>
              ))}
            </select>
            {pocScanning && (
              <div className="poc-scan-progress">
                {t('query.pocScanning')} ({pocProgress.current}/{pocProgress.total})
              </div>
            )}
          </div>
        )}

        <div className="query-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || pocScanning || !query.trim()}
            aria-label={`Execute ${tab} query`}
          >
            {loading ? t('common.executing') : t('common.execute')}
          </button>
        </div>
      </form>
      {error && <div className="query-form-error">{error}</div>}
      {progress && (
        <div className="query-form-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress.total > 0 ? (progress.fetched / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="progress-text">
            {progress.message} ({progress.fetched.toLocaleString()} /{' '}
            {progress.total.toLocaleString()})
          </div>
        </div>
      )}
    </div>
  );
}
