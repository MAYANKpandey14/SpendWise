import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-bg dark:bg-bg-dark border border-border dark:border-border-dark rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
          <h3 className="font-semibold text-text-DEFAULT dark:text-text-dark">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-DEFAULT dark:hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-6">
           {description && (
             <p className="text-sm text-text-muted mb-4">{description}</p>
           )}
           {children}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-bg-subtle dark:bg-bg-subtle-dark border-t border-border dark:border-border-dark">
          {footer ? footer : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
              {onConfirm && (
                <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
                  {confirmLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};