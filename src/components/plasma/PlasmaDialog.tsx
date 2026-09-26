import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Plasma } from '@cruxgarden/plasma-ui';

export interface PlasmaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}

export const PlasmaDialog: React.FC<PlasmaDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth = 'max-w-xl',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Plasma
        as="div"
        elevation={0.7}
        radius={22}
        fuse={false}
        className={`w-full ${maxWidth} bg-[var(--bg-card)]/90 border border-[var(--border-card)] rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 backdrop-blur-2xl`}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-card)]/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                {icon}
              </div>
            )}
            <div>
              {title && <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>}
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
          </div>

          <button
            data-plasma-nodrag
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-5 max-h-[calc(85vh-100px)] overflow-y-auto">{children}</div>
      </Plasma>
    </div>
  );
};

export default PlasmaDialog;
