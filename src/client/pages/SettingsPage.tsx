import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { type Page } from '../types';
import './SettingsPage.css';

interface SettingsPageProps {
  onPageChange?: (page: Page) => void;
}

export function SettingsPage({ onPageChange }: SettingsPageProps = {}) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/key');
      const data = await response.json();
      if (data.has_key) {
        setMaskedKey(data.api_key);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('errors.failedToSave'));
      }

      setMessage({
        type: 'success',
        text: t('settings.apiKeySaved') || 'API key saved successfully',
      });
      setApiKey('');
      loadConfig();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1 className="settings-page-title">
          <span className="settings-page-title-prefix">$</span>
          {t('settings.title')}
        </h1>
        <p className="settings-page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.apiCredentials')}</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            {maskedKey && (
              <div className="settings-info">
                <span className="info-label">{t('settings.currentApiKey')}</span>
                <span className="info-value">{maskedKey}</span>
              </div>
            )}
            <div className="settings-field">
              <label className="settings-label">
                <span className="label-prefix">#</span>
                {t('settings.fofaApiKey')}
              </label>
              <input
                type="password"
                className="settings-input"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={maskedKey ? t('settings.enterNewKey') : t('settings.enterApiKey')}
                required={!maskedKey}
              />
            </div>
            <div className="settings-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('settings.saving') : t('common.save')}
              </button>
            </div>
            {message && (
              <div className={`settings-message ${message.type}`}>
                {message.type === 'success' ? '✓' : '✗'} {message.text}
              </div>
            )}
          </form>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.about')}</h2>
          <div className="settings-about">
            <p className="about-text">{t('settings.version')}</p>
            <p className="about-text">{t('settings.description')}</p>
            <p className="about-text">
              {t('settings.getApiKey')}{' '}
              <a
                href="https://fofa.info/user/personal"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                https://fofa.info/user/personal
              </a>
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">{t('settings.testModals')}</h2>
          <div className="settings-about">
            <p className="about-text">{t('settings.testModalsDescription')}</p>
            {onPageChange && (
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onPageChange('modal-test')}
                >
                  {t('settings.testModals')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
