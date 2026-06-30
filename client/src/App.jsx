import React, { useState, useEffect } from 'react';

function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch health check:', err);
      setError(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-height-screen bg-dark-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-dark-900 to-dark-900 text-gray-100 flex flex-col justify-between p-8 font-outfit min-h-screen">
      
      {/* Navbar */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-grotesk tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            CollabSpace client
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sprint 0: Scaffolding and Environment Setup</p>
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
            <span className="w-2 height-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Vite + React
          </span>
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-full">
            Tailwind Active
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl w-full mx-auto my-12 flex-grow flex flex-col justify-center">
        <div className="bg-dark-800/60 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl hover:border-indigo-500/20 transition-all duration-300">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white font-grotesk">Backend Connection Tester</h2>
              <p className="text-gray-400 text-sm mt-1">Queries Express health API at localhost:5000</p>
            </div>
            <button 
              onClick={checkBackendHealth} 
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Pinging...' : 'Ping Server'}
            </button>
          </div>

          {/* Status Indicators */}
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm">Testing connectivity to API...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <span className="text-red-400 mt-0.5">⚠️</span>
              <div>
                <h4 className="font-semibold text-red-400 text-sm">Connection Failed</h4>
                <p className="text-gray-400 text-xs mt-1">{error}</p>
                <p className="text-gray-500 text-[10px] mt-2 font-mono">Ensure Node backend is running: npm run dev in server/</p>
              </div>
            </div>
          ) : healthData ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5">✅</span>
                <div>
                  <h4 className="font-semibold text-emerald-400 text-sm">Server Status: Online</h4>
                  <p className="text-gray-300 text-xs mt-1">{healthData.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-dark-900/40 border border-white/5 p-3 rounded-lg">
                  <span className="text-gray-500 block mb-1">Status Code</span>
                  <span className="text-emerald-400 font-semibold">200 OK</span>
                </div>
                <div className="bg-dark-900/40 border border-white/5 p-3 rounded-lg">
                  <span className="text-gray-500 block mb-1">Endpoint</span>
                  <span className="text-indigo-400 font-semibold">/api/health</span>
                </div>
                <div className="bg-dark-900/40 border border-white/5 p-3 rounded-lg col-span-2">
                  <span className="text-gray-500 block mb-1">Server Time</span>
                  <span className="text-gray-300">{new Date(healthData.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-white/5 pt-6 text-center text-xs text-gray-500">
        <p>CollabSpace - Final Year B.Tech CSE Project Scaffolding. Double click progress.html in root folder to open roadmap tracker.</p>
      </footer>
    </div>
  );
}

export default App;
