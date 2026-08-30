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
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  ArrowRight, 
  Plus, 
  UserPlus, 
  X, 
  Pencil,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import LinkedinIcon from './components/LinkedinIcon';
import CompanyDetailModal from './components/CompanyDetailModal';
import { getPromptForCompany } from './utils/promptTemplate';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // 4 Core Workflow Navigation Pages:
  // 'todo' | 'in-review' | 'qualified' | 'disqualified' | 'all'
  const [activeTab, setActiveTab] = useState('todo');

  // Search & State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSetter, setActiveSetter] = useState('Fil');
  const [copiedText, setCopiedText] = useState(null);

  // Add Contact State
  const [addingContactCompanyId, setAddingContactCompanyId] = useState(null);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    role: '',
    email: '',
    linkedinUrl: ''
  });
  const [savingContact, setSavingContact] = useState(false);

  // DeepSeek URL Edit State
  const [editingDeepseekCompanyId, setEditingDeepseekCompanyId] = useState(null);
  const [deepseekInputUrl, setDeepseekInputUrl] = useState('');
  const [savingDeepseek, setSavingDeepseek] = useState(false);

  // Copy Prompt State
  const [copiedPromptId, setCopiedPromptId] = useState(null);

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

      if (newStage === 'Qualified') {
        showToast(`🎯 Moved ${name} to Qualified!`);
      } else if (newStage === 'Disqualified') {
        showToast(`🚫 Moved ${name} to Disqualified`);
      } else if (newStage === 'In Review' || newStage === 'In Progress') {
        showToast(`⚡ Moved ${name} to In Review (by ${setter})`);
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

  // Add key person / decision maker to company
  const handleAddContact = async (companyId, customData = null) => {
    const dataToSend = customData || newContactForm;
    if (!dataToSend.name || !dataToSend.name.trim()) {
      showToast('Please enter a contact name', 'error');
      return null;
    }

    try {
      setSavingContact(true);
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dataToSend.name.trim(),
          role: dataToSend.role?.trim() || 'Key Decision Maker',
          email: dataToSend.email?.trim() || '',
          linkedinUrl: dataToSend.linkedinUrl?.trim() || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to add contact');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      showToast(`👤 Added ${dataToSend.name.trim()} to ${updatedCompany.name}!`);
      setAddingContactCompanyId(null);
      setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to add contact', 'error');
      return null;
    } finally {
      setSavingContact(false);
    }
  };

  // Update Contact Status (Email, LinkedIn, Appointment, etc.)
  const handleUpdateContactStatus = async (companyId, contactId, updates) => {
    try {
      // Optimistic update
      setProspects(prev => prev.map(p => {
        if (p.id !== companyId) return p;
        const updatedContacts = (p.contacts || []).map(c => {
          if (c.id !== contactId) return c;
          return { ...c, ...updates };
        });
        return { ...p, contacts: updatedContacts };
      }));

      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update contact status');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));

      if (updates.emailStatus) {
        showToast(`✉️ Email status updated: ${updates.emailStatus}`);
      } else if (updates.linkedinStatus) {
        showToast(`🤝 LinkedIn status updated: ${updates.linkedinStatus}`);
      }
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to update contact status', 'error');
      fetchProspects();
      return null;
    }
  };

  // Reorder contact up or down
  const handleMoveContactOrder = async (companyId, contactIndex, direction) => {
    const targetCompany = prospects.find(p => p.id === companyId);
    if (!targetCompany || !targetCompany.contacts) return;
    const currentContacts = [...targetCompany.contacts];
    const targetIndex = direction === 'up' ? contactIndex - 1 : contactIndex + 1;

    if (targetIndex < 0 || targetIndex >= currentContacts.length) return;

    // Swap
    const temp = currentContacts[contactIndex];
    currentContacts[contactIndex] = currentContacts[targetIndex];
    currentContacts[targetIndex] = temp;

    const orderedIds = currentContacts.map(c => c.id);

    // Optimistic state update
    setProspects(prev => prev.map(p => {
      if (p.id !== companyId) return p;
      return { ...p, contacts: currentContacts };
    }));

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedContactIds: orderedIds })
      });
      if (!res.ok) throw new Error('Failed to save contact order');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      showToast('↕️ Reordered decision makers');
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to reorder contacts', 'error');
      fetchProspects(); // Rollback
      return null;
    }
  };

  // Update / Add / Clear DeepSeek Research Link
  const handleSaveDeepseekUrl = async (companyId, url) => {
    const cleanUrl = (url || '').trim();
    try {
      setSavingDeepseek(true);
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deepseekUrl: cleanUrl })
      });
      if (!res.ok) throw new Error('Failed to update DeepSeek link');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      showToast(cleanUrl ? '⚡ DeepSeek research link saved!' : 'DeepSeek link removed');
      setEditingDeepseekCompanyId(null);
      setDeepseekInputUrl('');
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to save DeepSeek link', 'error');
      return null;
    } finally {
      setSavingDeepseek(false);
    }
  };

  // Copy Prompt Template with auto-injected Company Name
  const handleCopyPrompt = async (companyName, companyId) => {
    try {
      const filledPrompt = getPromptForCompany(companyName);
      await navigator.clipboard.writeText(filledPrompt);
      setCopiedPromptId(companyId);
      showToast(`✨ Research prompt for "${companyName}" copied to clipboard!`);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
    showToast('Downloading CSV...');
  };

  // Helper to categorize company into 1 of the 4 tabs:
  // 'todo' | 'in-review' | 'qualified' | 'disqualified'
  const getTabForProspect = (p) => {
    const stage = (p.stage || '').trim();
    if (stage === 'Qualified' || stage === 'Done' || stage === 'Appointment Booked' || stage === 'Completed') {
      return 'qualified';
    }
    if (stage === 'Disqualified' || stage === 'Not a Fit' || stage === 'Bounced' || stage === 'Rejected' || stage === 'Lost') {
      return 'disqualified';
    }
    if (stage === 'In Review' || stage === 'In Progress' || stage === 'Follow-Up' || stage === 'Follow-up' || stage === 'Follow-up Due' || stage === 'Follow-up 1' || stage === 'Follow-up 2' || stage === 'Contacted' || stage === 'Email Sent' || stage === 'LinkedIn Pending' || stage === 'LinkedIn Connected' || stage === 'In Discussion') {
      return 'in-review';
    }
    return 'todo';
  };

  // Counts for each of the 4 tabs + all
  const tabCounts = useMemo(() => {
    const counts = { 'todo': 0, 'in-review': 0, 'qualified': 0, 'disqualified': 0, 'all': prospects.length };
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
    if (s === 'Qualified' || s === 'Done' || s === 'Appointment Booked' || s === 'Completed') {
      return { text: '🎯 Qualified', bg: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' };
    }
    if (s === 'Disqualified' || s === 'Not a Fit' || s === 'Bounced' || s === 'Rejected' || s === 'Lost') {
      return { text: '🚫 Disqualified', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold' };
    }
    if (s === 'In Review' || s === 'In Progress' || s === 'Follow-Up' || s === 'Follow-up' || s === 'Follow-up Due' || s === 'Contacted' || s === 'Email Sent' || s === 'LinkedIn Pending' || s === 'LinkedIn Connected' || s === 'In Discussion') {
      return { text: '⚡ In Review', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold' };
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

        {/* 3 Navigation Pages / Tabs (To Do, In Review, Done, All) */}
        <div className="border-t border-slate-800/80 bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
            
            {/* The 3 Core Workflow Navigation Pages */}
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

              {/* 2. In Review Tab */}
              <button
                onClick={() => setActiveTab('in-review')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'in-review'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-sky-400 hover:bg-sky-950/40'
                }`}
              >
                <span>⚡ In Review</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts['in-review']}
                </span>
              </button>

              {/* 3. Qualified Tab */}
              <button
                onClick={() => setActiveTab('qualified')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'qualified'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <span>🎯 Qualified</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 text-[10px] font-bold">
                  {tabCounts.qualified}
                </span>
              </button>

              {/* 4. Disqualified Tab */}
              <button
                onClick={() => setActiveTab('disqualified')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'disqualified'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <span>🚫 Disqualified</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.disqualified}
                </span>
              </button>

              {/* All Prospects Option */}
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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
                : activeTab === 'in-review'
                ? 'No companies currently In Review.'
                : activeTab === 'qualified'
                ? 'No companies marked as Qualified yet.'
                : activeTab === 'disqualified'
                ? 'No companies marked as Disqualified.'
                : 'No companies match your search.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'todo'
                ? 'Check the "In Review" tab to continue outreach, or view "All".'
                : 'Move companies across pages using the dropdown on each card.'}
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
                  🔥 <strong>To Do Queue</strong>: Select <strong>"In Review"</strong>, <strong>"Qualified"</strong>, or <strong>"Disqualified"</strong> in the dropdown to move a company and immediately proceed to the next account.
                </span>
                <span className="font-mono text-indigo-300 font-bold">{filteredProspects.length} remaining</span>
              </div>
            )}

            {filteredProspects.map(company => {
              const allContacts = company.contacts || [];
              const hasRealContacts = allContacts.some(c => !(c.name || '').toLowerCase().includes('to identify'));
              const contacts = hasRealContacts 
                ? allContacts.filter(c => !(c.name || '').toLowerCase().includes('to identify'))
                : allContacts;
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

                        {/* Copy Research Prompt Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(company.name, company.id);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all border shadow-sm ${
                            copiedPromptId === company.id
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
                          }`}
                          title={`Copy DeepSeek research prompt for ${company.name} (auto-filled from template.xml)`}
                        >
                          {copiedPromptId === company.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-300">Prompt Copied!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>

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

                        {/* DeepSeek Intelligence Link or Add/Edit Button */}
                        {editingDeepseekCompanyId === company.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveDeepseekUrl(company.id, deepseekInputUrl);
                            }}
                            className="inline-flex items-center space-x-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-blue-500/60 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="url"
                              placeholder="Paste DeepSeek URL (https://chat.deepseek.com/...)"
                              value={deepseekInputUrl}
                              onChange={(e) => setDeepseekInputUrl(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-44 sm:w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={savingDeepseek}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {savingDeepseek ? '...' : 'Save'}
                            </button>
                            {company.deepseekUrl && (
                              <button
                                type="button"
                                onClick={() => handleSaveDeepseekUrl(company.id, '')}
                                className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] cursor-pointer"
                                title="Remove DeepSeek link"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeepseekCompanyId(null);
                                setDeepseekInputUrl('');
                              }}
                              className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </form>
                        ) : company.deepseekUrl ? (
                          <div className="inline-flex items-center rounded-md bg-blue-950/80 border border-blue-700/60 shadow-sm overflow-hidden group">
                            <a
                              href={company.deepseekUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 hover:bg-blue-900 text-blue-400 hover:text-blue-300 text-[10px] font-semibold flex items-center space-x-1 transition-all"
                              title="Open DeepSeek Research & Intelligence Chat"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              <span>DeepSeek</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeepseekCompanyId(company.id);
                                setDeepseekInputUrl(company.deepseekUrl);
                              }}
                              className="px-1.5 py-0.5 hover:bg-blue-900 text-blue-400/60 hover:text-blue-200 border-l border-blue-800/80 text-[10px] cursor-pointer transition-all"
                              title="Edit DeepSeek URL"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeepseekCompanyId(company.id);
                              setDeepseekInputUrl('');
                            }}
                            className="px-2 py-0.5 rounded bg-blue-950/30 hover:bg-blue-950/80 text-blue-400/80 hover:text-blue-300 border border-dashed border-blue-700/50 hover:border-blue-500 text-[10px] font-medium flex items-center space-x-1 cursor-pointer transition-all"
                            title="Add DeepSeek Research Link"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>DeepSeek</span>
                          </button>
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

                  {/* Body Content */}
                  <div className="mt-3.5 space-y-3.5 text-xs">
                    
                    {/* Business Model */}
                    {company.businessModel && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Business Model
                        </span>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {company.businessModel}
                        </p>
                      </div>
                    )}

                    {/* 2-Column Section (60% / 40%): Key Decision Makers & Move to Page */}
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
                      
                      {/* Left Column (60%): Key Stakeholders & Decision Makers */}
                      <div className="lg:col-span-6 space-y-1.5 flex flex-col justify-start">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Key Decision Makers ({contacts.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (addingContactCompanyId === company.id) {
                                setAddingContactCompanyId(null);
                              } else {
                                setAddingContactCompanyId(company.id);
                                setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                              }
                            }}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-[10px] font-semibold cursor-pointer transition-all"
                            title="Add a key decision maker / contact"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Person</span>
                          </button>
                        </div>

                        {/* Inline Add Person Form */}
                        {addingContactCompanyId === company.id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAddContact(company.id);
                            }}
                            className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/40 shadow-lg space-y-2 mb-2"
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                              <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
                                <UserPlus className="w-3 h-3 text-indigo-400" />
                                <span>Add Decision Maker</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingContactCompanyId(null);
                                  setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                }}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Name *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. John Doe"
                                  value={newContactForm.name}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Role / Job Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Managing Director / CEO"
                                  value={newContactForm.role}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, role: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
                                <input
                                  type="email"
                                  placeholder="e.g. john@company.com"
                                  value={newContactForm.email}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">LinkedIn Profile URL</label>
                                <input
                                  type="url"
                                  placeholder="e.g. https://linkedin.com/in/..."
                                  value={newContactForm.linkedinUrl}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, linkedinUrl: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingContactCompanyId(null);
                                  setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                }}
                                className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingContact}
                                className="px-3 py-1 rounded text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                {savingContact ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Save Person</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {contacts.map((contact, contactIdx) => (
                            <div 
                              key={contact.id}
                              className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col gap-2"
                            >
                              {/* Top row: Name, Role, and Action Buttons */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span className="font-semibold text-white text-xs">{contact.name}</span>
                                    {contact.role && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {contact.role}
                                      </span>
                                    )}
                                  </div>

                                  {contact.email && (
                                    <div className="flex items-center space-x-1.5 mt-1 font-mono text-[11px] text-amber-300/90 truncate">
                                      <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="truncate">{contact.email}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Contact Action Buttons (Mail, LinkedIn, Copy, Reorder) */}
                                <div className="flex items-center space-x-1.5 shrink-0 self-start sm:self-center">
                                  {contact.email && (
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                                      title="Send Email"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
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

                                  {contact.email && (
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
                                  )}

                                  {/* Rightmost: Reorder Up / Down Controls */}
                                  {contacts.length > 1 && (
                                    <div className="flex items-center rounded bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
                                      <button
                                        type="button"
                                        disabled={contactIdx === 0}
                                        onClick={() => handleMoveContactOrder(company.id, contactIdx, 'up')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-all"
                                        title="Move contact up"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={contactIdx === contacts.length - 1}
                                        onClick={() => handleMoveContactOrder(company.id, contactIdx, 'down')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 border-l border-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all"
                                        title="Move contact down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bottom row: Outreach Indicators & Interactive Selectors */}
                              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5 pt-1.5 border-t border-slate-900">
                                {/* Email Outreach Status Selector */}
                                <div className="inline-flex items-center space-x-1">
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Email:</span>
                                  <select
                                    value={contact.emailStatus || 'Not Sent'}
                                    onChange={(e) => handleUpdateContactStatus(company.id, contact.id, { emailStatus: e.target.value })}
                                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none transition-all ${
                                      contact.emailStatus === 'Sent'
                                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                                        : contact.emailStatus === 'Follow-up 1'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        : contact.emailStatus === 'Follow-up 2'
                                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                                        : contact.emailStatus === 'Replied'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                                        : contact.emailStatus === 'Bounced'
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                    title="Update Email Outreach Status"
                                  >
                                    <option value="Not Sent">✉️ Not Sent</option>
                                    <option value="Sent">✉️ Sent</option>
                                    <option value="Follow-up 1">🔄 Follow-up 1</option>
                                    <option value="Follow-up 2">🔁 Follow-up 2</option>
                                    <option value="Replied">💬 Replied</option>
                                    <option value="Bounced">⚠️ Bounced</option>
                                  </select>
                                </div>

                                {/* LinkedIn Outreach Status Selector */}
                                <div className="inline-flex items-center space-x-1">
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">LinkedIn:</span>
                                  <select
                                    value={contact.linkedinStatus || 'Not Started'}
                                    onChange={(e) => handleUpdateContactStatus(company.id, contact.id, { linkedinStatus: e.target.value })}
                                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none transition-all ${
                                      contact.linkedinStatus === 'Connected'
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                        : contact.linkedinStatus === 'Pending'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        : contact.linkedinStatus === 'Replied'
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                    title="Update LinkedIn Connection Status"
                                  >
                                    <option value="Not Started">⚪ Not Started</option>
                                    <option value="Pending">⏳ Invite Sent (Pending)</option>
                                    <option value="Connected">🤝 Connected</option>
                                    <option value="Replied">💬 Replied</option>
                                  </select>
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column (40%): Move Company Dropdown Selector */}
                      <div className="lg:col-span-4 space-y-1.5 flex flex-col justify-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center space-x-1">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Move to Page:</span>
                        </span>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            {company.workedBy ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                (By <strong className="text-indigo-300">{company.workedBy}</strong>{company.lastContactDate ? ` • ${company.lastContactDate}` : ''})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">
                                Setter: <strong className="text-slate-400">{activeSetter}</strong>
                              </span>
                            )}
                          </div>

                          {/* Clean Dropdown */}
                          <select
                            value={currentTab === 'in-review' ? 'In Review' : currentTab === 'qualified' ? 'Qualified' : currentTab === 'disqualified' ? 'Disqualified' : 'To Do'}
                            onChange={(e) => handleMoveStage(company.id, e.target.value, activeSetter)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm shrink-0"
                          >
                            <option value="To Do">📋 To Do</option>
                            <option value="In Review">⚡ In Review</option>
                            <option value="Qualified">🎯 Qualified</option>
                            <option value="Disqualified">🚫 Disqualified</option>
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
        onAddContact={handleAddContact}
        onUpdateContactStatus={handleUpdateContactStatus}
        onReorderContacts={handleMoveContactOrder}
        onUpdateDeepseek={handleSaveDeepseekUrl}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        UK Residential Property Automation Prospect Tracker • Active Setter: {activeSetter}
      </footer>

    </div>
  );
}
