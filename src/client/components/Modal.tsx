import { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'error' | 'warning' | 'success';
}

export function Modal({ isOpen, onClose, title, message, type = 'info' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className={`modal-content modal-${type}`}>
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="modal-body">
            <p className="modal-message">{message}</p>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary modal-confirm" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
