import React, { useState } from 'react';

function DeleteDocModal({ doc, isOpen, onClose, onConfirmDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !doc) return null;

  const handleDelete = async () => {
    setError('');
    try {
      setIsDeleting(true);
      await onConfirmDelete(doc.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-md w-full bg-dark-800 border border-white/10 rounded-2xl p-6 shadow-2xl">
        
        {/* Warning Icon & Heading */}
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold font-grotesk text-white">Delete Document</h2>
            <p className="text-xs text-gray-400">This action cannot be undone.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <p className="text-sm text-gray-300 mb-6">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-white">"{doc.title || 'Untitled Document'}"</span>?
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/40 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/25 transition flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Document'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default DeleteDocModal;
