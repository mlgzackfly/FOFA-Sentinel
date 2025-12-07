import { useState, useEffect } from 'react';
import { QueryForm } from '../components/QueryForm';
import { QueryResults } from '../components/QueryResults';
import { TabSelector } from '../components/TabSelector';
import { useTranslation } from '../hooks/useTranslation';
import { type FofaQueryResult } from '../../shared/types';
import './QueryPage.css';

type QueryTab = 'search' | 'stats' | 'host' | 'account';

export function QueryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<QueryTab>('search');
  const [queryResult, setQueryResult] = useState<FofaQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQueryResult(null);
  }, [activeTab]);

  const tabs = [
    { id: 'search' as QueryTab, labelKey: 'query.tabs.search', icon: '>' },
    { id: 'stats' as QueryTab, labelKey: 'query.tabs.stats', icon: '#' },
    { id: 'host' as QueryTab, labelKey: 'query.tabs.host', icon: '@' },
    { id: 'account' as QueryTab, labelKey: 'query.tabs.account', icon: '$' },
  ];

  return (
    <div className="query-page">
      <div className="query-page-header">
        <h1 className="query-page-title">
          <span className="query-page-title-prefix">$</span>
          {t('query.title')}
        </h1>
        <p className="query-page-subtitle">{t('query.subtitle')}</p>
      </div>

      <TabSelector 
        tabs={tabs.map(tab => ({ ...tab, label: t(tab.labelKey) }))} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="query-page-content">
        <QueryForm
          tab={activeTab}
          onResult={setQueryResult}
          loading={loading}
          setLoading={setLoading}
        />
        {queryResult && <QueryResults result={queryResult} tab={activeTab} />}
      </div>
    </div>
  );
}

