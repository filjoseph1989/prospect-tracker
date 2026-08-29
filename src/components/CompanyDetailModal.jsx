import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  Users, 
  Sparkles, 
  CalendarCheck2, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Plus,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';

export default function CompanyDetailModal({
  isOpen,
  onClose,
  company,
  prospects,
  onUpdateStatus,
  onPrevCompany,
  onNextCompany,
  activeSetter,
  onAddContact
}) {
  if (!isOpen || !company) return null;

  const [copiedEmail, setCopiedEmail] = useState(null);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', role: '', email: '', linkedinUrl: '' });
  const [savingPerson, setSavingPerson] = useState(false);

  const allContacts = company.contacts || [];
  const hasRealContacts = allContacts.some(c => !(c.name || '').toLowerCase().includes('to identify'));
  const contacts = hasRealContacts 
    ? allContacts.filter(c => !(c.name || '').toLowerCase().includes('to identify'))
    : allContacts;

  const handleModalAddPerson = async (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) return;
    if (onAddContact) {
      setSavingPerson(true);
      await onAddContact(company.id, personForm);
      setSavingPerson(false);
      setIsAddingPerson(false);
      setPersonForm({ name: '', role: '', email: '', linkedinUrl: '' });
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 2000);
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

  const badge = getStageBadge(company.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm text-indigo-300">
              #{company.rank}
            </span>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">{company.name}</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.text}
                </span>
                {company.deepseekUrl && (
                  <a
                    href={company.deepseekUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-400 hover:text-blue-300 border border-blue-700/60 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                    title="Open DeepSeek Research & Intelligence Chat"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>DeepSeek Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400">Dedicated Company Profile & Outreach Actions</p>
            </div>
          </div>

          {/* Nav & Close */}
          <div className="flex items-center space-x-2">
            {onPrevCompany && (
              <button
                onClick={onPrevCompany}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Previous company"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {onNextCompany && (
              <button
                onClick={onNextCompany}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Next company"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Quick Markings Action Bar: To Do, In Review, Qualified, Disqualified */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Move to Status:
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-medium">
                  Setter: <strong className="text-indigo-400">{company.workedBy || activeSetter || 'Fil'}</strong>
                </span>
                {company.lastContactDate && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">Contacted: {company.lastContactDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Clean Dropdown Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Stage:</span>
              <select
                value={company.stage === 'Qualified' || company.stage === 'Done' || company.stage === 'Appointment Booked' || company.stage === 'Completed' ? 'Qualified' : (company.stage === 'Disqualified' || company.stage === 'Not a Fit' || company.stage === 'Bounced' || company.stage === 'Rejected' || company.stage === 'Lost' ? 'Disqualified' : (company.stage === 'In Review' || company.stage === 'In Progress' || company.stage === 'Follow-Up' || company.stage === 'Email Sent' || company.stage === 'LinkedIn Pending' || company.stage === 'LinkedIn Connected' || company.stage === 'In Discussion' ? 'In Review' : 'To Do'))}
                onChange={(e) => onUpdateStatus(company.id, e.target.value, activeSetter)}
                className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="To Do">📋 To Do</option>
                <option value="In Review">⚡ In Review</option>
                <option value="Qualified">🎯 Qualified</option>
                <option value="Disqualified">🚫 Disqualified</option>
              </select>
            </div>
          </div>

          {/* Company Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Priority</span>
              <span className="text-sm font-bold text-white mt-1 block">Priority {company.priority}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Revenue</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">{company.revenue || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Employees / Staff</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">{company.employees || 'N/A'} staff</span>
            </div>
          </div>

          {/* Business Model & Website */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Business Model</span>
              <div className="flex items-center space-x-3">
                {company.deepseekUrl && (
                  <a
                    href={company.deepseekUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1 font-semibold"
                    title="Open DeepSeek Research & Intelligence"
                  >
                    <span>DeepSeek Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1"
                  >
                    <span>Visit Company Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <p className="text-slate-200 text-xs font-medium">
              {company.businessModel || 'Residential property management'}
            </p>
          </div>

          {/* Key Decision Makers */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Key Decision Makers ({contacts.length})</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsAddingPerson(!isAddingPerson);
                  setPersonForm({ name: '', role: '', email: '', linkedinUrl: '' });
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Add a key decision maker"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Person</span>
              </button>
            </div>

            {/* Inline Add Person Form in Modal */}
            {isAddingPerson && (
              <form
                onSubmit={handleModalAddPerson}
                className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40 shadow-lg space-y-2.5"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add Key Decision Maker</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPerson(false);
                      setPersonForm({ name: '', role: '', email: '', linkedinUrl: '' });
                    }}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={personForm.name}
                      onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Role / Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director / CEO"
                      value={personForm.role}
                      onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. sarah@company.com"
                      value={personForm.email}
                      onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://linkedin.com/in/..."
                      value={personForm.linkedinUrl}
                      onChange={(e) => setPersonForm({ ...personForm, linkedinUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPerson(false);
                      setPersonForm({ name: '', role: '', email: '', linkedinUrl: '' });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPerson}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingPerson ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Person</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {contacts.map(contact => (
                <div 
                  key={contact.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{contact.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {contact.role || 'Key Decision Maker'}
                      </span>
                    </div>

                    {contact.email && (
                      <div className="flex items-center space-x-2 mt-1 text-xs text-amber-300 font-mono">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {contact.email && (
                      <>
                        <button
                          onClick={() => copyToClipboard(contact.email, contact.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer"
                        >
                          {copiedEmail === contact.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEmail === contact.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`mailto:${contact.email}`}
                          className="p-1.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                          title="Open Mail Client"
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
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-semibold"
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

          {/* Automation Angles & Intelligence */}
          {(company.automationOpportunities || company.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {company.automationOpportunities && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/30">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Likely Automation Angles</span>
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {company.automationOpportunities}
                  </p>
                </div>
              )}

              {company.notes && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-900/30">
                  <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Notes & Intelligence</span>
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                    {company.notes}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Company #{company.rank} of {prospects.length}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              Close Profile
            </button>
            {onNextCompany && (
              <button
                onClick={onNextCompany}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center space-x-1 shadow-md cursor-pointer"
              >
                <span>Next Company</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
