import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  getAllPocSessions,
  getPocResults,
  deletePocSession,
  getPocStatistics,
  updatePocResult,
  type PocSession,
  type PocResult,
} from '../utils/poc-api';
import { formatError, getFullError } from '../utils/error-format';
import { convertToTXT, getMimeType, ensureFileExtension } from '../utils/export';
import { alertError } from '../utils/modal';
import './ScanResultsPage.css';

export function ScanResultsPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<PocSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PocSession | null>(null);
  const [results, setResults] = useState<PocResult[]>([]);
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    totalScanned: 0,
    totalVulnerable: 0,
    totalSafe: 0,
    totalErrors: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'vulnerable' | 'safe' | 'error'>('all');
  const [editingResult, setEditingResult] = useState<{
    host: string;
    tags: string[];
  } | null>(null);

  // Collect all available tags from all results
  const availableTags = Array.from(
    new Set(
      results.flatMap(result => result.tags || []).filter((tag): tag is string => Boolean(tag))
    )
  ).sort();

  useEffect(() => {
    loadSessions();
    loadStatistics();
  }, []);

  // Refresh statistics when sessions change
  useEffect(() => {
    loadStatistics();
  }, [sessions]);

  useEffect(() => {
    if (selectedSession) {
      loadResults(selectedSession.sessionId);
    } else {
      // Clear results when no session is selected
      setResults([]);
    }
  }, [selectedSession, filter]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getAllPocSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      await alertError(t('scanResults.loadError') || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getPocStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadResults = async (sessionId: string) => {
    if (!sessionId) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const filterParams: { vulnerable?: boolean | null; status?: string } = {};
      if (filter === 'vulnerable') {
        filterParams.vulnerable = true;
      } else if (filter === 'safe') {
        filterParams.vulnerable = false;
      } else if (filter === 'error') {
        filterParams.status = 'error';
      }
      // When filter is 'all', filterParams will be empty, which should return all results
      const data = await getPocResults(sessionId, filterParams);
      setResults(data.results || []);
    } catch (error) {
      console.error('[Frontend] Failed to load results:', error);
      setResults([]); // Ensure results is set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!sessionId) {
      console.error('Cannot delete session: sessionId is missing');
      await alertError(t('scanResults.deleteError') + ': Invalid session ID');
      return;
    }

    if (!confirm(t('scanResults.confirmDelete'))) {
      return;
    }

    try {
      await deletePocSession(sessionId);
      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
        setResults([]);
      }
      await loadSessions();
      await loadStatistics();
    } catch (error) {
      console.error('Failed to delete session:', error);
      const errorMessage = error instanceof Error ? error.message : t('scanResults.deleteError');
      await alertError(`${t('scanResults.deleteError')}: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="status-badge status-completed">{t('scanResults.status.completed')}</span>
        );
      case 'scanning':
        return (
          <span className="status-badge status-scanning">{t('scanResults.status.scanning')}</span>
        );
      case 'failed':
        return <span className="status-badge status-failed">{t('scanResults.status.failed')}</span>;
      default:
        return (
          <span className="status-badge status-pending">{t('scanResults.status.pending')}</span>
        );
    }
  };

  const getVulnerabilityBadge = (vulnerable: boolean | null) => {
    if (vulnerable === true) {
      return <span className="vuln-badge vuln-vulnerable">⚠️ {t('scanResults.vulnerable')}</span>;
    } else if (vulnerable === false) {
      return <span className="vuln-badge vuln-safe">✓ {t('scanResults.safe')}</span>;
    } else {
      return <span className="vuln-badge vuln-error">✗ {t('scanResults.error')}</span>;
    }
  };

  const handleExport = async () => {
    if (results.length === 0) {
      await alertError(t('scanResults.export.noResults') || 'No results to export');
      return;
    }

    // Extract tested URLs from results
    const urls = results
      .map(result => result.testedUrl || result.host)
      .filter((url): url is string => Boolean(url));

    if (urls.length === 0) {
      await alertError(t('scanResults.export.noUrls') || 'No URLs to export');
      return;
    }

    // Create export data in the format expected by convertToTXT
    const exportData = {
      results: urls.map(url => ({ host: url })),
    };

    const content = convertToTXT(exportData);
    const blob = new Blob([content], { type: getMimeType('txt') });
    const url = URL.createObjectURL(blob);

    // Generate filename based on filter
    const filterName =
      filter === 'all'
        ? 'all'
        : filter === 'vulnerable'
          ? 'vulnerable'
          : filter === 'safe'
            ? 'safe'
            : 'error';
    const sessionName = selectedSession?.name
      ? selectedSession.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
      : 'scan-results';
    const filename = ensureFileExtension(
      `${sessionName}_${filterName}_${new Date().toISOString().split('T')[0]}`,
      'txt'
    );

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scan-results-page">
      <div className="poc-page-header">
        <h1 className="poc-page-title">
          <span className="poc-page-title-prefix">!</span>
          {t('scanResults.title')}
        </h1>
        <p className="poc-page-subtitle">{t('scanResults.subtitle')}</p>
      </div>

      {/* Statistics */}
      <div className="poc-statistics">
        <div key="total-sessions" className="stat-card">
          <div className="stat-label">{t('scanResults.stats.totalSessions')}</div>
          <div className="stat-value">{statistics.totalSessions}</div>
        </div>
        <div key="total-scanned" className="stat-card">
          <div className="stat-label">{t('scanResults.stats.totalScanned')}</div>
          <div className="stat-value">{statistics.totalScanned}</div>
        </div>
        <div key="vulnerable" className="stat-card stat-vulnerable">
          <div className="stat-label">{t('scanResults.stats.vulnerable')}</div>
          <div className="stat-value">{statistics.totalVulnerable}</div>
        </div>
        <div key="safe" className="stat-card stat-safe">
          <div className="stat-label">{t('scanResults.stats.safe')}</div>
          <div className="stat-value">{statistics.totalSafe}</div>
        </div>
        <div key="errors" className="stat-card stat-error">
          <div className="stat-label">{t('scanResults.stats.errors')}</div>
          <div className="stat-value">{statistics.totalErrors}</div>
        </div>
      </div>

      <div className="poc-content">
        {/* Sessions List */}
        <div className="poc-sessions-panel">
          <div className="poc-panel-header">
            <h2>{t('scanResults.sessions.title')}</h2>
            <button className="btn-refresh" onClick={loadSessions} aria-label="Refresh">
              ⟳
            </button>
          </div>

          {loading && sessions.length === 0 ? (
            <div className="poc-loading">{t('common.loading')}</div>
          ) : sessions.length === 0 ? (
            <div className="poc-empty">{t('scanResults.sessions.empty')}</div>
          ) : (
            <div className="poc-sessions-list">
              {sessions.map(session => (
                <div
                  key={session.sessionId || session.id}
                  className={`poc-session-item ${selectedSession?.sessionId === session.sessionId ? 'active' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="session-header">
                    <div className="session-name">
                      {(() => {
                        // Extract PoC name from session name if it follows the pattern "Auto Scan: [PoC Name] - [Query]" or "PoC Scan: [PoC Name] - [Query]"
                        const name = session.name || session.sessionId;
                        if (name.includes('PoC Scan:') || name.includes('Auto Scan:')) {
                          // Remove prefix "Auto Scan: " or "PoC Scan: "
                          let pocName = name.replace(/^(?:Auto Scan|PoC Scan):\s*/, '');
                          // The format is: "[PoC Name] - [Query]"
                          // We want to extract everything before the last " - " (space-dash-space)
                          // This handles cases like "CVE-2025-55182 - React Server Components RCE - query"
                          const lastDashIndex = pocName.lastIndexOf(' - ');
                          if (lastDashIndex > 0) {
                            // Extract everything before the last " - "
                            pocName = pocName.substring(0, lastDashIndex);
                          }
                          return pocName;
                        }
                        return name;
                      })()}
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  {session.description && (
                    <div className="session-description">{session.description}</div>
                  )}
                  <div className="session-stats">
                    <span>
                      {t('scanResults.sessions.scanned')}: {session.scannedHosts}/
                      {session.totalHosts}
                    </span>
                    <span className="stat-vuln">
                      ⚠️ {session.vulnerableCount} | ✓ {session.safeCount} | ✗ {session.errorCount}
                    </span>
                  </div>
                  <div className="session-actions">
                    <button
                      className="btn-delete"
                      onClick={async e => {
                        e.stopPropagation();
                        // Always use sessionId (UUID), never use numeric id
                        if (session.sessionId) {
                          handleDeleteSession(session.sessionId);
                        } else {
                          console.error('Session ID is missing:', session);
                          await alertError(t('scanResults.deleteError') + ': Session ID not found');
                        }
                      }}
                      aria-label={t('common.delete')}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="poc-results-panel">
          {selectedSession ? (
            <>
              <div className="poc-panel-header">
                <h2>
                  {t('scanResults.results.title')} -{' '}
                  {(() => {
                    // Extract PoC name from session name if it follows the pattern "Auto Scan: [PoC Name] - [Query]" or "PoC Scan: [PoC Name] - [Query]"
                    const name = selectedSession.name || selectedSession.sessionId;
                    if (name.includes('PoC Scan:') || name.includes('Auto Scan:')) {
                      // Remove prefix "Auto Scan: " or "PoC Scan: "
                      let pocName = name.replace(/^(?:Auto Scan|PoC Scan):\s*/, '');
                      // The format is: "[PoC Name] - [Query]"
                      // We want to extract everything before the last " - " (space-dash-space)
                      // This handles cases like "CVE-2025-55182 - React Server Components RCE - query"
                      const lastDashIndex = pocName.lastIndexOf(' - ');
                      if (lastDashIndex > 0) {
                        // Extract everything before the last " - "
                        pocName = pocName.substring(0, lastDashIndex);
                      }
                      return pocName;
                    }
                    return name;
                  })()}
                </h2>
                <div className="filter-export-container">
                  <div className="filter-buttons">
                    <button
                      key="filter-all"
                      className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                      onClick={() => setFilter('all')}
                    >
                      {t('scanResults.filter.all')}
                    </button>
                    <button
                      key="filter-vulnerable"
                      className={`filter-btn ${filter === 'vulnerable' ? 'active' : ''}`}
                      onClick={() => setFilter('vulnerable')}
                    >
                      ⚠️ {t('scanResults.filter.vulnerable')}
                    </button>
                    <button
                      key="filter-safe"
                      className={`filter-btn ${filter === 'safe' ? 'active' : ''}`}
                      onClick={() => setFilter('safe')}
                    >
                      ✓ {t('scanResults.filter.safe')}
                    </button>
                    <button
                      key="filter-error"
                      className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
                      onClick={() => setFilter('error')}
                    >
                      ✗ {t('scanResults.filter.error')}
                    </button>
                  </div>
                  {results.length > 0 && (
                    <button
                      className="btn-export"
                      onClick={handleExport}
                      title={t('scanResults.export.title')}
                    >
                      ⬇
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="poc-loading">{t('common.loading')}</div>
              ) : results.length === 0 ? (
                <div className="poc-empty">{t('scanResults.results.empty')}</div>
              ) : (
                <div className="poc-results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('scanResults.results.testedUrl')}</th>
                        <th>{t('scanResults.results.status')}</th>
                        <th>{t('scanResults.results.error')}</th>
                        <th>{t('scanResults.results.tags')}</th>
                        <th>{t('scanResults.results.scannedAt')}</th>
                        <th>{t('scanResults.results.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, idx) => (
                        <tr key={idx}>
                          <td className="url-cell">{result.testedUrl || result.host || '-'}</td>
                          <td>{getVulnerabilityBadge(result.vulnerable)}</td>
                          <td
                            className="error-cell"
                            title={result.error ? getFullError(result.error) : undefined}
                          >
                            {result.error ? formatError(result.error) : '-'}
                          </td>
                          <td className="tags-cell">
                            {editingResult?.host === result.host ? (
                              <div className="tags-checkbox-group">
                                {availableTags.length > 0 ? (
                                  availableTags.map(tag => (
                                    <label key={tag} className="tag-checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={editingResult.tags.includes(tag)}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            setEditingResult({
                                              ...editingResult,
                                              tags: [...editingResult.tags, tag],
                                            });
                                          } else {
                                            setEditingResult({
                                              ...editingResult,
                                              tags: editingResult.tags.filter(t => t !== tag),
                                            });
                                          }
                                        }}
                                      />
                                      <span>{tag}</span>
                                    </label>
                                  ))
                                ) : (
                                  <span className="no-tags-hint">
                                    {t('scanResults.results.noTagsAvailable')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="tags-display">
                                {result.tags && result.tags.length > 0
                                  ? result.tags.map((tag, tagIdx) => (
                                      <span key={tagIdx} className="tag-badge">
                                        {tag}
                                      </span>
                                    ))
                                  : '-'}
                              </div>
                            )}
                          </td>
                          <td className="date-cell">
                            {new Date(result.scannedAt).toLocaleString()}
                          </td>
                          <td className="actions-cell">
                            {editingResult?.host === result.host ? (
                              <>
                                <button
                                  className="btn-save"
                                  onClick={async () => {
                                    if (selectedSession) {
                                      try {
                                        await updatePocResult(
                                          selectedSession.sessionId,
                                          result.host,
                                          {
                                            tags: editingResult.tags,
                                          }
                                        );
                                        await loadResults(selectedSession.sessionId);
                                        setEditingResult(null);
                                      } catch (error) {
                                        console.error('Failed to update result:', error);
                                        await alertError(t('scanResults.updateError'));
                                      }
                                    }
                                  }}
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={() => setEditingResult(null)}
                                >
                                  {t('common.cancel')}
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn-edit"
                                onClick={() =>
                                  setEditingResult({
                                    host: result.host,
                                    tags: result.tags || [],
                                  })
                                }
                              >
                                {t('scanResults.results.edit')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="poc-empty-state">
              <div className="empty-icon">⚠</div>
              <div className="empty-text">{t('scanResults.selectSession')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
