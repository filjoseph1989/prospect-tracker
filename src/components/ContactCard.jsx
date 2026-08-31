import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  User, 
  Edit3, 
  Trash2, 
  Sparkles,
  ChevronDown,
  CalendarCheck2,
  Clock
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';

export default function ContactCard({ 
  contact, 
  companyId, 
  onUpdateContact, 
  onDeleteContact,
  isCompact = false 
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [notes, setNotes] = useState(contact.notes || '');

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleStatusChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'linkedinStatus' && value !== 'Not Started' && !contact.linkedinConnectedBy) {
      updates.linkedinConnectedBy = 'Fil';
      updates.linkedinLastContactDate = new Date().toISOString().split('T')[0];
    }
    if (field === 'emailStatus' && value !== 'Not Sent' && !contact.emailContactedBy) {
      updates.emailContactedBy = 'Fil';
      updates.emailLastContactDate = new Date().toISOString().split('T')[0];
    }
    onUpdateContact(companyId, contact.id, updates);
  };

  const saveNotes = () => {
    onUpdateContact(companyId, contact.id, { notes });
    setShowEditNotes(false);
  };

  const getLiBadgeClass = (status) => {
    switch (status) {
      case 'Connected':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Pending':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Replied':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'InMail Sent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getEmailBadgeClass = (status) => {
    switch (status) {
      case 'Sent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Follow-up 1':
      case 'Follow-up 2':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Replied':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Bounced':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'No Email Found':
        return 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-all group">
      <div className="flex items-start justify-between gap-3">
        {/* Contact Info */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase shrink-0">
            {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('') || <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-white">{contact.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-medium">
                {contact.role}
              </span>
            </div>
            
            {/* Outreach Assignees / dates indicator */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              {contact.linkedinConnectedBy && (
                <span className="text-sky-400/90 font-medium">LI: {contact.linkedinConnectedBy}</span>
              )}
              {contact.linkedinConnectedBy && contact.emailContactedBy && <span>•</span>}
              {contact.emailContactedBy && (
                <span className="text-amber-400/90 font-medium">Email: {contact.emailContactedBy}</span>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Status Dropdown & Delete */}
        <div className="flex items-center space-x-1.5">
          <select
            value={contact.appointmentStatus || 'Not Booked'}
            onChange={(e) => handleStatusChange('appointmentStatus', e.target.value)}
            className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none transition-all cursor-pointer ${
              contact.appointmentStatus === 'Appointment Booked'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : contact.appointmentStatus === 'In Discussion'
                ? 'bg-purple-900/60 text-purple-200 border-purple-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <option value="Not Booked">📅 Not Booked</option>
            <option value="In Discussion">💬 In Discussion</option>
            <option value="Appointment Booked">🎯 Appointment Booked</option>
            <option value="Not a Fit">❌ Not a Fit</option>
          </select>

          <button
            onClick={() => onDeleteContact(companyId, contact.id)}
            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Remove contact"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Outreach Channels Grid */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-800/80">
        
        {/* LinkedIn Channel Card */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <LinkedinIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">LinkedIn</span>
            </div>
            
            {contact.linkedinUrl ? (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium hover:underline"
              >
                <span>Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[11px] text-slate-500 italic">No URL</span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 mt-1">
            <select
              value={contact.linkedinStatus || 'Not Started'}
              onChange={(e) => handleStatusChange('linkedinStatus', e.target.value)}
              className={`w-full text-xs font-medium px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${getLiBadgeClass(contact.linkedinStatus)}`}
            >
              <option value="Not Started" className="bg-slate-900 text-slate-300">Not Started</option>
              <option value="Not Connected" className="bg-slate-900 text-slate-300">Not Connected</option>
              <option value="Pending" className="bg-slate-900 text-sky-300">Connection Sent (Pending)</option>
              <option value="Connected" className="bg-slate-900 text-emerald-300">Connected</option>
              <option value="InMail Sent" className="bg-slate-900 text-amber-300">InMail / Message Sent</option>
              <option value="Replied" className="bg-slate-900 text-purple-300">Replied / Conversation</option>
            </select>

            <select
              value={contact.linkedinConnectedBy || 'Fil'}
              onChange={(e) => handleStatusChange('linkedinConnectedBy', e.target.value)}
              className="text-xs bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-1 rounded-md cursor-pointer shrink-0"
              title="Assigned LinkedIn Setter"
            >
              <option value="Fil">Fil</option>
              <option value="Panu">Panu</option>
              <option value="Team">Team</option>
            </select>
          </div>
        </div>

        {/* Email Channel Card */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center space-x-1.5 min-w-0">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300 shrink-0">Email</span>
              {contact.email ? (
                <span className="text-xs text-slate-400 font-mono truncate max-w-[130px]" title={contact.email}>
                  {contact.email}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 italic">No email</span>
              )}
            </div>

            {contact.email && (
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => copyToClipboard(contact.email)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                  title="Copy email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`mailto:${contact.email}`}
                  className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-all"
                  title="Open mail client"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5 mt-1">
            <select
              value={contact.emailStatus || 'Not Sent'}
              onChange={(e) => handleStatusChange('emailStatus', e.target.value)}
              className={`w-full text-xs font-medium px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${getEmailBadgeClass(contact.emailStatus)}`}
            >
              <option value="Not Sent" className="bg-slate-900 text-slate-300">Not Sent</option>
              <option value="Sent" className="bg-slate-900 text-amber-300">Email Sent</option>
              <option value="Follow-up 1" className="bg-slate-900 text-orange-300">Follow-up 1</option>
              <option value="Follow-up 2" className="bg-slate-900 text-orange-300">Follow-up 2</option>
              <option value="Replied" className="bg-slate-900 text-purple-300">Replied / Meeting Setup</option>
              <option value="Bounced" className="bg-slate-900 text-rose-300">Bounced / Invalid</option>
              <option value="No Email Found" className="bg-slate-900 text-zinc-400">No Email Found</option>
            </select>

            <select
              value={contact.emailContactedBy || 'Fil'}
              onChange={(e) => handleStatusChange('emailContactedBy', e.target.value)}
              className="text-xs bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-1 rounded-md cursor-pointer shrink-0"
              title="Assigned Email Setter"
            >
              <option value="Fil">Fil</option>
              <option value="Panu">Panu</option>
              <option value="Team">Team</option>
            </select>
          </div>
        </div>

      </div>

      {/* Additional Emails if any */}
      {contact.additionalEmails && contact.additionalEmails.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 font-medium">Alt Emails:</span>
          {contact.additionalEmails.map((altEmail, i) => (
            <button
              key={i}
              onClick={() => copyToClipboard(altEmail)}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 font-mono flex items-center space-x-1 cursor-pointer"
              title="Click to copy alt email"
            >
              <span>{altEmail}</span>
              <Copy className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>
      )}

      {/* Contact Notes Section */}
      <div className="mt-2 text-xs">
        {showEditNotes ? (
          <div className="mt-1 space-y-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add contact-specific notes (e.g. why they are the right person, topics discussed)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
            <div className="flex justify-end space-x-1">
              <button
                onClick={() => setShowEditNotes(false)}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="px-2 py-0.5 rounded text-[11px] bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-400 group/notes">
            {contact.notes ? (
              <p className="text-[11px] text-slate-300 italic truncate flex-1">
                "{contact.notes}"
              </p>
            ) : (
              <span className="text-[11px] text-slate-500 italic">+ Add note for {contact.name}</span>
            )}
            <button
              onClick={() => setShowEditNotes(true)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 ml-2 opacity-60 group-hover/notes:opacity-100 font-medium cursor-pointer"
            >
              {contact.notes ? 'Edit' : 'Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
