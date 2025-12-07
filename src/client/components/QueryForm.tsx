import { useState } from 'react';
import { searchFofa, getFofaStats, getFofaHostAggregation, getFofaAccountInfo } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import './QueryForm.css';

type QueryTab = 'search' | 'stats' | 'host' | 'account';

interface QueryFormProps {
  tab: QueryTab;
  onResult: (result: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function QueryForm({ tab, onResult, loading, setLoading }: QueryFormProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [fields, setFields] = useState('host,ip,port');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(100);
  const [full, setFull] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encodeBase64 = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      throw new Error(t('errors.invalidQuery'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const qbase64 = encodeBase64(query);
      let result;

      switch (tab) {
        case 'search':
          result = await searchFofa({
            qbase64,
            fields: fields || undefined,
            page,
            size,
            full,
          });
          if (result && !result.error) {
            const historyResponse = await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query,
                query_base64: qbase64,
                fields,
                page,
                size,
                full,
              }),
            });
            const historyData = await historyResponse.json();
            if (historyData.id) {
              await fetch(`/api/history/${historyData.id}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  result_data: result,
                  total_size: result.size,
                  page: result.page,
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
    } catch (err: any) {
      setError(err.message || t('errors.unknown'));
      onResult(null);
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
                  checked={full}
                  onChange={(e) => setFull(e.target.checked)}
                />
                <span>{t('query.fullLabel')}</span>
              </label>
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
    </div>
  );
}

