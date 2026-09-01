import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDocuments, createDocument, deleteDocument } from '../services/document.service';
import Sidebar from '../components/Sidebar';
import DocumentCard from '../components/DocumentCard';
import CreateDocModal from '../components/CreateDocModal';
import DeleteDocModal from '../components/DeleteDocModal';

function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDocToDelete, setSelectedDocToDelete] = useState(null);

  // Load user documents on mount
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Handle document creation
  const handleCreateDocument = async (title, icon) => {
    const newDoc = await createDocument(title, icon);
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    await deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Filter documents by search query
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = (doc.title || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex font-outfit">
      
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Navbar with Live Search */}
        <header className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          
          {/* Welcome Banner */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-grotesk text-white">
                Welcome, {user?.name || 'Collaborator'} 👋
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Manage your real-time workspaces, notes, and collaborative documents.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-dark-800/60 border border-white/5 px-3 py-1.5 rounded-xl self-start md:self-auto">
              <span>Total Documents:</span>
              <span className="text-indigo-400 font-bold">{documents.length}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={loadDocuments}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading your workspaces...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty State */
            <div className="py-20 bg-dark-800/30 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
                📝
              </div>
              <h3 className="text-lg font-bold font-grotesk text-white mb-1">
                {searchQuery ? 'No matching documents found' : 'No documents yet'}
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mb-6">
                {searchQuery
                  ? `No document titles matching "${searchQuery}". Try a different search keyword.`
                  : 'Get started by creating your first collaborative workspace document.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2"
              >
                <span>+</span>
                <span>Create New Document</span>
              </button>
            </div>
          ) : (
            /* Documents Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onRequestDelete={(d) => setSelectedDocToDelete(d)}
                />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      <CreateDocModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDocument}
      />

      <DeleteDocModal
        doc={selectedDocToDelete}
        isOpen={!!selectedDocToDelete}
        onClose={() => setSelectedDocToDelete(null)}
        onConfirmDelete={handleDeleteDocument}
      />

    </div>
  );
}

export default Dashboard;
