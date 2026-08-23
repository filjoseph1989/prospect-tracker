import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  ExternalLink, 
  Mail, 
  Copy, 
  Check, 
  Sparkles, 
  CalendarCheck2,
  Users
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import ContactCard from './ContactCard';

export default function OutreachQueueModal({
  isOpen,
  onClose,
  prospects,
  initialIndex = 0,
  onUpdateCompany,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenTemplatesWithTarget
}) {
  if (!isOpen || !prospects || prospects.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentIndex < prospects.length - 1) {
        setCurrentIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, prospects.length, onClose]);

  const company = prospects[currentIndex];
  if (!company) return null;

  const contacts = company.contacts || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header with Progress & Navigation */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Speed Outreach Flow</h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {currentIndex + 1} of {prospects.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Use <kbd className="bg-slate-800 px-1 py-0.2 rounded text-[10px]">←</kbd> and <kbd className="bg-slate-800 px-1 py-0.2 rounded text-[10px]">→</kbd> arrow keys to navigate</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-all cursor-pointer"
              title="Previous Prospect"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              disabled={currentIndex === prospects.length - 1}
              onClick={() => setCurrentIndex(i => Math.min(prospects.length - 1, i + 1))}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-all cursor-pointer flex items-center space-x-1"
              title="Next Prospect"
            >
              <span className="text-xs font-semibold px-1">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Company Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-lg">
                #{company.rank}
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-white">{company.name}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    company.priority === 'A' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    Priority {company.priority}
                  </span>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                  {company.revenue && <span>💰 <strong>{company.revenue}</strong></span>}
                  {company.employees && <span>👥 <strong>{company.employees}</strong> employees</span>}
                  {company.businessModel && <span>🏢 {company.businessModel}</span>}
                </div>
              </div>
            </div>

            {/* Quick Pitch Generator button */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onOpenTemplatesWithTarget(company)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Custom Pitch Script</span>
              </button>
            </div>
          </div>

          {/* Intelligence Angles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {company.automationOpportunities && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/30 text-xs">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                  ⚡ Likely Automation Hooks:
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {company.automationOpportunities}
                </p>
              </div>
            )}

            {company.notes && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/30 text-xs">
                <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] block mb-1">
                  🧠 Account Intelligence & Decision Maker Notes:
                </span>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {company.notes}
                </p>
              </div>
            )}
          </div>

          {/* Key Contacts Outreach Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Key Stakeholders to Connect & Message ({contacts.length})</span>
              </h3>

              <button
                onClick={() => {
                  const name = prompt(`Enter contact name for ${company.name}:`);
                  if (name && name.trim()) {
                    onAddContact(company.id, { name: name.trim(), role: 'Key Decision Maker' });
                  }
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                + Add Decision Maker
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  companyId={company.id}
                  onUpdateContact={onUpdateContact}
                  onDeleteContact={onDeleteContact}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Account</span>
          </button>

          <div className="text-xs text-slate-400">
            Account #{company.rank}: <strong className="text-white">{company.name}</strong>
          </div>

          <button
            disabled={currentIndex === prospects.length - 1}
            onClick={() => setCurrentIndex(i => Math.min(prospects.length - 1, i + 1))}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <span>Next Account</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
