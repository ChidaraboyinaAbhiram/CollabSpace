import React, { useState } from 'react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';

function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions = [],
  onCreateSnapshot,
  onRestoreVersion
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const handleCaptureSnapshot = async (e) => {
    e.preventDefault();
    setIsCapturing(true);
    try {
      await onCreateSnapshot(newSnapshotName.trim() || undefined);
      setNewSnapshotName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRestore = async (version) => {
    if (!window.confirm(`Are you sure you want to restore to "${version.versionName}"? Your current state will be backed up automatically.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      await onRestoreVersion(version.id);
      setSelectedVersion(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Overlay Backdrop */}
      <div className="flex-1 cursor-pointer" onClick={onClose}></div>

      {/* Main Version Panel */}
      <div className="w-full max-w-2xl bg-dark-900 border-l border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-bold text-sm text-white font-grotesk">Version History</h3>
              <p className="text-[11px] text-gray-400">Inspect past revisions and restore point-in-time snapshots</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Create Manual Snapshot Form */}
        <div className="p-4 border-b border-white/10 bg-dark-800/40">
          <form onSubmit={handleCaptureSnapshot} className="flex gap-2">
            <input
              type="text"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder="Name this version (e.g., 'Sprint 9 Final Draft')..."
              className="flex-1 px-3 py-2 bg-dark-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isCapturing}
              icon="💾"
            >
              Capture Snapshot
            </Button>
          </form>
        </div>

        {/* Content Area: Timeline List & Preview Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Versions Timeline List */}
          <div className="w-72 border-r border-white/5 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {versions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 p-4">
                <div className="text-2xl mb-2">📜</div>
                <p className="text-xs font-medium">No versions captured yet.</p>
                <p className="text-[11px] text-gray-600 mt-1">Capture a snapshot above to create your first milestone!</p>
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                const author = ver.createdBy || { name: 'Author', email: 'author@collabspace.com' };
                const formattedTime = new Date(ver.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-dark-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-xs text-white truncate max-w-[170px]">
                        {ver.versionName || `Version ${versions.length - idx}`}
                      </span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400">
                          Latest
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                      <Avatar name={author.name} email={author.email} size="sm" />
                      <span className="truncate">{author.name}</span>
                    </div>

                    <div className="text-[10px] text-gray-500">{formattedTime}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Version Snapshot Preview Pane */}
          <div className="flex-1 flex flex-col bg-dark-900 p-5 overflow-y-auto custom-scrollbar">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Preview Banner */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-indigo-300">
                      Previewing: {selectedVersion.versionName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Captured on {new Date(selectedVersion.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <Button
                    variant="success"
                    size="sm"
                    loading={isRestoring}
                    onClick={() => handleRestore(selectedVersion)}
                    icon="↺"
                  >
                    Restore This Version
                  </Button>
                </div>

                {/* Read-Only Content Canvas */}
                <div className="flex-1 p-6 bg-dark-800/80 border border-white/10 rounded-2xl shadow-inner min-h-[400px]">
                  <h2 className="text-lg font-bold text-white mb-4">{selectedVersion.title}</h2>
                  {selectedVersion.content ? (
                    <div
                      className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                    />
                  ) : (
                    <p className="text-xs text-gray-500 italic">This version snapshot was empty.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
                <div className="text-4xl mb-3">👁️</div>
                <h4 className="text-sm font-bold text-gray-300 mb-1">Select a Version to Preview</h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  Click on any historical snapshot in the left timeline to inspect its past content and restore it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VersionHistoryDrawer;
