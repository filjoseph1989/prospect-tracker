import React from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  CalendarCheck2, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send, 
  Flame, 
  ArrowRight 
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';

export default function StatsDashboard({ 
  stats, 
  priorityFilter, 
  setPriorityFilter, 
  statusFilter, 
  setStatusFilter,
  activeView,
  setActiveView 
}) {
  if (!stats) return null;

  const {
    totalCompanies = 0,
    multiContactCompanies = 0,
    totalContacts = 0,
    linkedinStats = { notStarted: 0, notConnected: 0, pending: 0, connected: 0, replied: 0 },
    emailStats = { notSent: 0, sent: 0, followUp1: 0, followUp2: 0, replied: 0, bounced: 0 },
    appointmentStats = { notBooked: 0, inDiscussion: 0, booked: 0 },
    priorityBreakdown = { A: 0, B: 0, C: 0 }
  } = stats;

  const totalActiveEmails = emailStats.sent + emailStats.followUp1 + emailStats.followUp2;
  const totalActiveLinkedIn = linkedinStats.pending + linkedinStats.connected + linkedinStats.replied;

  return (
    <div className="mb-6 space-y-4">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        
        {/* Card 1: Total Prospects */}
        <div 
          onClick={() => { setPriorityFilter('ALL'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            priorityFilter === 'ALL' && statusFilter === 'ALL' && activeView === 'table'
              ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Prospects</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{totalCompanies}</span>
            <span className="text-xs text-slate-400 font-medium">{totalContacts} contacts</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">A: {priorityBreakdown.A || 0}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">B: {priorityBreakdown.B || 0}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-semibold">C: {priorityBreakdown.C || 0}</span>
          </div>
        </div>

        {/* Card 2: Multi-Contact Accounts */}
        <div 
          onClick={() => setActiveView('multi')}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            activeView === 'multi'
              ? 'bg-purple-950/60 border-purple-500/60 shadow-md shadow-purple-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Multi-Contact</span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-100 tracking-tight">{multiContactCompanies}</span>
            <span className="text-xs text-purple-300 font-medium">Multiple Stakeholders</span>
          </div>
          <p className="mt-2 text-[11px] text-purple-300/80 flex items-center">
            <span>Coordinate LI & Email</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </p>
        </div>

        {/* Card 3: LinkedIn Outreach */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'LINKEDIN_ACTIVE' ? 'ALL' : 'LINKEDIN_ACTIVE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'LINKEDIN_ACTIVE'
              ? 'bg-sky-950/60 border-sky-500/60 shadow-md shadow-sky-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">LinkedIn</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <LinkedinIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{totalActiveLinkedIn}</span>
            <span className="text-xs text-emerald-400 font-medium">+{linkedinStats.connected} Connected</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="text-amber-300 font-medium">{linkedinStats.pending} pending</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-300 font-medium">{linkedinStats.connected} connected</span>
          </div>
        </div>

        {/* Card 4: Email Outreach */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'EMAIL_SENT' ? 'ALL' : 'EMAIL_SENT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'EMAIL_SENT'
              ? 'bg-amber-950/60 border-amber-500/60 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Email Outreach</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{totalActiveEmails}</span>
            <span className="text-xs text-amber-300 font-medium">Contacted</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">{emailStats.sent} initial sent</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-300 font-medium">{emailStats.replied} replied</span>
          </div>
        </div>

        {/* Card 5: Appointments Booked */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'BOOKED' ? 'ALL' : 'BOOKED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'BOOKED'
              ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border-emerald-600/40 hover:border-emerald-500 hover:bg-emerald-950/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1 text-emerald-400 fill-current" />
              Booked 🎯
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-200 tracking-tight">{appointmentStats.booked}</span>
            <span className="text-xs text-emerald-300 font-semibold">{appointmentStats.inDiscussion} In Discussion</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-300/80 font-medium">Target Appointments</p>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
        {/* Priority Filters */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-medium mr-1.5 text-[11px] uppercase tracking-wider">Priority:</span>
          {['ALL', 'A', 'B', 'C'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                priorityFilter === p
                  ? p === 'A' 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : p === 'B' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : p === 'C'
                    ? 'bg-slate-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p === 'ALL' ? 'All Priorities' : `Priority ${p}`}
            </button>
          ))}
        </div>

        {/* Status / Stage Quick Filters */}
        <div className="flex flex-wrap items-center space-x-1">
          <span className="text-slate-400 font-medium mr-1.5 text-[11px] uppercase tracking-wider">Quick Filter:</span>
          
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'MULTI_ONLY' ? 'ALL' : 'MULTI_ONLY')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'MULTI_ONLY' ? 'bg-purple-600 text-white font-semibold' : 'text-purple-300 hover:bg-purple-950/40'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Multi-Contact Only</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'EMAIL_SENT' ? 'ALL' : 'EMAIL_SENT')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all cursor-pointer ${
              statusFilter === 'EMAIL_SENT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Email Sent
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'LINKEDIN_CONNECTED' ? 'ALL' : 'LINKEDIN_CONNECTED')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all cursor-pointer ${
              statusFilter === 'LINKEDIN_CONNECTED' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            LinkedIn Connected
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'LINKEDIN_PENDING' ? 'ALL' : 'LINKEDIN_PENDING')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all cursor-pointer ${
              statusFilter === 'LINKEDIN_PENDING' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            LinkedIn Pending
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'UNCONTACTED' ? 'ALL' : 'UNCONTACTED')}
            className={`px-2 py-0.8 rounded-md font-medium transition-all cursor-pointer ${
              statusFilter === 'UNCONTACTED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Uncontacted
          </button>
        </div>
      </div>
    </div>
  );
}
