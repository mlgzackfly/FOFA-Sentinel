import { useState, useEffect } from 'react';
import './SettingsPage.css';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
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
        setEmail(data.email || '');
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
        body: JSON.stringify({ api_key: apiKey, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save API key');
      }

      setMessage({ type: 'success', text: 'API key saved successfully' });
      setApiKey('');
      loadConfig();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1 className="settings-page-title">
          <span className="settings-page-title-prefix">$</span>
          CONFIGURATION
        </h1>
        <p className="settings-page-subtitle">Manage your FOFA API credentials</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="settings-section-title">API CREDENTIALS</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            {maskedKey && (
              <div className="settings-info">
                <span className="info-label">Current API Key:</span>
                <span className="info-value">{maskedKey}</span>
              </div>
            )}
            <div className="settings-field">
              <label className="settings-label">
                <span className="label-prefix">#</span>
                FOFA EMAIL
              </label>
              <input
                type="email"
                className="settings-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">
                <span className="label-prefix">#</span>
                FOFA API KEY
              </label>
              <input
                type="password"
                className="settings-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={maskedKey ? 'Enter new API key to update' : 'Enter your API key'}
                required={!maskedKey}
              />
            </div>
            <div className="settings-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'SAVING...' : 'SAVE'}
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
          <h2 className="settings-section-title">ABOUT</h2>
          <div className="settings-about">
            <p className="about-text">
              FOFA API Client v0.1.0
            </p>
            <p className="about-text">
              A modern, hacker-style interface for the FOFA API.
            </p>
            <p className="about-text">
              Get your API key from:{' '}
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
      </div>
    </div>
  );
}

