import { useTranslation } from '../hooks/useTranslation';
import { alert, alertError, alertWarning, alertSuccess, alertInfo } from '../utils/modal';
import './ModalTestPage.css';

export function ModalTestPage() {
  const { t } = useTranslation();

  const handleTestError = async () => {
    await alertError(t('modalTest.messages.error'), t('modalTest.types.error'));
  };

  const handleTestWarning = async () => {
    await alertWarning(t('modalTest.messages.warning'), t('modalTest.types.warning'));
  };

  const handleTestSuccess = async () => {
    await alertSuccess(t('modalTest.messages.success'), t('modalTest.types.success'));
  };

  const handleTestInfo = async () => {
    await alertInfo(t('modalTest.messages.info'), t('modalTest.types.info'));
  };

  const handleTestDefault = async () => {
    await alert(t('modalTest.messages.default'));
  };

  const handleTestLongMessage = async () => {
    await alertError(t('modalTest.messages.long'), t('modalTest.types.longText'));
  };

  return (
    <div className="modal-test-page">
      <div className="modal-test-container">
        <h1 className="modal-test-title">{t('modalTest.title')}</h1>
        <p className="modal-test-description">{t('modalTest.description')}</p>
        <div className="modal-test-buttons">
          <button className="btn-test btn-test-error" onClick={handleTestError}>
            {t('modalTest.buttons.error')}
          </button>
          <button className="btn-test btn-test-warning" onClick={handleTestWarning}>
            {t('modalTest.buttons.warning')}
          </button>
          <button className="btn-test btn-test-success" onClick={handleTestSuccess}>
            {t('modalTest.buttons.success')}
          </button>
          <button className="btn-test btn-test-info" onClick={handleTestInfo}>
            {t('modalTest.buttons.info')}
          </button>
          <button className="btn-test btn-test-default" onClick={handleTestDefault}>
            {t('modalTest.buttons.default')}
          </button>
          <button className="btn-test btn-test-long" onClick={handleTestLongMessage}>
            {t('modalTest.buttons.longText')}
          </button>
        </div>
        <div className="modal-test-instructions">
          <h2>{t('modalTest.instructions.title')}</h2>
          <ul>
            <li>{t('modalTest.instructions.item1')}</li>
            <li>{t('modalTest.instructions.item2')}</li>
            <li>{t('modalTest.instructions.item3')}</li>
            <li>{t('modalTest.instructions.item4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
