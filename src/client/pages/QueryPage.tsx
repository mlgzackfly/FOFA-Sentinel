import { useState } from 'react';
import { QueryForm } from '../components/QueryForm';
import { QueryResults } from '../components/QueryResults';
import { TabSelector } from '../components/TabSelector';
import './QueryPage.css';

type QueryTab = 'search' | 'stats' | 'host' | 'account';

export function QueryPage() {
  const [activeTab, setActiveTab] = useState<QueryTab>('search');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'search' as QueryTab, label: 'SEARCH', icon: '>' },
    { id: 'stats' as QueryTab, label: 'STATS', icon: '#' },
    { id: 'host' as QueryTab, label: 'HOST', icon: '@' },
    { id: 'account' as QueryTab, label: 'ACCOUNT', icon: '$' },
  ];

  return (
    <div className="query-page">
      <div className="query-page-header">
        <h1 className="query-page-title">
          <span className="query-page-title-prefix">$</span>
          FOFA QUERY INTERFACE
        </h1>
        <p className="query-page-subtitle">Execute FOFA API queries and analyze results</p>
      </div>

      <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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

