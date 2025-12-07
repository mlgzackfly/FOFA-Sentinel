import { useState, useEffect } from 'react';
import { QueryPage } from './pages/QueryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocsPage } from './pages/DocsPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { getLocale } from './i18n';
import './App.css';

type Page = 'query' | 'history' | 'settings' | 'docs';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('query');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocale] = useState(getLocale());

  useEffect(() => {
    const handleLocaleChange = () => {
      setLocale(getLocale());
    };
    
    window.addEventListener('localechange', handleLocaleChange);
    return () => {
      window.removeEventListener('localechange', handleLocaleChange);
    };
  }, []);

  return (
    <div className="app">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-layout">
        <Sidebar
          isOpen={sidebarOpen}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-main">
          {currentPage === 'query' && <QueryPage />}
          {currentPage === 'history' && <HistoryPage />}
          {currentPage === 'docs' && <DocsPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;

