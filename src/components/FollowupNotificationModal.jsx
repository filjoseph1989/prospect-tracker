import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Mail, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';
import { 
  formatDisplayDate, 
  getRelativeFollowupInfo, 
  getTodayDateStr, 
  addDaysToDate 
} from '../utils/dateUtils';
import LinkedinIcon from './LinkedinIcon';

export default function FollowupNotificationModal({
  isOpen,
  onClose,
  prospects = [],
  onSelectCompany,
  onUpdateContactStatus,
  onEnableDesktopNotifications,
  desktopNotificationsEnabled
}) {
  if (!isOpen) return null;

  // Extract all contacts with nextFollowupDate
  const allFollowups = [];
  const todayStr = getTodayDateStr();

  prospects.forEach(company => {
    (company.contacts || []).forEach(contact => {
      if (contact.nextFollowupDate && !['Replied', 'Bounced', 'No Email Found'].includes(contact.emailStatus) && company.stage !== 'Disqualified') {
        const info = getRelativeFollowupInfo(contact.nextFollowupDate);
        if (info) {
          allFollowups.push({
            company,
            contact,
            info,
            nextDate: contact.nextFollowupDate
          });
        }
      }
    });
  });

  // Sort by date ascending (most overdue first)
  allFollowups.sort((a, b) => a.nextDate.localeCompare(b.nextDate));

  const overdueList = allFollowups.filter(f => f.info.isOverdue);
  const todayList = allFollowups.filter(f => f.info.isToday);
  const upcomingList = allFollowups.filter(f => !f.info.isOverdue && !f.info.isToday && f.info.days <= 3);

  const [activeTab, setActiveTab] = useState(() => {
    if (overdueList.length > 0) return 'overdue';
    if (todayList.length > 0) return 'today';
    return 'today';
  });

  const displayedList = activeTab === 'overdue' 
    ? overdueList 
    : activeTab === 'today' 
    ? todayList 
    : activeTab === 'upcoming' 
    ? upcomingList 
    : allFollowups;

  const handleSnooze = (companyId, contactId, currentNextDate, days = 3) => {
    const newDate = addDaysToDate(days, currentNextDate);
    onUpdateContactStatus(companyId, contactId, { nextFollowupDate: newDate });
  };

  const handleAdvanceFollowup = (companyId, contact) => {
    const today = getTodayDateStr();
    if (contact.emailStatus === 'Sent' || !contact.emailStatus || contact.emailStatus === 'Not Sent') {
      onUpdateContactStatus(companyId, contact.id, {
        emailStatus: 'Follow-up 1',
        emailFollowup1Date: today,
        emailLastContactDate: today,
        nextFollowupDate: addDaysToDate(4)
      });
    } else if (contact.emailStatus === 'Follow-up 1') {
      onUpdateContactStatus(companyId, contact.id, {
        emailStatus: 'Follow-up 2',
        emailFollowup2Date: today,
        emailLastContactDate: today,
        nextFollowupDate: addDaysToDate(5)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Outreach Follow-up Center</h2>
                {overdueList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {overdueList.length} Overdue
                  </span>
                )}
                {todayList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    {todayList.length} Due Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep your pipeline moving with scheduled follow-ups and reminders
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!desktopNotificationsEnabled && onEnableDesktopNotifications && (
              <button
                type="button"
                onClick={onEnableDesktopNotifications}
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Enable OS/Browser Notifications"
              >
                <span>🔔 Enable Alerts</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            ⚡ Due Today ({todayList.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overdue'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            🚨 Overdue ({overdueList.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            📅 Next 3 Days ({upcomingList.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Follow-ups ({allFollowups.length})
          </button>
        </div>

        {/* Follow-up Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {displayedList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                {activeTab === 'today' ? 'No follow-ups due today!' : activeTab === 'overdue' ? 'No overdue follow-ups!' : 'All caught up!'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {activeTab === 'today' && upcomingList.length > 0
                  ? `You have ${upcomingList.length} incoming follow-up${upcomingList.length > 1 ? 's' : ''} scheduled in the next 3 days.`
                  : 'There are no scheduled follow-ups matching this filter right now.'}
              </p>
              {activeTab === 'today' && upcomingList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className="mt-3.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Next 3 Days ({upcomingList.length})</span>
                </button>
              )}
            </div>
          ) : (
            displayedList.map(({ company, contact, info, nextDate }) => (
              <div 
                key={`${company.id}_${contact.id}`}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Company & Contact details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      #{company.rank}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCompany(company.id);
                        onClose();
                      }}
                      className="font-bold text-sm text-white hover:text-indigo-300 hover:underline text-left cursor-pointer transition-colors"
                    >
                      {company.name}
                    </button>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-300">{contact.name}</span>
                    {contact.role && (
                      <span 
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/35 text-[10px] font-medium shadow-xs"
                        title={`Position: ${contact.role}`}
                      >
                        <Briefcase className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                        <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">Role:</span>
                        <span className="font-semibold text-purple-100">{contact.role}</span>
                      </span>
                    )}
                  </div>

                  {/* Outreach milestones info */}
                  <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400 flex-wrap gap-y-1">
                    {contact.email && (
                      <span className="font-mono text-amber-300/90 text-[11px]">{contact.email}</span>
                    )}
                    {contact.emailSentDate && (
                      <span className="text-[11px] text-slate-400">
                        Sent: <span className="text-slate-300 font-mono">{formatDisplayDate(contact.emailSentDate)}</span>
                      </span>
                    )}
                    {contact.emailFollowup1Date && (
                      <span className="text-[11px] text-amber-400/90">
                        F1: <span className="font-mono">{formatDisplayDate(contact.emailFollowup1Date)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Date badge & Actions */}
                <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1.5">
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded-lg text-xs border flex items-center space-x-1 ${info.badgeColor}`}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDisplayDate(nextDate)} ({info.label})</span>
                  </span>

                  {/* Mail action */}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                      title={`Send email to ${contact.email}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Advance to next Followup button */}
                  {contact.emailStatus !== 'Follow-up 2' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceFollowup(company.id, contact)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1"
                      title={contact.emailStatus === 'Follow-up 1' ? 'Mark F2 as Sent' : 'Mark F1 as Sent'}
                    >
                      <span>{contact.emailStatus === 'Follow-up 1' ? '✓ Mark F2 Sent' : '✓ Mark F1 Sent'}</span>
                    </button>
                  )}

                  {/* Snooze +3d */}
                  <button
                    type="button"
                    onClick={() => handleSnooze(company.id, contact.id, nextDate, 3)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer transition-all"
                    title="Postpone follow-up date by 3 days"
                  >
                    +3d
                  </button>

                  {/* View company */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCompany(company.id);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer transition-all"
                    title="Open company details"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Polling interval active • Auto-updates in real-time</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
