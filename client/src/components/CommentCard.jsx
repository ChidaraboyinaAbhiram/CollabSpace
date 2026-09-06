import React, { useState } from 'react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';

function CommentCard({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onDelete
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const author = comment.author || { name: 'Anonymous', email: 'user@collabspace.com' };
  const replies = comment.replies || [];
  const isAuthor = currentUserId && (author.id === currentUserId || author.userId === currentUserId);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`p-3.5 rounded-xl border transition-all ${
      comment.resolved
        ? 'bg-dark-900/40 border-white/5 opacity-75'
        : 'bg-dark-800/80 border-white/10 shadow-lg hover:border-indigo-500/30'
    }`}>
      {/* Anchored Highlight Quote (if any) */}
      {comment.highlightedText && (
        <div className="mb-2.5 px-2.5 py-1.5 bg-amber-500/10 border-l-2 border-amber-400 rounded-r-lg text-xs text-amber-200/90 italic truncate">
          "{comment.highlightedText}"
        </div>
      )}

      {/* Author Header & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Avatar name={author.name} email={author.email} size="sm" />
          <div>
            <div className="text-xs font-semibold text-white">{author.name}</div>
            <div className="text-[10px] text-gray-400">{formattedDate}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Resolve / Re-open Toggle */}
          <button
            onClick={() => onResolve(comment.id, !comment.resolved)}
            title={comment.resolved ? 'Re-open thread' : 'Mark as resolved'}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              comment.resolved
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span>✓</span>
            <span className="text-[10px]">{comment.resolved ? 'Resolved' : 'Resolve'}</span>
          </button>

          {/* Delete Button (Author only) */}
          {isAuthor && (
            <button
              onClick={() => onDelete(comment.id)}
              title="Delete comment"
              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition cursor-pointer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Main Comment Body */}
      <p className="text-xs text-gray-200 leading-relaxed break-words mb-2 pl-1">
        {comment.content}
      </p>

      {/* Nested Replies List */}
      {replies.length > 0 && (
        <div className="mt-3 pl-3 border-l border-white/10 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-dark-900/60 p-2.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={reply.author?.name} email={reply.author?.email} size="sm" />
                <span className="text-[11px] font-medium text-white">{reply.author?.name}</span>
                <span className="text-[9px] text-gray-500">
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-300 break-words pl-1">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Action Button / Input */}
      {!comment.resolved && (
        <div className="mt-2.5 pt-2 border-t border-white/5">
          {!showReplyInput ? (
            <button
              onClick={() => setShowReplyInput(true)}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center gap-1"
            >
              <span>💬</span>
              <span>Reply</span>
            </button>
          ) : (
            <form onSubmit={handleSendReply} className="space-y-2 animate-fadeIn">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-dark-900/80 border border-white/10 focus:border-indigo-500/50 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmitting}
                  disabled={!replyText.trim()}
                >
                  Reply
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentCard;
