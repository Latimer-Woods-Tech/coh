/**
 * Modal Component
 * Reusable dialog for forms and confirmations
 */

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  actions,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = {
    sm: '400px',
    md: '600px',
    lg: '800px',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <div
        className="rounded border shadow-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#2C1810',
          borderColor: '#3D2B1F',
          maxWidth,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: '#3D2B1F',
            borderColor: '#3D2B1F',
          }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: '#F5ECD7',
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                className="text-sm mt-1"
                style={{
                  color: '#704214',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-2xl transition-opacity hover:opacity-60"
            style={{
              color: '#704214',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer with actions */}
        {actions && actions.length > 0 && (
          <div
            className="px-6 py-4 border-t flex items-center justify-end gap-3"
            style={{
              backgroundColor: '#3D2B1F',
              borderColor: '#3D2B1F',
            }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="px-4 py-2 rounded font-medium text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor:
                    action.variant === 'danger'
                      ? 'rgba(160, 82, 45, 0.2)'
                      : action.variant === 'secondary'
                        ? 'transparent'
                        : '#C9A84C',
                  color:
                    action.variant === 'danger'
                      ? '#A0522D'
                      : action.variant === 'secondary'
                        ? '#704214'
                        : '#2C1810',
                  border:
                    action.variant === 'secondary'
                      ? '1px solid #3D2B1F'
                      : 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
