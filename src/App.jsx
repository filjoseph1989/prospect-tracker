import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, Sun, Moon, RefreshCw, AlertCircle } from 'lucide-react';
import ProspectsTable from './components/ProspectsTable';
import BriefPage from './components/BriefPage';
import SummaryPage from './components/SummaryPage';

const API_BASE = '/api';

// Each route loads its data from one API endpoint and renders it with one page component
const ROUTES = {
  '/': {
    label: 'Prospects',
    endpoint: 'prospects',
    render: (data, updateData) => <ProspectsTable prospects={data} onProspectsChange={updateData} />,
  },
  '/brief': {
    label: 'Brief',
    endpoint: 'brief',
    render: data => <BriefPage brief={data} />,
  },
  '/summary': {
    label: 'Summary',
    endpoint: 'summary',
    render: data => <SummaryPage summary={data} />,
  },
};

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return ROUTES[path] ? path : '/';
}

export default function App() {
  const [path, setPath] = useState(currentPath);
  // Tagged with its endpoint so a page never renders with another route's data mid-navigation
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const route = ROUTES[path];
  const data = result?.endpoint === route.endpoint ? result.value : null;
  const activeEndpoint = useRef(route.endpoint);
  activeEndpoint.current = route.endpoint;

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

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (e, to) => {
    e.preventDefault();
    if (to === path) return;
    window.history.pushState(null, '', to);
    window.scrollTo(0, 0);
    setPath(to);
  };

  const fetchData = useCallback(async () => {
    const endpoint = route.endpoint;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const value = await res.json();
      if (activeEndpoint.current === endpoint) setResult({ endpoint, value });
    } catch (err) {
      if (activeEndpoint.current === endpoint) setError(err.message);
    } finally {
      if (activeEndpoint.current === endpoint) setLoading(false);
    }
  }, [route.endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lets a page apply local edits (e.g. a status change) to its loaded data without refetching
  const updateData = useCallback(updater => {
    setResult(prev => (prev ? { ...prev, value: updater(prev.value) } : prev));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-base text-white tracking-tight">UK Prospects</h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">v2</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Senpai Growth Studios · prospect list</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 p-1 rounded-lg bg-slate-800 border border-slate-700">
              {Object.entries(ROUTES).map(([to, { label }]) => (
                <a
                  key={to}
                  href={to}
                  onClick={e => navigate(e, to)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                    to === path ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
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
            <span>Could not load {route.label.toLowerCase()}: {error}</span>
          </div>
        ) : data === null ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading {route.label.toLowerCase()}…</div>
        ) : (
          route.render(data, updateData)
        )}
      </main>
    </div>
  );
}
