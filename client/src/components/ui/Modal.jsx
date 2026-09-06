import React, { useEffect } from 'react';

function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop Click Listener */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Card Content */}
      <div 
        className={`relative z-10 w-full ${maxWidth} bg-dark-800 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-scaleUp ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && <h3 className="text-xl font-bold font-grotesk text-white">{title}</h3>}
            {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
