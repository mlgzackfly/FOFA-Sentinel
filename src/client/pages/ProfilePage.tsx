import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { getFofaAccountInfo } from '../utils/api';
import { getCachedAccountInfo, clearCachedAccountInfo } from '../utils/account-cache';
import { type FofaAccountResult } from '../../shared/types';
import { alertError } from '../utils/modal';
import './ProfilePage.css';

export function ProfilePage() {
  const { t } = useTranslation();
  const [accountInfo, setAccountInfo] = useState<FofaAccountResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccountInfo = async (useCache = true) => {
    try {
      // Try to load from cache first
      if (useCache) {
        const cached = getCachedAccountInfo();
        if (cached) {
          setAccountInfo(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const data = await getFofaAccountInfo(useCache);
      setAccountInfo(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.failedToLoad');
      await alertError(errorMessage);
      console.error('Failed to load account info:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccountInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    clearCachedAccountInfo();
    await loadAccountInfo(false);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-terminal scanline">
          <div className="terminal-ascii-border">
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-command typing">{t('profile.loading')}</span>
              <span className="terminal-cursor">_</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="profile-page">
        <div className="profile-terminal scanline">
          <div className="terminal-ascii-border">
            <div className="terminal-line error">
              <span className="terminal-prompt">$</span>
              <span className="terminal-command">error: {t('profile.loadError')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fcoin = accountInfo.fcoin ?? accountInfo.fcoin_balance ?? 0;
  const fofaPoint = accountInfo.fofa_point ?? 0;
  const remainFreePoint = accountInfo.remain_free_point ?? 0;
  const remainApiQuery = accountInfo.remain_api_query ?? -1;
  const remainApiData = accountInfo.remain_api_data ?? -1;

  // Calculate percentages for progress bars
  const freePointPercent = remainFreePoint > 0 ? Math.min((remainFreePoint / 5000) * 100, 100) : 0;
  const apiQueryPercent =
    remainApiQuery >= 0 && remainApiQuery !== -1
      ? Math.min((remainApiQuery / 10000) * 100, 100)
      : 100;
  const apiDataPercent =
    remainApiData >= 0 && remainApiData !== -1 ? Math.min((remainApiData / 10000) * 100, 100) : 100;

  return (
    <div className="profile-page">
      <div className="profile-terminal scanline">
        <div className="terminal-grid-bg"></div>
        <div className="terminal-ascii-border">
          {/* ASCII Art Header */}
          <div className="ascii-header">
            <pre className="ascii-art">{`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                    ███████╗ ██████╗ ███████╗ █████╗                       ║
║                    █████╗  ██║   ██║█████╗  ███████║                      ║
║                    ██╔══╝  ██║   ██║██╔══╝  ██╔══██║                      ║
║                    ██║     ╚██████╔╝██║     ██║  ██║                      ║
║                    ╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝                      ║
║                                                                           ║
║     ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗           ║
║     ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║           ║
║     ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║           ║
║     ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██╗           ║
║     ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗████████╗     ║
║     ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚═══════╝     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
            `}</pre>
          </div>

          <div className="terminal-header">
            <div className="header-left">
              <span className="terminal-title">[{t('profile.system')}]</span>
              <div className="header-info">
                {accountInfo.fofa_server !== undefined && accountInfo.fofacli_ver && (
                  <span className="terminal-status">
                    <span
                      className={`status-indicator ${accountInfo.fofa_server ? 'online' : 'offline'}`}
                    ></span>
                    {accountInfo.fofa_server ? t('profile.online') : t('profile.offline')} v
                    {accountInfo.fofacli_ver}
                  </span>
                )}
                {accountInfo.fofa_server !== undefined && !accountInfo.fofacli_ver && (
                  <span className="terminal-status">
                    <span
                      className={`status-indicator ${accountInfo.fofa_server ? 'online' : 'offline'}`}
                    ></span>
                    {accountInfo.fofa_server ? t('profile.online') : t('profile.offline')}
                  </span>
                )}
                {!accountInfo.fofa_server && accountInfo.fofacli_ver && (
                  <span className="terminal-version">v{accountInfo.fofacli_ver}</span>
                )}
              </div>
            </div>
            <button className="btn-refresh-terminal" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? `[${t('profile.syncing')}]` : `[${t('profile.refresh')}]`}
            </button>
          </div>

          <div className="terminal-content">
            {/* User Info Section */}
            <div className="terminal-section">
              <div className="terminal-line">
                <span className="terminal-prompt">root@fofa</span>
                <span className="terminal-separator">:</span>
                <span className="terminal-path">~</span>
                <span className="terminal-separator">#</span>
                <span className="terminal-command">cat /etc/user.info</span>
              </div>
              <div className="terminal-output">
                <div className="info-block">
                  <div className="info-row">
                    <span className="info-key">EMAIL:</span>
                    <span className="info-value highlight">{accountInfo.email || 'N/A'}</span>
                  </div>
                  {accountInfo.username && (
                    <div className="info-row">
                      <span className="info-key">USERNAME:</span>
                      <span className="info-value">{accountInfo.username}</span>
                    </div>
                  )}
                  {accountInfo.category && (
                    <div className="info-row">
                      <span className="info-key">CATEGORY:</span>
                      <span className="info-value">{accountInfo.category.toUpperCase()}</span>
                    </div>
                  )}
                  {accountInfo.is_verified !== undefined && (
                    <div className="info-row">
                      <span className="info-key">VERIFIED:</span>
                      <span
                        className={`info-value status-badge ${accountInfo.is_verified ? 'status-ok' : 'status-warn'}`}
                      >
                        [{accountInfo.is_verified ? '✓' : '✗'}]{' '}
                        {accountInfo.is_verified ? 'YES' : 'NO'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VIP Status Section */}
            <div className="terminal-section">
              <div className="terminal-line">
                <span className="terminal-prompt">root@fofa</span>
                <span className="terminal-separator">:</span>
                <span className="terminal-path">~</span>
                <span className="terminal-separator">#</span>
                <span className="terminal-command">check_vip_status</span>
              </div>
              <div className="terminal-output">
                <div className="info-block">
                  {accountInfo.vip_level !== undefined && (
                    <div className="info-row">
                      <span className="info-key">VIP_LEVEL:</span>
                      <span
                        className={`info-value status-badge ${accountInfo.isvip ? 'status-vip' : 'status-free'}`}
                      >
                        [{accountInfo.isvip ? '★' : '○'}] LEVEL {accountInfo.vip_level}{' '}
                        {accountInfo.isvip ? '(VIP)' : '(FREE)'}
                      </span>
                    </div>
                  )}
                  {accountInfo.expiration && accountInfo.expiration !== '-' && (
                    <div className="info-row">
                      <span className="info-key">EXPIRATION:</span>
                      <span className="info-value">{accountInfo.expiration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Points & Credits Section with Progress Bars */}
            <div className="terminal-section">
              <div className="terminal-line">
                <span className="terminal-prompt">root@fofa</span>
                <span className="terminal-separator">:</span>
                <span className="terminal-path">~</span>
                <span className="terminal-separator">#</span>
                <span className="terminal-command">show_credits</span>
              </div>
              <div className="terminal-output">
                <div className="info-block">
                  <div className="info-row">
                    <span className="info-key">FCOIN:</span>
                    <span className="info-value highlight">{fcoin.toLocaleString()}</span>
                  </div>
                  {fofaPoint > 0 && (
                    <div className="info-row">
                      <span className="info-key">FOFA_POINT:</span>
                      <span className="info-value highlight">{fofaPoint.toLocaleString()}</span>
                    </div>
                  )}
                  {remainFreePoint > 0 && (
                    <div className="info-row progress-row">
                      <span className="info-key">FREE_POINT_REMAIN:</span>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${freePointPercent}%` }}
                            data-value={remainFreePoint}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {remainFreePoint.toLocaleString()} / 5000
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* API Quota Section with Progress Bars */}
            <div className="terminal-section">
              <div className="terminal-line">
                <span className="terminal-prompt">root@fofa</span>
                <span className="terminal-separator">:</span>
                <span className="terminal-path">~</span>
                <span className="terminal-separator">#</span>
                <span className="terminal-command">check_api_quota</span>
              </div>
              <div className="terminal-output">
                <div className="info-block">
                  {remainApiQuery >= 0 && (
                    <div className="info-row progress-row">
                      <span className="info-key">API_QUERY_REMAIN:</span>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${remainApiQuery === -1 || remainApiQuery > 0 ? 'status-ok' : 'status-error'}`}
                            style={{ width: `${remainApiQuery === -1 ? 100 : apiQueryPercent}%` }}
                            data-value={remainApiQuery === -1 ? '∞' : remainApiQuery}
                          ></div>
                        </div>
                        <span
                          className={`progress-text ${remainApiQuery === -1 || remainApiQuery > 0 ? 'status-ok' : 'status-error'}`}
                        >
                          {remainApiQuery === -1
                            ? 'UNLIMITED'
                            : `${remainApiQuery.toLocaleString()} / 10000`}
                        </span>
                      </div>
                    </div>
                  )}
                  {remainApiData >= 0 && (
                    <div className="info-row progress-row">
                      <span className="info-key">API_DATA_REMAIN:</span>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${remainApiData === -1 || remainApiData > 0 ? 'status-ok' : 'status-error'}`}
                            style={{ width: `${remainApiData === -1 ? 100 : apiDataPercent}%` }}
                            data-value={remainApiData === -1 ? '∞' : remainApiData}
                          ></div>
                        </div>
                        <span
                          className={`progress-text ${remainApiData === -1 || remainApiData > 0 ? 'status-ok' : 'status-error'}`}
                        >
                          {remainApiData === -1
                            ? 'UNLIMITED'
                            : `${remainApiData.toLocaleString()} / 10000`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cache Info Section */}
            <div className="terminal-section">
              <div className="terminal-line">
                <span className="terminal-prompt">root@fofa</span>
                <span className="terminal-separator">:</span>
                <span className="terminal-path">~</span>
                <span className="terminal-separator">#</span>
                <span className="terminal-command">cache_status</span>
              </div>
              <div className="terminal-output">
                <div className="info-block">
                  <div className="info-row">
                    <span className="info-key">CACHE_ENABLED:</span>
                    <span className="info-value status-badge status-ok">[✓] YES (5min TTL)</span>
                  </div>
                  <div className="info-row">
                    <button
                      className="btn-clear-cache-terminal"
                      onClick={() => {
                        clearCachedAccountInfo();
                        loadAccountInfo(false);
                      }}
                    >
                      [{t('profile.clearCache')}]
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Command Prompt */}
            <div className="terminal-line">
              <span className="terminal-prompt">root@fofa</span>
              <span className="terminal-separator">:</span>
              <span className="terminal-path">~</span>
              <span className="terminal-separator">#</span>
              <span className="terminal-cursor">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
