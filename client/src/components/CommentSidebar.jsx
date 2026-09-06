import React, { useState } from 'react';
import CommentCard from './CommentCard';
import Button from './ui/Button';

function CommentSidebar({
  isOpen,
  onClose,
  comments = [],
  currentUserId,
  onAddComment,
  onReply,
  onResolve,
  onDelete,
  pendingHighlight = null,
  onClearPendingHighlight
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'resolved'
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);
  const displayedComments = activeTab === 'active' ? activeComments : resolvedComments;

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        content: newCommentText.trim(),
        highlightedText: pendingHighlight?.text || null,
        startIndex: pendingHighlight?.range?.index || null,
        endIndex: pendingHighlight?.range
          ? pendingHighlight.range.index + pendingHighlight.range.length
          : null
      });

      setNewCommentText('');
      if (onClearPendingHighlight) onClearPendingHighlight();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-dark-900/95 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col shadow-2xl animate-fadeIn">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-bold text-sm text-white font-grotesk">Comments & Reviews</h3>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
            {activeComments.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-white/5 bg-dark-800/40 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'active'
              ? 'bg-dark-700 text-indigo-400 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active ({activeComments.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'resolved'
              ? 'bg-dark-700 text-emerald-400 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Resolved ({resolvedComments.length})
        </button>
      </div>

      {/* New Comment Composer (Draft Box) */}
      <div className="p-4 border-b border-white/10 bg-dark-800/60">
        {pendingHighlight && (
          <div className="mb-2.5 p-2 bg-amber-500/10 border-l-2 border-amber-400 rounded-r-lg flex items-center justify-between gap-2">
            <span className="text-xs text-amber-200/90 italic truncate">
              "{pendingHighlight.text}"
            </span>
            <button
              onClick={onClearPendingHighlight}
              title="Remove highlight anchor"
              className="text-amber-400 hover:text-amber-300 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleCreateComment} className="space-y-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              pendingHighlight
                ? 'Add a comment on highlighted text...'
                : 'Write a general document note or question...'
            }
            rows={2}
            className="w-full px-3 py-2 bg-dark-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none resize-none transition"
          />

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={!newCommentText.trim()}
              icon="💬"
            >
              Post Comment
            </Button>
          </div>
        </form>
      </div>

      {/* Comments Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {displayedComments.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500">
            <div className="text-3xl mb-2">{activeTab === 'active' ? '💭' : '🎉'}</div>
            <p className="text-xs font-medium">
              {activeTab === 'active'
                ? 'No active discussions yet.'
                : 'No resolved comments.'}
            </p>
            {activeTab === 'active' && (
              <p className="text-[11px] text-gray-600 mt-1">
                Highlight text in the editor to start a discussion!
              </p>
            )}
          </div>
        ) : (
          displayedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={onReply}
              onResolve={onResolve}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default CommentSidebar;
