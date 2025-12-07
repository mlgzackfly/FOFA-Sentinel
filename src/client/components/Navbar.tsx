import { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import './Navbar.css';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation();
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <span className="navbar-menu-icon">☰</span>
        </button>
        <div className="navbar-brand">
          <span className="navbar-brand-text">FOFA</span>
          <span className="navbar-brand-accent">_CLIENT</span>
        </div>
        <div className="navbar-right">
          <LanguageSelector />
          <div className="navbar-status">
            <span className="status-dot"></span>
            <span className="status-text">{t('common.online')}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

