import React, { useState, useEffect } from 'react';
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
  ArrowRight
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
  activeSetter
}) {
  if (!isOpen || !company) return null;

  const [copiedEmail, setCopiedEmail] = useState(null);
  const contacts = company.contacts || [];

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 2000);
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
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{company.name}</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.text}
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
          
          {/* Quick Markings Action Bar: To Do, In Progress, Follow-Up, Done */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Move to Page / Status:
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

            {/* Marking / Moving Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              
              <button
                onClick={() => onUpdateStatus(company.id, 'To Do', activeSetter)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                <span>📋 To Do</span>
              </button>

              <button
                onClick={() => onUpdateStatus(company.id, 'In Progress', activeSetter)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>⚡ In Progress</span>
              </button>

              <button
                onClick={() => onUpdateStatus(company.id, 'Follow-Up', activeSetter)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>⏳ Follow-Up</span>
              </button>

              <button
                onClick={() => onUpdateStatus(company.id, 'Done', activeSetter)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>✅ Done</span>
              </button>

              <select
                value={company.stage === 'In Progress' ? 'In Progress' : company.stage === 'Follow-Up' ? 'Follow-Up' : company.stage === 'Done' ? 'Done' : 'To Do'}
                onChange={(e) => onUpdateStatus(company.id, e.target.value, activeSetter)}
                className="bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
              >
                <option value="To Do">📋 Move: To Do</option>
                <option value="In Progress">⚡ Move: In Progress</option>
                <option value="Follow-Up">⏳ Move: Follow-Up</option>
                <option value="Done">✅ Move: Done</option>
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
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Business Model</span>
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
            <p className="text-slate-200 text-xs font-medium">
              {company.businessModel || 'Residential property management'}
            </p>
          </div>

          {/* Key Decision Makers */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Key Decision Makers ({contacts.length})</span>
            </span>

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
                    <span>Notes & Research Intelligence</span>
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
