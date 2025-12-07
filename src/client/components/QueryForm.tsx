import { useState } from 'react';
import { searchFofa, getFofaStats, getFofaHostAggregation, getFofaAccountInfo, searchAllFofa } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import './QueryForm.css';

type QueryTab = 'search' | 'stats' | 'host' | 'account';

import { type FofaQueryResult } from '../../shared/types';

interface QueryFormProps {
  tab: QueryTab;
  onResult: (result: FofaQueryResult) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function QueryForm({ tab, onResult, loading, setLoading }: QueryFormProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [fields, setFields] = useState('host,ip,port');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(100);
  const [fetchAll, setFetchAll] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'custom'>('all');
  const [dateAfter, setDateAfter] = useState('');
  const [dateBefore, setDateBefore] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ fetched: number; total: number; pages: number; message: string } | null>(null);

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
            setProgress({ fetched: 0, total: 0, pages: 0, message: t('query.fetchingAll') || 'Fetching all results...' });
            result = await searchAllFofa(
              {
                qbase64,
                fields: fields || undefined,
                size: Math.min(size, 10000),
                maxResults: 100000,
              },
              (progressData) => {
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
                size: fetchAll ? (result.fetched || result.results?.length || 0) : size,
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
                  page: fetchAll ? 1 : (result.page || 1),
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

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
      onResult({ error: true, errmsg: err instanceof Error ? err.message : t('errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ip=&quot;103.35.168.38&quot;"
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
              <input
                type="text"
                className="query-form-input"
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="host,ip,port"
              />
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
                  onChange={(e) => setPage(parseInt(e.target.value) || 1)}
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
                  onChange={(e) => setSize(parseInt(e.target.value) || 100)}
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
                  onChange={(e) => setFetchAll(e.target.checked)}
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
                    onChange={(e) => setDateFilter(e.target.value as 'all' | 'custom')}
                  />
                  <span>{t('query.dateFilterAll')}</span>
                </label>
                <label className="query-form-radio">
                  <input
                    type="radio"
                    name="dateFilter"
                    value="custom"
                    checked={dateFilter === 'custom'}
                    onChange={(e) => setDateFilter(e.target.value as 'all' | 'custom')}
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
                      onChange={(e) => setDateAfter(e.target.value)}
                    />
                  </div>
                  <div className="query-form-date-field">
                    <label className="query-form-date-label">{t('query.dateBefore')}</label>
                    <input
                      type="date"
                      className="query-form-input"
                      value={dateBefore}
                      onChange={(e) => setDateBefore(e.target.value)}
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
              onChange={(e) => setSize(parseInt(e.target.value) || 100)}
              min={1}
            />
          </div>
        )}

        <div className="query-form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !query.trim()}
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
              style={{ width: `${progress.total > 0 ? (progress.fetched / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.message} ({progress.fetched.toLocaleString()} / {progress.total.toLocaleString()})
          </div>
        </div>
      )}
    </div>
  );
}

