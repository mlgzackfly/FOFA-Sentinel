import { useTranslation } from '../hooks/useTranslation';
import './Sidebar.css';

type Page = 'query' | 'history' | 'settings' | 'docs';

interface SidebarProps {
  isOpen: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, currentPage, onPageChange, onClose }: SidebarProps) {
  const { t } = useTranslation();

  const menuItems: { id: Page; labelKey: string; icon: string }[] = [
    { id: 'query', labelKey: 'nav.query', icon: '>' },
    { id: 'history', labelKey: 'nav.history', icon: '[' },
    { id: 'docs', labelKey: 'nav.docs', icon: '?' },
    { id: 'settings', labelKey: 'nav.config', icon: '$' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">{t('nav.navigation') || 'NAVIGATION'}</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                onPageChange(item.id);
                onClose();
              }}
              aria-label={`Navigate to ${t(item.labelKey)} page`}
              aria-current={currentPage === item.id ? 'page' : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-line">─</div>
          <div className="sidebar-footer-text">v0.2.0</div>
        </div>
      </aside>
    </>
  );
}
