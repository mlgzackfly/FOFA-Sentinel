import './Sidebar.css';

type Page = 'query' | 'history' | 'settings' | 'docs';

interface SidebarProps {
  isOpen: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, currentPage, onPageChange, onClose }: SidebarProps) {
  const menuItems: { id: Page; label: string; icon: string }[] = [
    { id: 'query', label: 'QUERY', icon: '>' },
    { id: 'history', label: 'HISTORY', icon: '[' },
    { id: 'docs', label: 'DOCS', icon: '?' },
    { id: 'settings', label: 'CONFIG', icon: '$' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">NAVIGATION</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                onPageChange(item.id);
                onClose();
              }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-line">─</div>
          <div className="sidebar-footer-text">v0.1.0</div>
        </div>
      </aside>
    </>
  );
}

