import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { getDocumentById, updateDocument } from '../services/document.service';

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📄');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const availableIcons = ['📄', '📝', '💡', '🚀', '📊', '🎯', '💻', '📚', '⚡', '🛠️', '✨', '🔥'];

  // Ref to hold debounce timeout
  const debounceTimerRef = useRef(null);
  // Ref to track initial fetch load to prevent false initial saves
  const isInitialLoadRef = useRef(true);

  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await getDocumentById(id);
        setDocumentData(doc);
        setTitle(doc.title || 'Untitled Document');
        setIcon(doc.icon || '📄');
        setContent(doc.content || '');
        setLastSavedTime(new Date(doc.updatedAt || doc.createdAt));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to fetch document:', err);
        setError(err.message || 'Could not load document');
      } finally {
        setLoading(false);
        // Allow autosave to start tracking changes after mount
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500);
      }
    };

    loadDocument();

    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [id]);

  // Debounced save trigger
  const triggerAutoSave = useCallback((newTitle, newIcon, newContent) => {
    if (isInitialLoadRef.current) return;

    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        const updated = await updateDocument(id, {
          title: newTitle,
          icon: newIcon,
          content: newContent
        });
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('AutoSave Error:', err);
        setSaveStatus('error');
      }
    }, 1500); // 1.5 second debounce delay
  }, [id]);

  // Handle content change from Quill
  const handleContentChange = (value) => {
    setContent(value);
    triggerAutoSave(title, icon, value);
  };

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerAutoSave(newTitle, icon, content);
  };

  // Handle icon selection
  const handleIconSelect = (selectedIcon) => {
    setIcon(selectedIcon);
    setShowIconPicker(false);
    triggerAutoSave(title, selectedIcon, content);
  };

  // Calculate live word and character counts
  const calculateStats = () => {
    const textOnly = content.replace(/<[^>]*>/g, '').trim();
    const chars = textOnly.length;
    const words = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
    return { words, chars };
  };

  const { words, chars } = calculateStats();

  // Quill editor formatting modules
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
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Opening workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col font-outfit">
      
      {/* Top Header & Status Bar */}
      <header className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Back & Title Edit */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <button
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
            className="px-3 py-1.5 bg-dark-800 hover:bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>←</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Icon Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Change icon"
              className="w-9 h-9 rounded-xl bg-dark-800 border border-white/10 hover:border-indigo-500/40 text-xl flex items-center justify-center transition"
            >
              {icon}
            </button>

            {showIconPicker && (
              <div className="absolute left-0 top-12 z-30 p-2 bg-dark-800 border border-white/10 rounded-xl shadow-2xl flex flex-wrap gap-1.5 w-48 animate-fadeIn">
                {availableIcons.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => handleIconSelect(ic)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 text-base flex items-center justify-center transition"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inline Editable Document Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            className="flex-1 px-3 py-1.5 bg-transparent hover:bg-white/5 focus:bg-dark-800/80 border border-transparent focus:border-indigo-500/40 rounded-xl font-bold font-grotesk text-lg text-white placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        {/* Right: Saving Status & Word Counter */}
        <div className="flex items-center gap-4">
          
          {/* Word Counter */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-dark-800/60 border border-white/5 px-3 py-1.5 rounded-xl font-mono">
            <span>{words} words</span>
            <span className="text-gray-600">•</span>
            <span>{chars} chars</span>
          </div>

          {/* Dynamic Save Status Pill */}
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-spin"></span>
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span>✓</span>
                <span>Saved to Cloud</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Unsaved changes...</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Save failed</span>
              </span>
            )}
          </div>

        </div>
      </header>

      {/* Main Rich Text Editor Canvas */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="max-w-4xl w-full bg-dark-800/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-10 flex-1 flex flex-col min-h-[750px]">
          
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            placeholder="Type '/' or start writing your collaborative document here..."
            className="collabspace-editor flex-1 flex flex-col"
          />

        </div>
      </main>

    </div>
  );
}

export default Editor;
