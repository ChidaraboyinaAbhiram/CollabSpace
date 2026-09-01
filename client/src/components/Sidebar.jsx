import React from 'react';
import { useAuth } from '../context/AuthContext';

function Sidebar({ activeTab, setActiveTab, onOpenCreateModal }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'all', label: 'All Documents', icon: '📁' },
    { id: 'recent', label: 'Recent', icon: '🕒' },
    { id: 'shared', label: 'Shared with Me', icon: '👥' },
    { id: 'favorites', label: 'Starred', icon: '⭐' }
  ];

  return (
    <aside className="w-64 bg-dark-800/90 border-r border-white/5 flex flex-col justify-between p-4 min-h-screen">
      
      {/* Top Branding & Actions */}
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-indigo-600/30">
            CS
          </div>
          <div>
            <h1 className="font-bold font-grotesk text-white text-base tracking-tight leading-none">CollabSpace</h1>
            <span className="text-[11px] text-gray-400 font-medium">Workspace</span>
          </div>
        </div>

        {/* Quick New Document Action */}
        <button
          onClick={onOpenCreateModal}
          className="w-full mb-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>New Document</span>
        </button>

        {/* Nav Links */}
        <nav className="space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-dark-900/60 border border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            🚪
          </button>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
