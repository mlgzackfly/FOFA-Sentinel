import { createRoot } from 'react-dom/client';
import { Modal } from '../components/Modal';
import { useState } from 'react';

interface ModalOptions {
  title?: string;
  type?: 'info' | 'error' | 'warning' | 'success';
}

let modalContainer: HTMLDivElement | null = null;
let modalRoot: ReturnType<typeof createRoot> | null = null;

function createModalContainer() {
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-root';
    document.body.appendChild(modalContainer);
    modalRoot = createRoot(modalContainer);
  }
  return modalContainer;
}

export function showModal(message: string, options: ModalOptions = {}) {
  return new Promise<void>(resolve => {
    createModalContainer();

    const ModalWrapper = () => {
      const [isOpen, setIsOpen] = useState(true);

      const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
          if (modalRoot && modalContainer) {
            modalRoot.unmount();
            document.body.removeChild(modalContainer);
            modalContainer = null;
            modalRoot = null;
          }
          resolve();
        }, 200);
      };

      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          message={message}
          title={options.title}
          type={options.type}
        />
      );
    };

    if (modalRoot) {
      modalRoot.render(<ModalWrapper />);
    }
  });
}

// Convenience functions
export const alert = (message: string, options?: ModalOptions) => {
  return showModal(message, { ...options, type: options?.type || 'info' });
};

export const alertError = (message: string, title?: string) => {
  return showModal(message, { type: 'error', title });
};

export const alertWarning = (message: string, title?: string) => {
  return showModal(message, { type: 'warning', title });
};

export const alertSuccess = (message: string, title?: string) => {
  return showModal(message, { type: 'success', title });
};

export const alertInfo = (message: string, title?: string) => {
  return showModal(message, { type: 'info', title });
};
