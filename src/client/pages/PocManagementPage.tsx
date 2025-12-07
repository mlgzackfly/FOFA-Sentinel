import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  getAllPocScripts,
  createPocScript,
  updatePocScript,
  deletePocScript,
  type PocScript,
} from '../utils/poc-api';
import { alertError } from '../utils/modal';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import './PocManagementPage.css';

export function PocManagementPage() {
  const { t } = useTranslation();
  const [pocs, setPocs] = useState<PocScript[]>([]);
  const [selectedPoc, setSelectedPoc] = useState<PocScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PocScript>>({});

  useEffect(() => {
    loadPocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPocs = async () => {
    setLoading(true);
    try {
      const data = await getAllPocScripts();
      setPocs(data.scripts);
    } catch (error) {
      console.error('Failed to load PoCs:', error);
      await alertError(t('poc.loadError') || 'Failed to load PoC scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPoc(null);
    setIsEditing(true);
    setFormData({
      name: '',
      description: '',
      type: 'other',
      language: 'python',
      script: '',
      enabled: true,
    });
  };

  const handleEdit = (poc: PocScript) => {
    setSelectedPoc(poc);
    setIsEditing(true);
    setFormData(poc);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.type || !formData.language || !formData.script) {
        await alertError(
          t('poc.requiredFields') || 'Name, type, language, and script are required'
        );
        return;
      }

      if (selectedPoc) {
        await updatePocScript(selectedPoc.scriptId, formData);
      } else {
        await createPocScript({
          name: formData.name!,
          description: formData.description,
          type: formData.type!,
          language: formData.language!,
          script: formData.script!,
          parameters: formData.parameters,
          enabled: formData.enabled ?? true,
        });
      }
      await loadPocs();
      setIsEditing(false);
      setSelectedPoc(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to save PoC:', error);
      await alertError(t('poc.saveError') || 'Failed to save PoC script');
    }
  };

  const handleDelete = async (scriptId: string) => {
    if (!confirm(t('poc.confirmDelete'))) {
      return;
    }

    try {
      await deletePocScript(scriptId);
      if (selectedPoc?.scriptId === scriptId) {
        setSelectedPoc(null);
        setIsEditing(false);
      }
      await loadPocs();
    } catch (error) {
      console.error('Failed to delete PoC:', error);
      await alertError(t('poc.deleteError') || 'Failed to delete PoC script');
    }
  };

  return (
    <div className="poc-management-page">
      <div className="poc-page-header">
        <h1 className="poc-page-title">
          <span className="poc-page-title-prefix">⚠</span>
          {t('poc.title')}
        </h1>
        <p className="poc-page-subtitle">{t('poc.subtitle')}</p>
      </div>

      <div className="poc-content">
        {/* PoC List */}
        <div className="poc-list-panel">
          <div className="poc-panel-header">
            <h2>{t('poc.scripts.title')}</h2>
            <button className="btn-create" onClick={handleCreate}>
              + {t('poc.scripts.create')}
            </button>
          </div>

          {loading ? (
            <div className="poc-loading">{t('common.loading')}</div>
          ) : pocs.length === 0 ? (
            <div className="poc-empty">
              <div className="empty-icon">⚠</div>
              <div className="empty-text">{t('poc.scripts.empty')}</div>
              <button className="btn-create-empty" onClick={handleCreate}>
                {t('poc.scripts.createFirst')}
              </button>
            </div>
          ) : (
            <div className="poc-scripts-list">
              {pocs.map(poc => (
                <div
                  key={poc.scriptId}
                  className={`poc-script-item ${selectedPoc?.scriptId === poc.scriptId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPoc(poc);
                    setIsEditing(false);
                  }}
                >
                  <div className="script-header">
                    <div className="script-name">{poc.name}</div>
                    <div className="script-badges">
                      <span className={`badge badge-type badge-${poc.type}`}>
                        {poc.type.toUpperCase()}
                      </span>
                      <span className={`badge badge-lang badge-${poc.language}`}>
                        {poc.language}
                      </span>
                      {poc.enabled && <span className="badge badge-enabled">✓</span>}
                    </div>
                  </div>
                  {poc.description && (
                    <div className="script-description">
                      <MarkdownRenderer content={poc.description} className="compact" />
                    </div>
                  )}
                  <div className="script-actions">
                    <button
                      className="btn-edit"
                      onClick={e => {
                        e.stopPropagation();
                        handleEdit(poc);
                      }}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn-delete"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(poc.scriptId);
                      }}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PoC Editor/Viewer */}
        <div className="poc-editor-panel">
          {isEditing ? (
            <div className="poc-editor">
              <div className="editor-header">
                <h2>{selectedPoc ? t('poc.editor.edit') : t('poc.editor.create')}</h2>
                <div className="editor-actions">
                  <button className="btn-save" onClick={handleSave}>
                    {t('common.save')}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedPoc(null);
                      setFormData({});
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>

              <div className="editor-form">
                <div className="form-group">
                  <label>{t('poc.editor.name')}</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('poc.editor.namePlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('poc.editor.description')}</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('poc.editor.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('poc.editor.type')}</label>
                    <select
                      value={formData.type || 'other'}
                      onChange={e =>
                        setFormData({ ...formData, type: e.target.value as PocScript['type'] })
                      }
                    >
                      <option value="rsc">RSC</option>
                      <option value="xss">XSS</option>
                      <option value="sqli">SQL Injection</option>
                      <option value="rce">RCE</option>
                      <option value="ssrf">SSRF</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('poc.editor.language')}</label>
                    <select
                      value={formData.language || 'python'}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          language: e.target.value as
                            | 'python'
                            | 'http'
                            | 'javascript'
                            | 'bash'
                            | 'other',
                        })
                      }
                    >
                      <option value="python">Python</option>
                      <option value="http">HTTP Request</option>
                      <option value="javascript">JavaScript</option>
                      <option value="bash">Bash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('poc.editor.script')}</label>
                  <div className="script-help">
                    {formData.language === 'python' && (
                      <div className="help-text">
                        <strong>{t('poc.editor.help.title')}</strong>
                        <p>{t('poc.editor.help.python')}</p>
                        <pre className="help-code">
                          <code>{t('poc.editor.help.pythonExample')}</code>
                        </pre>
                      </div>
                    )}
                    {formData.language === 'http' && (
                      <div className="help-text">
                        <strong>{t('poc.editor.help.title')}</strong>
                        <p>{t('poc.editor.help.http')}</p>
                      </div>
                    )}
                    {formData.language &&
                      formData.language !== 'python' &&
                      formData.language !== 'http' && (
                        <div className="help-text">
                          <strong>{t('poc.editor.help.title')}</strong>
                          <p>{t('poc.editor.help.general')}</p>
                        </div>
                      )}
                  </div>
                  <textarea
                    className="script-editor"
                    value={formData.script || ''}
                    onChange={e => setFormData({ ...formData, script: e.target.value })}
                    placeholder={t('poc.editor.scriptPlaceholder')}
                    rows={20}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.enabled ?? true}
                      onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    {t('poc.editor.enabled')}
                  </label>
                </div>
              </div>
            </div>
          ) : selectedPoc ? (
            <div className="poc-viewer">
              <div className="viewer-header">
                <h2>{selectedPoc.name}</h2>
                <button className="btn-edit" onClick={() => handleEdit(selectedPoc)}>
                  {t('common.edit')}
                </button>
              </div>

              <div className="viewer-content">
                <div className="viewer-section">
                  <h3>{t('poc.viewer.description')}</h3>
                  {selectedPoc.description ? (
                    <MarkdownRenderer content={selectedPoc.description} />
                  ) : (
                    <p>{t('poc.viewer.noDescription')}</p>
                  )}
                </div>

                <div className="viewer-section">
                  <h3>{t('poc.viewer.details')}</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">{t('poc.viewer.type')}:</span>
                      <span className="detail-value">{selectedPoc.type.toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('poc.viewer.language')}:</span>
                      <span className="detail-value">{selectedPoc.language}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('poc.viewer.status')}:</span>
                      <span className="detail-value">
                        {selectedPoc.enabled ? t('poc.viewer.enabled') : t('poc.viewer.disabled')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="viewer-section">
                  <h3>{t('poc.viewer.script')}</h3>
                  <pre className="script-viewer">
                    <code>{selectedPoc.script}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="poc-empty-state">
              <div className="empty-icon">⚠</div>
              <div className="empty-text">{t('poc.selectScript')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
