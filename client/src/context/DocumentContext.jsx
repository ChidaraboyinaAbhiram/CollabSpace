import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  getDocumentById,
  updateDocument as apiUpdateDocument,
  shareDocument as apiShareDocument,
  updateCollaboratorRole as apiUpdateCollaboratorRole,
  removeCollaborator as apiRemoveCollaborator
} from '../services/document.service';

const DocumentContext = createContext(null);

export function DocumentProvider({ children, documentId }) {
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📄');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Load document
  const loadDoc = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocumentById(id);
      setDocument(data);
      setTitle(data.title || 'Untitled Document');
      setIcon(data.icon || '📄');
      setContent(data.content || '');
      setLastSavedTime(new Date(data.updatedAt || data.createdAt));
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError(err.message || 'Could not load document');
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (documentId) {
      isInitialLoadRef.current = true;
      loadDoc(documentId);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [documentId, loadDoc]);

  // Debounced Autosave Engine
  const triggerAutoSave = useCallback((newTitle, newIcon, newContent) => {
    if (isInitialLoadRef.current || !documentId) return;

    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        const updated = await apiUpdateDocument(documentId, {
          title: newTitle,
          icon: newIcon,
          content: newContent
        });
        setSaveStatus('saved');
        setLastSavedTime(new Date());
        setDocument(prev => prev ? { ...prev, ...updated } : updated);
      } catch (err) {
        console.error('AutoSave Error:', err);
        setSaveStatus('error');
      }
    }, 1500);
  }, [documentId]);

  // Immediate Save (Ctrl+S / Shortcut)
  const saveNow = useCallback(async () => {
    if (!documentId) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    try {
      setSaveStatus('saving');
      const updated = await apiUpdateDocument(documentId, { title, icon, content });
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      setDocument(prev => prev ? { ...prev, ...updated } : updated);
    } catch (err) {
      setSaveStatus('error');
      throw err;
    }
  }, [documentId, title, icon, content]);

  const updateTitle = (newTitle) => {
    setTitle(newTitle);
    triggerAutoSave(newTitle, icon, content);
  };

  const updateIcon = (newIcon) => {
    setIcon(newIcon);
    triggerAutoSave(title, newIcon, content);
  };

  const updateContent = (newContent) => {
    setContent(newContent);
    triggerAutoSave(title, icon, newContent);
  };

  // Collaborators Management
  const addCollaborator = async (email, role) => {
    if (!documentId) return;
    const collaborator = await apiShareDocument(documentId, email, role);
    setDocument(prev => {
      if (!prev) return prev;
      const collabs = prev.collaborators ? [...prev.collaborators] : [];
      const idx = collabs.findIndex(c => c.userId === collaborator.userId);
      if (idx >= 0) {
        collabs[idx] = collaborator;
      } else {
        collabs.push(collaborator);
      }
      return { ...prev, collaborators: collabs };
    });
    return collaborator;
  };

  const updateCollaboratorRole = async (userId, role) => {
    if (!documentId) return;
    const updated = await apiUpdateCollaboratorRole(documentId, userId, role);
    setDocument(prev => {
      if (!prev || !prev.collaborators) return prev;
      const collabs = prev.collaborators.map(c => c.userId === userId ? { ...c, role } : c);
      return { ...prev, collaborators: collabs };
    });
    return updated;
  };

  const removeCollaborator = async (userId) => {
    if (!documentId) return;
    await apiRemoveCollaborator(documentId, userId);
    setDocument(prev => {
      if (!prev || !prev.collaborators) return prev;
      return {
        ...prev,
        collaborators: prev.collaborators.filter(c => c.userId !== userId)
      };
    });
  };

  const value = {
    document,
    title,
    icon,
    content,
    saveStatus,
    lastSavedTime,
    loading,
    error,
    updateTitle,
    updateIcon,
    updateContent,
    saveNow,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    reloadDocument: () => loadDoc(documentId)
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
