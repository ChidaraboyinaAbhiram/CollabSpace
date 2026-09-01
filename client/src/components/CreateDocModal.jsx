import React, { useState } from 'react';

function CreateDocModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📄');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const icons = ['📄', '📝', '💡', '🚀', '📊', '🎯', '💻', '📚', '⚡', '🛠️'];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await onCreate(title.trim() || 'Untitled Document', selectedIcon);
      setTitle('');
      setSelectedIcon('📄');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-md w-full bg-dark-800 border border-white/10 rounded-2xl p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-grotesk text-white">Create New Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg text-lg leading-none transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Choose Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {icons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all duration-200 ${
                    selectedIcon === emoji
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 scale-110 shadow-lg shadow-indigo-600/20'
                      : 'bg-dark-900/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Roadmap 2026"
              className="w-full px-4 py-3 bg-dark-900/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition duration-200"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                'Create Document'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default CreateDocModal;
