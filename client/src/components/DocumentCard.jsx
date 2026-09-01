import React from 'react';
import { useNavigate } from 'react-router-dom';

function DocumentCard({ doc, onRequestDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // In Sprint 3, this navigates to the rich text editor
    navigate(`/document/${doc.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="group relative bg-dark-800/70 hover:bg-dark-800 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer">
      
      {/* Top Details & Delete Action */}
      <div onClick={handleCardClick}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-dark-900/80 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-indigo-500/40 transition-transform duration-200">
            {doc.icon || '📄'}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(doc);
            }}
            title="Delete Document"
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            🗑️
          </button>
        </div>

        <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition duration-200 truncate mb-1">
          {doc.title || 'Untitled Document'}
        </h3>
        <p className="text-gray-400 text-xs line-clamp-2 min-h-[32px]">
          {doc.content ? doc.content.substring(0, 80) : 'Empty document. Click to start writing...'}
        </p>
      </div>

      {/* Footer Meta */}
      <div 
        onClick={handleCardClick}
        className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500"
      >
        <span>Updated {formatDate(doc.updatedAt || doc.createdAt)}</span>
        <span className="text-indigo-400/80 group-hover:translate-x-1 transition-transform duration-200">
          Open →
        </span>
      </div>

    </div>
  );
}

export default DocumentCard;
