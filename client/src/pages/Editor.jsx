import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { DocumentProvider, useDocument } from '../context/DocumentContext';
import { getSocket } from '../services/socket.service';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import ShareModal from '../components/ShareModal';
import CursorOverlay from '../components/CursorOverlay';
import TypingIndicator from '../components/TypingIndicator';

function EditorInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    document: doc,
    title,
    icon,
    content,
    saveStatus,
    loading,
    error,
    updateTitle,
    updateIcon,
    updateContent,
    saveNow,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator
  } = useDocument();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  const quillRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  const availableIcons = ['📄', '📝', '💡', '🚀', '📊', '🎯', '💻', '📚', '⚡', '🛠️', '✨', '🔥'];

  // 1. Socket Lifecycle: Join Document Room, Presence, Cursors & Typing Events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;
    socketRef.current = socket;

    socket.emit('join-document', id);

    // Initial presence roster of users already in room
    const handlePresence = (usersList) => {
      setActiveUsers(usersList);
    };

    // Incoming Delta changes from peers
    const handleReceiveChanges = (delta) => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        editor.updateContents(delta);
      }
    };

    // User Joined Notification
    const handleUserJoined = (user) => {
      setActiveUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    };

    // User Left Notification
    const handleUserLeft = ({ userId }) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
      setRemoteCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    // Remote Cursor Positions
    const handleRemoteCursor = ({ userId, range, user }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { range, user }
      }));
    };

    const handleRemoveCursor = ({ userId }) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    // Live Typing Indicators
    const handleUserTyping = ({ userId, name }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, name }];
      });
    };

    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('document-presence', handlePresence);
    socket.on('receive-changes', handleReceiveChanges);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('remote-cursor-update', handleRemoteCursor);
    socket.on('remove-cursor', handleRemoveCursor);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.emit('leave-document', id);
      socket.off('document-presence', handlePresence);
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('remote-cursor-update', handleRemoteCursor);
      socket.off('remove-cursor', handleRemoveCursor);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [id]);

  // 2. Quill Text-Change & Selection-Change Listeners
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    // Broadcast Delta Changes & Trigger Typing Indicator
    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user') return;

      if (socketRef.current && id) {
        socketRef.current.emit('send-changes', { documentId: id, delta });

        // Emit typing notification
        socketRef.current.emit('user-typing', { documentId: id });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          if (socketRef.current && id) {
            socketRef.current.emit('user-stop-typing', { documentId: id });
          }
        }, 2000);
      }
    };

    // Broadcast Cursor Movement / Range
    const handleSelectionChange = (range, oldRange, source) => {
      if (source !== 'user' || !range) return;

      if (socketRef.current && id) {
        socketRef.current.emit('cursor-move', {
          documentId: id,
          range
        });
      }
    };

    editor.on('text-change', handleTextChange);
    editor.on('selection-change', handleSelectionChange);

    return () => {
      editor.off('text-change', handleTextChange);
      editor.off('selection-change', handleSelectionChange);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [id]);

  // 3. Keyboard Shortcut for Manual Save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);

  const calculateStats = () => {
    const textOnly = content ? content.replace(/<[^>]*>/g, '').trim() : '';
    const chars = textOnly.length;
    const words = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
    return { words, chars };
  };

  const { words, chars } = calculateStats();

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-gray-400 gap-3 font-outfit">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Connecting to live workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="max-w-md w-full bg-dark-800 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Open Document</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const collaborators = doc?.collaborators || [];
  const owner = doc?.owner || { name: 'Owner', email: 'owner@collabspace.com' };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col font-outfit">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Back & Title Edit */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <button
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
            className="px-3 py-1.5 bg-dark-800 hover:bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>←</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Icon Selector */}
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Change icon"
              className="w-9 h-9 rounded-xl bg-dark-800 border border-white/10 hover:border-indigo-500/40 text-xl flex items-center justify-center transition cursor-pointer"
            >
              {icon}
            </button>

            {showIconPicker && (
              <div className="absolute left-0 top-12 z-30 p-2 bg-dark-800 border border-white/10 rounded-xl shadow-2xl flex flex-wrap gap-1.5 w-48 animate-fadeIn">
                {availableIcons.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => {
                      updateIcon(ic);
                      setShowIconPicker(false);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 text-base flex items-center justify-center transition cursor-pointer"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Untitled Document"
            className="flex-1 px-3 py-1.5 bg-transparent hover:bg-white/5 focus:bg-dark-800/80 border border-transparent focus:border-indigo-500/40 rounded-xl font-bold font-grotesk text-lg text-white placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        {/* Right: Active Users Presence, Word Count, Save Status, Share Button */}
        <div className="flex items-center gap-3.5">
          {/* Active Online Users Avatars Stack with Live Pulse Dot */}
          <div className="hidden lg:flex items-center -space-x-2">
            <div className="relative" title={`${owner.name} (Owner)`}>
              <Avatar name={owner.name} email={owner.email} size="sm" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-dark-900 animate-pulse"></span>
            </div>

            {activeUsers.map((u) => (
              <div key={u.id} className="relative" title={`${u.name || u.email} (Online)`}>
                <Avatar name={u.name || 'User'} email={u.email} size="sm" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-dark-900"></span>
              </div>
            ))}
          </div>

          {/* Word Counter */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-dark-800/60 border border-white/5 px-3 py-1.5 rounded-xl font-mono">
            <span>{words} words</span>
            <span className="text-gray-600">•</span>
            <span>{chars} chars</span>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <Badge variant="primary" dot>
                Saving...
              </Badge>
            )}
            {saveStatus === 'saved' && (
              <Badge variant="success">
                ✓ Live Sync
              </Badge>
            )}
            {saveStatus === 'unsaved' && (
              <Badge variant="warning" dot>
                Unsaved changes...
              </Badge>
            )}
            {saveStatus === 'error' && (
              <Badge variant="danger">
                ⚠️ Save failed
              </Badge>
            )}
          </div>

          {/* Share Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            icon="👥"
          >
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </header>

      {/* Main Rich Text Editor Canvas with Remote Cursors Overlay */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 relative">
        <div className="max-w-4xl w-full bg-dark-800/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-10 flex-1 flex flex-col min-h-[750px] relative">
          {/* Multi-User Cursor Overlay */}
          <CursorOverlay cursors={remoteCursors} quillRef={quillRef} />

          {/* Quill Editor */}
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={updateContent}
            modules={modules}
            placeholder="Type '/' or start writing your collaborative document here..."
            className="collabspace-editor flex-1 flex flex-col"
          />
        </div>

        {/* Live Floating Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={doc}
        onShare={addCollaborator}
        onUpdateRole={updateCollaboratorRole}
        onRemoveCollaborator={removeCollaborator}
      />
    </div>
  );
}

function Editor() {
  const { id } = useParams();
  return (
    <DocumentProvider documentId={id}>
      <EditorInner />
    </DocumentProvider>
  );
}

export default Editor;
