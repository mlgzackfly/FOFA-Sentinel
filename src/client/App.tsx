import { useState, useEffect } from 'react';
import { QueryPage } from './pages/QueryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocsPage } from './pages/DocsPage';
import { ScanResultsPage } from './pages/ScanResultsPage';
import { PocManagementPage } from './pages/PocManagementPage';
import { ModalTestPage } from './pages/ModalTestPage';
import { NavigationDrawer } from './components/NavigationDrawer';
import { getLocale } from './i18n';
import { type Page } from './types';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('query');
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setDrawerOpen(true);
      }
    };

    if (window.innerWidth >= 1024) {
      setDrawerOpen(true);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Allow access to modal test page via URL hash
  useEffect(() => {
    if (window.location.hash === '#modal-test') {
      setCurrentPage('modal-test');
    }
  }, []);

  return (
    <div className="app">
      <NavigationDrawer
        isOpen={drawerOpen}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onToggle={() => setDrawerOpen(!drawerOpen)}
      />
      <main className={`app-main ${drawerOpen ? 'drawer-open' : ''}`}>
        {currentPage === 'query' && <QueryPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'scan-results' && <ScanResultsPage />}
        {currentPage === 'poc' && <PocManagementPage />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'settings' && <SettingsPage onPageChange={setCurrentPage} />}
        {currentPage === 'modal-test' && <ModalTestPage />}
      </main>
    </div>
  );
}

export default App;
