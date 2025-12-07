import { useState } from 'react';
import './QueryResults.css';

interface QueryResultsProps {
  result: any;
  tab: string;
}

export function QueryResults({ result, tab }: QueryResultsProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  if (result.error) {
    return (
      <div className="query-results">
        <div className="query-results-error">
          <span className="error-prefix">ERROR:</span> {result.errmsg || 'Unknown error'}
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    // This would export the current result
    // For now, we'll just copy to clipboard
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
                  <span className="meta-label">QUERY:</span> {result.query || 'N/A'}
                </span>
                <span className="meta-item">
                  <span className="meta-label">TOTAL:</span> {result.size || 0}
                </span>
                <span className="meta-item">
                  <span className="meta-label">PAGE:</span> {result.page || 1}
                </span>
              </div>
              <button className="btn-secondary" onClick={handleExport}>
                {copied ? 'COPIED!' : 'COPY JSON'}
              </button>
            </div>
            {result.results && result.results.length > 0 ? (
              <div className="query-results-table">
                <table>
                  <thead>
                    <tr>
                      {result.results[0].map((_: any, idx: number) => (
                        <th key={idx}>COL_{idx + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx}>
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx}>{cell || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="query-results-empty">No results found</div>
            )}
          </div>
        );
      case 'stats':
      case 'host':
      case 'account':
        return (
          <div className="query-results-content">
            <pre className="query-results-json">{JSON.stringify(result, null, 2)}</pre>
            <button className="btn-secondary" onClick={handleExport}>
              {copied ? 'COPIED!' : 'COPY JSON'}
            </button>
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
        RESULTS
      </div>
      {renderContent()}
    </div>
  );
}

