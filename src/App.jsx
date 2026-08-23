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
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import LinkedinIcon from './components/LinkedinIcon';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [copiedText, setCopiedText] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

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
  };

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // 1. Search term filter
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

      // 2. Priority filter
      if (priorityFilter !== 'ALL') {
        if (p.priority !== priorityFilter) return false;
      }

      return true;
    });
  }, [prospects, searchTerm, priorityFilter]);

  // Priority count stats
  const priorityCounts = useMemo(() => {
    const counts = { ALL: prospects.length, A: 0, B: 0, C: 0 };
    prospects.forEach(p => {
      if (p.priority === 'A') counts.A++;
      else if (p.priority === 'B') counts.B++;
      else if (p.priority === 'C') counts.C++;
    });
    return counts;
  }, [prospects]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
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

            <button
              onClick={handleExportCSV}
              className="md:hidden flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Export Button */}
          <div className="hidden md:flex items-center space-x-2">
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

        {/* Priority Filter Bar */}
        <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
              <span className="text-slate-400 font-semibold mr-1 uppercase text-[11px] tracking-wider">Priority:</span>
              
              <button
                onClick={() => setPriorityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  priorityFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                All ({priorityCounts.ALL})
              </button>

              <button
                onClick={() => setPriorityFilter('A')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  priorityFilter === 'A'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/30'
                }`}
              >
                Priority A ({priorityCounts.A})
              </button>

              <button
                onClick={() => setPriorityFilter('B')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  priorityFilter === 'B'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-amber-400 hover:bg-amber-950/30'
                }`}
              >
                Priority B ({priorityCounts.B})
              </button>

              <button
                onClick={() => setPriorityFilter('C')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  priorityFilter === 'C'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Priority C ({priorityCounts.C})
              </button>
            </div>

            <div className="text-slate-400 text-xs hidden sm:block">
              Showing <strong className="text-white">{filteredProspects.length}</strong> of {prospects.length} companies
            </div>
          </div>
        </div>
      </header>

      {/* Main Company List Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading prospects from CSV...</p>
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
          <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-300 text-sm">No companies match your search</h3>
            <p className="text-xs text-slate-500">Try changing your search query or priority filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProspects.map(company => {
              const contacts = company.contacts || [];
              const isNoteExpanded = expandedNotes.has(company.rank);

              return (
                <div 
                  key={company.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/70 hover:border-slate-700 transition-all p-4 sm:p-5 shadow-lg shadow-black/20"
                >
                  {/* Top Row: Rank, Company Name, Priority, Revenue, Staff */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      {/* Rank */}
                      <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                        #{company.rank}
                      </span>

                      {/* Company Name & Link */}
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h2 className="text-base font-bold text-white tracking-tight">
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

                    {/* Right Column: Automation Angles & Research Notes (5 cols) */}
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

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        UK Residential Property Automation Prospect Tracker • 100 Verified Accounts
      </footer>

    </div>
  );
}
