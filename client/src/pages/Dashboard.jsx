import React from 'react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-dark-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-dark-900 to-dark-900 text-gray-100 flex flex-col font-outfit p-8">
      
      {/* Navigation Header */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center border-b border-white/10 pb-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/30">
            CS
          </div>
          <div>
            <h1 className="text-xl font-bold font-grotesk text-white">CollabSpace Workspace</h1>
            <p className="text-gray-400 text-xs">Sprint 1: Authenticated Session</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition duration-200"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto flex-grow flex flex-col justify-center">
        <div className="bg-dark-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
              🔑
            </div>
            <div>
              <h2 className="text-2xl font-bold font-grotesk text-white">JWT Session Active</h2>
              <p className="text-gray-400 text-sm">Protected route verification successful</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-dark-900/60 border border-white/5 rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">User Identifier (UUID)</span>
              <span className="text-indigo-300 font-mono text-sm break-all">{user?.id}</span>
            </div>
            <div className="p-4 bg-dark-900/60 border border-white/5 rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Account Created</span>
              <span className="text-gray-200 text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200 text-sm">
            💡 <strong>Next Sprint Milestone:</strong> In Sprint 2, this workspace will become the interactive Document Dashboard, featuring document listings, creation modals, and deletion workflows.
          </div>
        </div>
      </main>

    </div>
  );
}

export default Dashboard;
