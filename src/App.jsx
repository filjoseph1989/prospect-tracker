import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  Users, 
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle2,
  CalendarCheck2,
  Clock,
  Flame,
  UserCheck,
  ChevronRight,
  Eye,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import LinkedinIcon from './components/LinkedinIcon';
import CompanyDetailModal from './components/CompanyDetailModal';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // 4 Core Workflow Pages / Navigation Tabs:
  // 'todo' | 'in-progress' | 'followup' | 'done' | 'all'
  const [activeTab, setActiveTab] = useState('todo');

  // Search & State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSetter, setActiveSetter] = useState('Fil');
  const [copiedText, setCopiedText] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  // Dedicated single-company view modal
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch prospects from server
  const fetchProspects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/prospects`);
      if (!res.ok) throw new Error('Failed to fetch prospects');
      const data = await res.json();
      setProspects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  // Update company stage / move between pages
  const handleMoveStage = async (companyId, newStage, setter = activeSetter) => {
    const today = new Date().toISOString().split('T')[0];
    const updates = {
      stage: newStage,
      workedBy: setter,
      lastContactDate: today
    };

    // Optimistic UI update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update stage');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));

      const company = prospects.find(p => p.id === companyId);
      const name = company ? company.name : 'Company';

      if (newStage === 'Done') {
        showToast(`✅ Moved ${name} to Done!`);
      } else if (newStage === 'In Progress') {
        showToast(`⚡ Moved ${name} to In Progress (by ${setter})`);
      } else if (newStage === 'Follow-Up') {
        showToast(`⏳ Moved ${name} to Follow-Up`);
      } else {
        showToast(`📋 Moved ${name} to To Do`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to move company stage', 'error');
      fetchProspects(); // Rollback
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleNote = (rank) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
    showToast('Downloading CSV...');
  };

  // Helper to categorize company into 1 of the 4 tabs:
  // 'todo' | 'in-progress' | 'followup' | 'done'
  const getTabForProspect = (p) => {
    const stage = (p.stage || '').trim();
    if (stage === 'Done' || stage === 'Appointment Booked' || stage === 'Completed' || stage === 'Not a Fit' || stage === 'Bounced') {
      return 'done';
    }
    if (stage === 'Follow-Up' || stage === 'Follow-up' || stage === 'Follow-up Due' || stage === 'Follow-up 1' || stage === 'Follow-up 2') {
      return 'followup';
    }
    if (stage === 'In Progress' || stage === 'Contacted' || stage === 'Email Sent' || stage === 'LinkedIn Pending' || stage === 'LinkedIn Connected' || stage === 'In Discussion') {
      return 'in-progress';
    }
    return 'todo';
  };

  // Counts for each of the 4 tabs
  const tabCounts = useMemo(() => {
    const counts = { 'todo': 0, 'in-progress': 0, 'followup': 0, 'done': 0, 'all': prospects.length };
    prospects.forEach(p => {
      const tab = getTabForProspect(p);
      if (counts[tab] !== undefined) counts[tab]++;
    });
    return counts;
  }, [prospects]);

  // Filtered prospects based on active tab and search
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // 1. Tab filter
      if (activeTab !== 'all') {
        const pTab = getTabForProspect(p);
        if (pTab !== activeTab) return false;
      }

      // 2. Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const modelMatch = (p.businessModel || '').toLowerCase().includes(query);
        const oppMatch = (p.automationOpportunities || '').toLowerCase().includes(query);
        const notesMatch = (p.notes || '').toLowerCase().includes(query);
        const qualMatch = (p.qualification || '').toLowerCase().includes(query);
        const contactMatch = (p.contacts || []).some(c => 
          (c.name || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.role || '').toLowerCase().includes(query) ||
          (c.notes || '').toLowerCase().includes(query)
        );

        if (!nameMatch && !modelMatch && !oppMatch && !notesMatch && !qualMatch && !contactMatch) {
          return false;
        }
      }

      return true;
    });
  }, [prospects, activeTab, searchTerm]);

  // Selected company object for single modal view
  const selectedCompany = useMemo(() => {
    return prospects.find(p => p.id === selectedCompanyId) || null;
  }, [prospects, selectedCompanyId]);

  const selectedIndexInFiltered = useMemo(() => {
    return filteredProspects.findIndex(p => p.id === selectedCompanyId);
  }, [filteredProspects, selectedCompanyId]);

  const handleNextCompany = () => {
    if (selectedIndexInFiltered < filteredProspects.length - 1) {
      setSelectedCompanyId(filteredProspects[selectedIndexInFiltered + 1].id);
    }
  };

  const handlePrevCompany = () => {
    if (selectedIndexInFiltered > 0) {
      setSelectedCompanyId(filteredProspects[selectedIndexInFiltered - 1].id);
    }
  };

  const getStageBadge = (stage) => {
    const s = (stage || '').trim();
    if (s === 'Done' || s === 'Appointment Booked' || s === 'Completed') {
      return { text: '✅ Done', bg: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' };
    }
    if (s === 'Follow-Up' || s === 'Follow-up' || s === 'Follow-up Due') {
      return { text: '⏳ Follow-Up', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold' };
    }
    if (s === 'In Progress' || s === 'Contacted' || s === 'Email Sent' || s === 'LinkedIn Pending' || s === 'LinkedIn Connected' || s === 'In Discussion') {
      return { text: '⚡ In Progress', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold' };
    }
    return { text: '📋 To Do', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-700'
            : 'bg-indigo-950 text-indigo-200 border-indigo-500 shadow-indigo-500/20'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-base text-white tracking-tight">UK Property Prospects</h1>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    {prospects.length} Total
                  </span>
                </div>
                <p className="text-xs text-slate-400">Residential Property Automation Accounts</p>
              </div>
            </div>

            {/* Setter Switcher on Mobile */}
            <div className="md:hidden flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400">Setter:</span>
              <select
                value={activeSetter}
                onChange={(e) => setActiveSetter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Fil" className="bg-slate-900 text-white">Fil</option>
                <option value="Panu" className="bg-slate-900 text-white">Panu</option>
                <option value="Team" className="bg-slate-900 text-white">Team</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full md:max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, contact name, email, automation angle, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded px-1.5 py-0.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Setter Selector & Export Button */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-medium">Active Setter:</span>
              <select
                value={activeSetter}
                onChange={(e) => setActiveSetter(e.target.value)}
                className="bg-slate-900 text-xs font-bold text-indigo-300 border border-slate-700 px-2 py-0.5 rounded focus:outline-none cursor-pointer"
              >
                <option value="Fil">Fil</option>
                <option value="Panu">Panu</option>
                <option value="Team">Team</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
              title="Download entire dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>

        {/* 4 Navigation Pages / Tabs (To Do, In Progress, Follow-Up, Done, All) - No Priority filter */}
        <div className="border-t border-slate-800/80 bg-slate-900/80 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            
            {/* The 4 Core Workflow Navigation Pages */}
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5 w-full sm:w-auto">
              
              {/* 1. To Do Tab */}
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'todo'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>📋 To Do</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.todo}
                </span>
              </button>

              {/* 2. In Progress Tab */}
              <button
                onClick={() => setActiveTab('in-progress')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'in-progress'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-sky-400 hover:bg-sky-950/40'
                }`}
              >
                <span>⚡ In Progress</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts['in-progress']}
                </span>
              </button>

              {/* 3. Follow-Up Tab */}
              <button
                onClick={() => setActiveTab('followup')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'followup'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                <span>⏳ Follow-Up</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.followup}
                </span>
              </button>

              {/* 4. Done Tab */}
              <button
                onClick={() => setActiveTab('done')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'done'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <span>✅ Done</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 text-[10px] font-bold">
                  {tabCounts.done}
                </span>
              </button>

              {/* All Prospects Option */}
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>📁 All</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.all}
                </span>
              </button>

            </div>

            <div className="text-slate-400 text-xs hidden md:block">
              Showing <strong className="text-white">{filteredProspects.length}</strong> companies in <strong className="text-indigo-300 uppercase">{activeTab}</strong>
            </div>

          </div>
        </div>
      </header>

      {/* Main Company List Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading prospects from database...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Error Loading Prospects</h3>
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={fetchProspects}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-600 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-300 text-base">
              {activeTab === 'todo'
                ? '🎉 All caught up! No companies in the To Do page.'
                : activeTab === 'in-progress'
                ? 'No companies currently In Progress.'
                : activeTab === 'followup'
                ? 'No companies waiting for Follow-Up.'
                : activeTab === 'done'
                ? 'No companies marked as Done yet.'
                : 'No companies match your search.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'todo'
                ? 'Check the "In Progress" or "Follow-Up" tabs to continue outreach, or view "All".'
                : 'Move companies across pages using the action buttons on each card.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium cursor-pointer"
              >
                View All Prospects
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Top Info Banner */}
            {activeTab === 'todo' && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
                <span>
                  🔥 <strong>To Do Queue</strong>: Click <strong>"In Progress"</strong> or <strong>"Done"</strong> on a company to move it to that page and immediately proceed to the next account.
                </span>
                <span className="font-mono text-indigo-300 font-bold">{filteredProspects.length} remaining</span>
              </div>
            )}

            {filteredProspects.map(company => {
              const contacts = company.contacts || [];
              const isNoteExpanded = expandedNotes.has(company.rank);
              const badge = getStageBadge(company.stage);
              const currentTab = getTabForProspect(company);

              return (
                <div 
                  key={company.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/70 hover:border-slate-700 transition-all p-4 sm:p-5 shadow-lg shadow-black/20"
                >
                  {/* Top Row: Rank, Company Name, Badges, Revenue, Staff */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      {/* Rank */}
                      <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                        #{company.rank}
                      </span>

                      {/* Company Name & Link & View Page */}
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h2 
                          onClick={() => setSelectedCompanyId(company.id)}
                          className="text-base font-bold text-white tracking-tight hover:text-indigo-300 cursor-pointer transition-colors"
                          title="Click to open dedicated company view"
                        >
                          {company.name}
                        </h2>

                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-0.5"
                            title={company.website}
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedCompanyId(company.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] flex items-center space-x-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          <span>Detail View</span>
                        </button>
                      </div>
                    </div>

                    {/* Meta Badges */}
                    <div className="flex items-center space-x-2 flex-wrap">
                      {/* Priority */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        company.priority === 'A'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : company.priority === 'B'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        Priority {company.priority}
                      </span>

                      {/* Revenue */}
                      {company.revenue && (
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 text-[11px] font-medium border border-slate-700/60">
                          💰 {company.revenue}
                        </span>
                      )}

                      {/* Employees */}
                      {company.employees && company.employees !== '0' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                          👥 {company.employees} staff
                        </span>
                      )}

                      {/* Stage Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Body Content Grid */}
                  <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                    
                    {/* Left/Middle Column: Business Model & Key Contacts (7 cols) */}
                    <div className="lg:col-span-7 space-y-3">
                      
                      {/* Business Model */}
                      {company.businessModel && (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Business Model
                          </span>
                          <p className="text-slate-300 text-xs">
                            {company.businessModel}
                          </p>
                        </div>
                      )}

                      {/* Key Stakeholders & Contacts */}
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Key Decision Makers ({contacts.length})</span>
                        </span>

                        <div className="space-y-2">
                          {contacts.map(contact => (
                            <div 
                              key={contact.id}
                              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-white text-xs">{contact.name}</span>
                                  {contact.role && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                      {contact.role}
                                    </span>
                                  )}
                                </div>

                                {contact.email && (
                                  <div className="flex items-center space-x-1.5 mt-1 font-mono text-[11px] text-amber-300/90">
                                    <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{contact.email}</span>
                                  </div>
                                )}
                              </div>

                              {/* Contact Action Buttons */}
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {contact.email && (
                                  <>
                                    <button
                                      onClick={() => copyToClipboard(contact.email, contact.id)}
                                      className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] cursor-pointer transition-all"
                                      title="Copy email address"
                                    >
                                      {copiedText === contact.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>

                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                                      title="Send Email"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}

                                {contact.linkedinUrl && (
                                  <a
                                    href={contact.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-[11px] font-semibold transition-all"
                                    title="Open LinkedIn profile"
                                  >
                                    <LinkedinIcon className="w-3 h-3" />
                                    <span>LinkedIn</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Automation Angles, Notes & EASY MOVE ACTIONS (5 cols) */}
                    <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                      
                      {/* Automation Opportunities */}
                      {company.automationOpportunities && (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-emerald-900/30">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Likely Automation Angles</span>
                          </span>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {company.automationOpportunities}
                          </p>
                        </div>
                      )}

                      {/* Notes / Research Context */}
                      {company.notes && (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>Notes & Intelligence</span>
                            </span>
                            {company.notes.length > 120 && (
                              <button
                                onClick={() => toggleNote(company.rank)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                              >
                                {isNoteExpanded ? 'Show Less' : 'Show All'}
                              </button>
                            )}
                          </div>
                          <p className={`text-slate-300 text-xs leading-relaxed whitespace-pre-line ${
                            !isNoteExpanded && company.notes.length > 120 ? 'line-clamp-3' : ''
                          }`}>
                            {company.notes}
                          </p>
                        </div>
                      )}

                      {/* ⚡ MOVE COMPANY ACROSS THE 4 PAGES (To Do, In Progress, Follow-Up, Done) */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                            <ArrowRight className="w-3 h-3 text-indigo-400" />
                            <span>Move to Page:</span>
                          </span>

                          {company.workedBy && (
                            <span className="text-[10px] text-indigo-300 font-mono">
                              By {company.workedBy} {company.lastContactDate ? `(${company.lastContactDate})` : ''}
                            </span>
                          )}
                        </div>

                        {/* Quick 1-Click Move Buttons */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          
                          {/* To Do Button (if not already To Do) */}
                          {currentTab !== 'todo' && (
                            <button
                              onClick={() => handleMoveStage(company.id, 'To Do', activeSetter)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                              title="Move back to To Do queue"
                            >
                              📋 To Do
                            </button>
                          )}

                          {/* In Progress Button */}
                          <button
                            onClick={() => handleMoveStage(company.id, 'In Progress', activeSetter)}
                            className={`flex-1 min-w-[100px] flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentTab === 'in-progress'
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20'
                            }`}
                            title="Move to In Progress"
                          >
                            <span>⚡ In Progress</span>
                          </button>

                          {/* Follow-Up Button */}
                          <button
                            onClick={() => handleMoveStage(company.id, 'Follow-Up', activeSetter)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentTab === 'followup'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title="Move to Follow-Up"
                          >
                            <span>⏳ Follow-Up</span>
                          </button>

                          {/* Done Button */}
                          <button
                            onClick={() => handleMoveStage(company.id, 'Done', activeSetter)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentTab === 'done'
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title="Mark as Done"
                          >
                            <span>✅ Done</span>
                          </button>

                          {/* Direct Dropdown Selector */}
                          <select
                            value={currentTab === 'in-progress' ? 'In Progress' : currentTab === 'followup' ? 'Follow-Up' : currentTab === 'done' ? 'Done' : 'To Do'}
                            onChange={(e) => handleMoveStage(company.id, e.target.value, activeSetter)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg focus:outline-none cursor-pointer shrink-0"
                          >
                            <option value="To Do">📋 Move: To Do</option>
                            <option value="In Progress">⚡ Move: In Progress</option>
                            <option value="Follow-Up">⏳ Move: Follow-Up</option>
                            <option value="Done">✅ Move: Done</option>
                          </select>

                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Dedicated Single-Company Detail View Modal */}
      <CompanyDetailModal
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        company={selectedCompany}
        prospects={filteredProspects}
        onUpdateStatus={handleMoveStage}
        onPrevCompany={selectedIndexInFiltered > 0 ? handlePrevCompany : null}
        onNextCompany={selectedIndexInFiltered < filteredProspects.length - 1 ? handleNextCompany : null}
        activeSetter={activeSetter}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        UK Residential Property Automation Prospect Tracker • Active Setter: {activeSetter}
      </footer>

    </div>
  );
}
