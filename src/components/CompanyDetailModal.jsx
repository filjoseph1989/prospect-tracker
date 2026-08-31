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
  RefreshCw,
  Pencil,
  ChevronUp,
  ChevronDown,
  Globe,
  Bot,
  Trash2
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import ContactTimeline from './ContactTimeline';
import { getPromptForCompany } from '../utils/promptTemplate';
import { getTodayDateStr, addDaysToDate, getCompanyActivityInfo, formatDisplayDate } from '../utils/dateUtils';

export default function CompanyDetailModal({
  isOpen,
  onClose,
  company,
  prospects,
  onUpdateStatus,
  onPrevCompany,
  onNextCompany,
  activeSetter,
  onAddContact,
  onUpdateDeepseek,
  onUpdateWebsite,
  onDeleteContact,
  onEditContact,
  onUpdateContactStatus,
  onReorderContacts
}) {
  if (!isOpen || !company) return null;

  const [copiedEmail, setCopiedEmail] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', role: '', email: '', linkedinUrl: '' });
  const [savingPerson, setSavingPerson] = useState(false);

  // Edit Contact State in Modal
  const [editingModalContactId, setEditingModalContactId] = useState(null);
  const [editModalContactForm, setEditModalContactForm] = useState({ name: '', role: '', email: '', linkedinUrl: '' });
  const [savingModalEditContact, setSavingModalEditContact] = useState(false);

  // DeepSeek Edit State in Modal
  const [isEditingDeepseek, setIsEditingDeepseek] = useState(false);
  const [deepseekInput, setDeepseekInput] = useState(company.deepseekUrl || '');
  const [savingDeepseek, setSavingDeepseek] = useState(false);

  // Website Edit State in Modal
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [websiteInput, setWebsiteInput] = useState(company.website || '');
  const [savingWebsiteModal, setSavingWebsiteModal] = useState(false);

  const allContacts = company.contacts || [];
  const hasRealContacts = allContacts.some(c => !(c.name || '').toLowerCase().includes('to identify'));
  const contacts = hasRealContacts 
    ? allContacts.filter(c => !(c.name || '').toLowerCase().includes('to identify'))
    : allContacts;

  const handleCopyTitleModal = () => {
    if (!company.name) return;
    navigator.clipboard.writeText(company.name);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyPromptModal = async () => {
    try {
      const filledPrompt = getPromptForCompany(company.name);
      await navigator.clipboard.writeText(filledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleModalSaveDeepseek = async (url) => {
    if (onUpdateDeepseek) {
      setSavingDeepseek(true);
      await onUpdateDeepseek(company.id, url);
      setSavingDeepseek(false);
      setIsEditingDeepseek(false);
    }
  };

  const handleModalSaveWebsite = async (url) => {
    if (onUpdateWebsite) {
      setSavingWebsiteModal(true);
      await onUpdateWebsite(company.id, url);
      setSavingWebsiteModal(false);
      setIsEditingWebsite(false);
    }
  };

  const handleSaveModalEditContact = async (contactId) => {
    if (onEditContact) {
      setSavingModalEditContact(true);
      await onEditContact(company.id, contactId, editModalContactForm);
      setSavingModalEditContact(false);
      setEditingModalContactId(null);
      setEditModalContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
    }
  };

  const handleDeleteModalContact = async (contactId, contactName) => {
    if (onDeleteContact) {
      await onDeleteContact(company.id, contactId, contactName);
    }
  };

  const handleEmailStatusChangeModal = (contact, newStatus) => {
    if (!onUpdateContactStatus) return;
    const today = getTodayDateStr();
    let updates = { emailStatus: newStatus };

    if (newStatus === 'Sent') {
      updates.emailLastContactDate = today;
      if (!contact.emailSentDate) updates.emailSentDate = today;
      if (!contact.nextFollowupDate) updates.nextFollowupDate = addDaysToDate(3);
    } else if (newStatus === 'Follow-up 1') {
      updates.emailLastContactDate = today;
      updates.emailFollowup1Date = today;
      updates.nextFollowupDate = addDaysToDate(4);
    } else if (newStatus === 'Follow-up 2') {
      updates.emailLastContactDate = today;
      updates.emailFollowup2Date = today;
      updates.nextFollowupDate = '';
    } else if (newStatus === 'Replied' || newStatus === 'Bounced' || newStatus === 'No Email Found') {
      updates.nextFollowupDate = '';
    }

    onUpdateContactStatus(company.id, contact.id, updates);
  };

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
  const activityInfo = getCompanyActivityInfo(company);

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

                {/* Copy Company Name / Title (Icon only, reveals label on hover) */}
                <button
                  type="button"
                  onClick={handleCopyTitleModal}
                  className={`group relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
                    copiedTitle
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                  title={`Copy company name: "${company.name}"`}
                >
                  {copiedTitle ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                  )}
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                    {copiedTitle ? 'Copied Name!' : 'Copy Name'}
                  </span>
                </button>

                {/* 1. Copy Research Prompt (Icon only, reveals label on hover) */}
                <button
                  type="button"
                  onClick={handleCopyPromptModal}
                  className={`group relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
                    copiedPrompt
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
                  }`}
                  title={`Copy DeepSeek research prompt for ${company.name}`}>
                  {copiedPrompt ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                    {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                  </span>
                </button>

                {/* 2. Website Link / Add / Edit Button (Icon only, reveals label on hover) */}
                {isEditingWebsite ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleModalSaveWebsite(websiteInput);
                    }}
                    className="inline-flex items-center space-x-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-indigo-500/60 shadow-lg z-10"
                  >
                    <input
                      type="text"
                      placeholder="Website (e.g. example.co.uk)"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={savingWebsiteModal}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {savingWebsiteModal ? '...' : 'Save'}
                    </button>
                    {company.website && (
                      <button
                        type="button"
                        onClick={() => handleModalSaveWebsite('')}
                        className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] cursor-pointer"
                        title="Remove website link"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingWebsite(false);
                        setWebsiteInput(company.website || '');
                      }}
                      className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : company.website ? (
                  <div className="inline-flex items-center rounded-lg bg-indigo-950/80 border border-indigo-700/60 shadow-sm overflow-hidden group">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 flex items-center transition-all"
                      title={`Visit Website: ${company.website}`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                        Website
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingWebsite(true);
                        setWebsiteInput(company.website || '');
                      }}
                      className="px-1.5 py-1.5 hover:bg-indigo-900 text-indigo-400/60 hover:text-indigo-200 border-l border-indigo-800/80 cursor-pointer transition-all"
                      title="Edit Website URL"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingWebsite(true);
                      setWebsiteInput('');
                    }}
                    className="group p-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-950/80 text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700 hover:border-indigo-500/50 flex items-center cursor-pointer transition-all shadow-sm"
                    title="Add Company Website"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400/80 group-hover:text-indigo-300 shrink-0" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                      + Website
                    </span>
                  </button>
                )}

                {/* 3. DeepSeek Intelligence Link / Add Button (Icon only, reveals label on hover) */}
                {isEditingDeepseek ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleModalSaveDeepseek(deepseekInput);
                    }}
                    className="inline-flex items-center space-x-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-blue-500/60 shadow-lg z-10">
                    <input
                      type="url"
                      placeholder="Paste DeepSeek link (https://chat.deepseek.com/...)"
                      value={deepseekInput}
                      onChange={(e) => setDeepseekInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        onClick={() => handleModalSaveDeepseek('')}
                        className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] cursor-pointer"
                        title="Remove link"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDeepseek(false);
                        setDeepseekInput(company.deepseekUrl || '');
                      }}
                      className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : company.deepseekUrl ? (
                  <div className="inline-flex items-center rounded-lg bg-blue-950/80 border border-blue-700/60 shadow-sm overflow-hidden group">
                    <a
                      href={company.deepseekUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-blue-900 text-blue-400 hover:text-blue-300 flex items-center transition-all"
                      title="Open DeepSeek Research & Intelligence Chat"
                    >
                      <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                        DeepSeek
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDeepseek(true);
                        setDeepseekInput(company.deepseekUrl || '');
                      }}
                      className="px-1.5 py-1.5 hover:bg-blue-900 text-blue-400/60 hover:text-blue-200 border-l border-blue-800/80 cursor-pointer transition-all"
                      title="Edit DeepSeek URL"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDeepseek(true);
                      setDeepseekInput('');
                    }}
                    className="group p-1.5 rounded-lg bg-slate-800/60 hover:bg-blue-950/80 text-slate-400 hover:text-blue-300 border border-dashed border-slate-700 hover:border-blue-500/50 flex items-center cursor-pointer transition-all shadow-sm"
                    title="Add DeepSeek Research Link"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-400/80 group-hover:text-blue-300 shrink-0" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                      + DeepSeek
                    </span>
                  </button>
                )}

                {/* Stage Badge */}
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.text}
                </span>

                {/* Last Checked / Activity Badge */}
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                    activityInfo.isToday
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                      : activityInfo.hasActivity
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700/80'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                  }`}
                  title={activityInfo.tooltip}
                >
                  {activityInfo.isToday ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span>{activityInfo.badgeText}</span>
                </span>
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
                {company.deepseekUrl ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDeepseek(true);
                      setDeepseekInput('');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1 font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add DeepSeek Link</span>
                  </button>
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
              {contacts.map((contact, contactIdx) => (
                editingModalContactId === contact.id ? (
                  <form
                    key={contact.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveModalEditContact(contact.id);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-indigo-500/50 shadow-lg space-y-2"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1">
                        <Pencil className="w-3 h-3 text-indigo-400" />
                        <span>Edit Decision Maker</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModalContactId(null);
                          setEditModalContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
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
                          value={editModalContactForm.name}
                          onChange={(e) => setEditModalContactForm({ ...editModalContactForm, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Role / Job Title</label>
                        <input
                          type="text"
                          value={editModalContactForm.role}
                          onChange={(e) => setEditModalContactForm({ ...editModalContactForm, role: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
                        <input
                          type="email"
                          value={editModalContactForm.email}
                          onChange={(e) => setEditModalContactForm({ ...editModalContactForm, email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-0.5">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          value={editModalContactForm.linkedinUrl}
                          onChange={(e) => setEditModalContactForm({ ...editModalContactForm, linkedinUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModalContactId(null);
                          setEditModalContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingModalEditContact}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingModalEditContact ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                <div 
                  key={contact.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col gap-2.5 group/contact"
                >
                  {/* Top Row: Name, Role, Email & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-sm text-white">{contact.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {contact.role || 'Key Decision Maker'}
                        </span>
                      </div>

                      {contact.email && (
                        <div className="flex items-center space-x-2 mt-1 text-xs text-amber-300 font-mono">
                          <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="p-1.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                          title="Open Mail Client"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
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

                      {contact.email && (
                        <button
                          onClick={() => copyToClipboard(contact.email, contact.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer"
                          title="Copy email address"
                        >
                          {copiedEmail === contact.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEmail === contact.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}

                      {/* Edit Contact Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModalContactId(contact.id);
                          setEditModalContactForm({
                            name: contact.name || '',
                            role: contact.role || '',
                            email: contact.email || '',
                            linkedinUrl: contact.linkedinUrl || ''
                          });
                        }}
                        className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 border border-slate-700 cursor-pointer transition-all"
                        title="Edit contact details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Contact Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteModalContact(contact.id, contact.name)}
                        className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 cursor-pointer transition-all"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Rightmost: Reorder Up / Down Controls */}
                      {contacts.length > 1 && onReorderContacts && (
                        <div className="flex items-center rounded bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
                          <button
                            type="button"
                            disabled={contactIdx === 0}
                            onClick={() => onReorderContacts(company.id, contactIdx, 'up')}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-all"
                            title="Move contact up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={contactIdx === contacts.length - 1}
                            onClick={() => onReorderContacts(company.id, contactIdx, 'down')}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 border-l border-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all"
                            title="Move contact down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Outreach Status Selectors in Modal */}
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2 pt-2 border-t border-slate-900">
                    {/* Email Status */}
                    <div className="inline-flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Email:</span>
                      <select
                        value={contact.emailStatus || 'Not Sent'}
                        onChange={(e) => handleEmailStatusChangeModal(contact, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none transition-all ${
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
                            : contact.emailStatus === 'No Email Found'
                            ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700/60'
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
                        <option value="No Email Found">🔍 No Email Found</option>
                      </select>
                    </div>

                    {/* LinkedIn Status */}
                    <div className="inline-flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">LinkedIn:</span>
                      <select
                        value={contact.linkedinStatus || 'Not Started'}
                        onChange={(e) => onUpdateContactStatus && onUpdateContactStatus(company.id, contact.id, { linkedinStatus: e.target.value })}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none transition-all ${
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

                  {/* Dates & Follow-up Timeline in Modal */}
                  {onUpdateContactStatus && (
                    <ContactTimeline
                      contact={contact}
                      companyId={company.id}
                      onUpdateStatus={onUpdateContactStatus}
                    />
                  )}
                  </div>
                )
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
