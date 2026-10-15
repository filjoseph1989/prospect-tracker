import React, { useState, useEffect } from 'react';
import { Building2, Sun, Moon, RefreshCw, AlertCircle } from 'lucide-react';
import ProspectsTable from './components/ProspectsTable';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prospect_tracker_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('prospect_tracker_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900', 'light');
      document.body.classList.add('bg-slate-950', 'text-slate-100', 'dark');
    }
  }, [theme]);

  const fetchProspects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/prospects`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setProspects(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base text-white tracking-tight">UK Prospects</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">v2</span>
              </div>
              <p className="text-xs text-slate-400">Senpai Growth Studios · prospect list</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchProspects}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Reload"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="flex items-center space-x-2 p-4 rounded-xl border border-rose-700 bg-rose-950/60 text-rose-200 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not load prospects: {error}</span>
          </div>
        ) : loading && prospects.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading prospects…</div>
        ) : (
          <ProspectsTable prospects={prospects} />
        )}
      </main>
    </div>
  );
}
