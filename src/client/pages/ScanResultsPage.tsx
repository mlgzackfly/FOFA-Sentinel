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
    notes: string;
    tags: string[];
  } | null>(null);

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
      console.log(
        `[Frontend] Loading results for session: ${selectedSession.sessionId}, filter: ${filter}`
      );
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
      alert(t('scanResults.loadError') || 'Failed to load sessions');
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
      console.warn('[Frontend] loadResults called with empty sessionId');
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

      console.log(
        `[Frontend] Calling getPocResults for session ${sessionId} with filterParams:`,
        filterParams
      );
      const data = await getPocResults(sessionId, filterParams);
      console.log(
        `[Frontend] Loaded ${data.results?.length || 0} results for session ${sessionId} with filter:`,
        filter,
        filterParams
      );
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
      alert(t('scanResults.deleteError') + ': Invalid session ID');
      return;
    }

    if (!confirm(t('scanResults.confirmDelete'))) {
      return;
    }

    try {
      console.log('Attempting to delete session:', sessionId);
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
      alert(`${t('scanResults.deleteError')}: ${errorMessage}`);
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
                        // Extract PoC name from session name if it follows the pattern "Auto Scan: [PoC Name] - ..." or "PoC Scan: [PoC Name]"
                        const name = session.name || session.sessionId;
                        const autoScanMatch = name.match(
                          /^(?:Auto Scan|PoC Scan):\s*(.+?)(?:\s*-\s*|$)/
                        );
                        if (autoScanMatch) {
                          return autoScanMatch[1];
                        }
                        // If it's a simple PoC scan name, return as is
                        if (name.includes('PoC Scan:') || name.includes('Auto Scan:')) {
                          return name.replace(/^(?:Auto Scan|PoC Scan):\s*/, '').split(' - ')[0];
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
                      onClick={e => {
                        e.stopPropagation();
                        // Always use sessionId (UUID), never use numeric id
                        if (session.sessionId) {
                          handleDeleteSession(session.sessionId);
                        } else {
                          console.error('Session ID is missing:', session);
                          alert(t('scanResults.deleteError') + ': Session ID not found');
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
                    // Extract PoC name from session name if it follows the pattern
                    const name = selectedSession.name || selectedSession.sessionId;
                    const autoScanMatch = name.match(
                      /^(?:Auto Scan|PoC Scan):\s*(.+?)(?:\s*-\s*|$)/
                    );
                    if (autoScanMatch) {
                      return autoScanMatch[1];
                    }
                    if (name.includes('PoC Scan:') || name.includes('Auto Scan:')) {
                      return name.replace(/^(?:Auto Scan|PoC Scan):\s*/, '').split(' - ')[0];
                    }
                    return name;
                  })()}
                </h2>
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
                        <th>{t('scanResults.results.notes')}</th>
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
                          <td className="notes-cell">
                            {editingResult?.host === result.host ? (
                              <textarea
                                className="notes-input"
                                value={editingResult.notes}
                                onChange={e =>
                                  setEditingResult({
                                    ...editingResult,
                                    notes: e.target.value,
                                  })
                                }
                                rows={2}
                                placeholder={t('scanResults.results.notesPlaceholder')}
                              />
                            ) : (
                              <span className="notes-display" title={result.notes || undefined}>
                                {result.notes || '-'}
                              </span>
                            )}
                          </td>
                          <td className="tags-cell">
                            {editingResult?.host === result.host ? (
                              <input
                                type="text"
                                className="tags-input"
                                value={editingResult.tags.join(', ')}
                                onChange={e =>
                                  setEditingResult({
                                    ...editingResult,
                                    tags: e.target.value
                                      .split(',')
                                      .map(t => t.trim())
                                      .filter(Boolean),
                                  })
                                }
                                placeholder={t('scanResults.results.tagsPlaceholder')}
                              />
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
                                            notes: editingResult.notes,
                                            tags: editingResult.tags,
                                          }
                                        );
                                        await loadResults(selectedSession.sessionId);
                                        setEditingResult(null);
                                      } catch (error) {
                                        console.error('Failed to update result:', error);
                                        alert(t('scanResults.updateError'));
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
                                    notes: result.notes || '',
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
