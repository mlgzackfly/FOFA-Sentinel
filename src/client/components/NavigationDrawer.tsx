import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';
import './NavigationDrawer.css';

type Page = 'query' | 'history' | 'settings' | 'docs';

interface NavigationDrawerProps {
  isOpen: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onToggle: () => void;
}

export function NavigationDrawer({
  isOpen,
  currentPage,
  onPageChange,
  onToggle,
}: NavigationDrawerProps) {
  const { t } = useTranslation();

  const menuItems: { id: Page; labelKey: string; icon: string }[] = [
    { id: 'query', labelKey: 'nav.query', icon: '>' },
    { id: 'history', labelKey: 'nav.history', icon: '[' },
    { id: 'docs', labelKey: 'nav.docs', icon: '?' },
    { id: 'settings', labelKey: 'nav.config', icon: '$' },
  ];

  return (
    <>
      {isOpen && <div className="nav-drawer-overlay" onClick={onToggle} />}
      <aside className={`nav-drawer ${isOpen ? 'nav-drawer-open' : ''}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <span className="nav-drawer-brand-text">FOFA</span>
            <span className="nav-drawer-brand-accent">_SENTINEL</span>
          </div>
          <button
            className="nav-drawer-close-btn"
            onClick={onToggle}
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          >
            <span className="nav-drawer-close-icon">{isOpen ? '×' : '☰'}</span>
          </button>
        </div>

        <div className="nav-drawer-top">
          <div className="nav-drawer-status">
            <span className="status-dot"></span>
            <span className="status-text">{t('common.online')}</span>
          </div>
          <LanguageSelector />
        </div>

        <div className="nav-drawer-divider"></div>

        <nav className="nav-drawer-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-drawer-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                onPageChange(item.id);
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              aria-label={`Navigate to ${t(item.labelKey)} page`}
              aria-current={currentPage === item.id ? 'page' : undefined}
            >
              <span className="nav-drawer-item-icon">{item.icon}</span>
              <span className="nav-drawer-item-label">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="nav-drawer-footer">
          <div className="nav-drawer-footer-line">─</div>
          <div className="nav-drawer-footer-text">v0.1.0</div>
        </div>
      </aside>

      <button
        className="nav-drawer-toggle"
        onClick={onToggle}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
      >
        <span className="nav-drawer-toggle-icon">☰</span>
      </button>
    </>
  );
}
