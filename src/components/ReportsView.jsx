import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Printer, 
  ArrowUpRight, 
  Percent, 
  Building2, 
  Filter,
  Check,
  RefreshCw,
  Eye,
  ShieldCheck,
  Zap
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import { getRelativeFollowupInfo, getCompanyActivityInfo } from '../utils/dateUtils';

export default function ReportsView({ 
  prospects = [], 
  activeSetter = 'Fil',
  onSelectCompany 
}) {
  const [setterFilter, setSetterFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filtered prospects based on report controls
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (setterFilter !== 'all') {
        const workedBy = (p.workedBy || '').toLowerCase();
        if (!workedBy.includes(setterFilter.toLowerCase())) return false;
      }
      if (priorityFilter !== 'all') {
        if ((p.priority || 'B') !== priorityFilter) return false;
      }
      return true;
    });
  }, [prospects, setterFilter, priorityFilter]);

  // Aggregate Comprehensive Analytics Metrics
  const metrics = useMemo(() => {
    const total = filteredProspects.length;
    if (total === 0) {
      return {
        total: 0,
        todo: 0,
        inReview: 0,
        qualified: 0,
        disqualified: 0,
        qualificationRate: 0,
        disqualificationRate: 0,
        inReviewRate: 0,
        allContacts: [],
        totalContacts: 0,
        validEmailsCount: 0,
        contactsWithLinkedin: 0,
        emailStats: { notSent: 0, sent: 0, f1: 0, f2: 0, replied: 0, bounced: 0, noEmail: 0, totalContacted: 0, replyRate: 0, bounceRate: 0 },
        linkedinStats: { notStarted: 0, pending: 0, connected: 0, replied: 0, totalContacted: 0, connectionRate: 0, replyRate: 0 },
        setterStats: {},
        priorityStats: { A: { total: 0, qualified: 0, inReview: 0, todo: 0 }, B: { total: 0, qualified: 0, inReview: 0, todo: 0 }, C: { total: 0, qualified: 0, inReview: 0, todo: 0 } },
        urgentFollowups: 0,
        pendingFollowups: 0,
        untouchedCount: 0,
        checkedTodayCount: 0
      };
    }

    // Stages
    let todo = 0, inReview = 0, qualified = 0, disqualified = 0;
    let untouchedCount = 0, checkedTodayCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Priority stats
    const priorityStats = {
      A: { total: 0, qualified: 0, inReview: 0, todo: 0, disqualified: 0 },
      B: { total: 0, qualified: 0, inReview: 0, todo: 0, disqualified: 0 },
      C: { total: 0, qualified: 0, inReview: 0, todo: 0, disqualified: 0 }
    };

    // Setter stats
    const setterStats = {
      Fil: { worked: 0, qualified: 0, inReview: 0, emailsSent: 0, emailReplies: 0, linkedinSent: 0, linkedinConnected: 0 },
      Panu: { worked: 0, qualified: 0, inReview: 0, emailsSent: 0, emailReplies: 0, linkedinSent: 0, linkedinConnected: 0 },
      Team: { worked: 0, qualified: 0, inReview: 0, emailsSent: 0, emailReplies: 0, linkedinSent: 0, linkedinConnected: 0 }
    };

    // Contacts & Outreach
    let allContacts = [];
    let validEmailsCount = 0;
    let contactsWithLinkedin = 0;
    let urgentFollowups = 0;
    let pendingFollowups = 0;

    const emailStats = {
      notSent: 0,
      sent: 0,
      f1: 0,
      f2: 0,
      replied: 0,
      bounced: 0,
      noEmail: 0,
      totalContacted: 0,
      replyRate: 0,
      bounceRate: 0
    };

    const linkedinStats = {
      notStarted: 0,
      pending: 0,
      connected: 0,
      replied: 0,
      totalContacted: 0,
      connectionRate: 0,
      replyRate: 0
    };

    filteredProspects.forEach(comp => {
      const stage = (comp.stage || 'To Do').trim();
      if (stage === 'Qualified') qualified++;
      else if (stage === 'Disqualified') disqualified++;
      else if (stage === 'In Review' || stage === 'In Progress') inReview++;
      else todo++;

      const pTier = ['A', 'B', 'C'].includes(comp.priority) ? comp.priority : 'B';
      priorityStats[pTier].total++;
      if (stage === 'Qualified') priorityStats[pTier].qualified++;
      else if (stage === 'In Review' || stage === 'In Progress') priorityStats[pTier].inReview++;
      else if (stage === 'Disqualified') priorityStats[pTier].disqualified++;
      else priorityStats[pTier].todo++;

      const workedBy = (comp.workedBy || '').trim();
      if (workedBy && setterStats[workedBy]) {
        setterStats[workedBy].worked++;
        if (stage === 'Qualified') setterStats[workedBy].qualified++;
        if (stage === 'In Review' || stage === 'In Progress') setterStats[workedBy].inReview++;
      }

      if (!comp.lastContactDate) {
        untouchedCount++;
      } else if (comp.lastContactDate === todayStr) {
        checkedTodayCount++;
      }

      (comp.contacts || []).forEach(contact => {
        allContacts.push({ ...contact, companyName: comp.name, companyId: comp.id, companyRank: comp.rank, companyStage: comp.stage });
        
        if (contact.email && contact.email.includes('@')) validEmailsCount++;
        if (contact.linkedinUrl) contactsWithLinkedin++;

        // Email status
        const eStatus = contact.emailStatus || 'Not Sent';
        if (eStatus === 'Sent') emailStats.sent++;
        else if (eStatus === 'Follow-up 1') emailStats.f1++;
        else if (eStatus === 'Follow-up 2') emailStats.f2++;
        else if (eStatus === 'Replied') emailStats.replied++;
        else if (eStatus === 'Bounced') emailStats.bounced++;
        else if (eStatus === 'No Email Found') emailStats.noEmail++;
        else emailStats.notSent++;

        if (['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Bounced'].includes(eStatus)) {
          emailStats.totalContacted++;
          if (workedBy && setterStats[workedBy]) {
            setterStats[workedBy].emailsSent++;
            if (eStatus === 'Replied') setterStats[workedBy].emailReplies++;
          }
        }

        // LinkedIn status
        const lStatus = contact.linkedinStatus || 'Not Started';
        if (lStatus === 'Pending') linkedinStats.pending++;
        else if (lStatus === 'Connected') linkedinStats.connected++;
        else if (lStatus === 'Replied') linkedinStats.replied++;
        else linkedinStats.notStarted++;

        if (['Pending', 'Connected', 'Replied'].includes(lStatus)) {
          linkedinStats.totalContacted++;
          if (workedBy && setterStats[workedBy]) {
            setterStats[workedBy].linkedinSent++;
            if (lStatus === 'Connected' || lStatus === 'Replied') setterStats[workedBy].linkedinConnected++;
          }
        }

        // Followups
        if (contact.nextFollowupDate) {
          const fInfo = getRelativeFollowupInfo(contact.nextFollowupDate);
          if (fInfo.isOverdue || fInfo.isToday) urgentFollowups++;
          else pendingFollowups++;
        }
      });
    });

    emailStats.replyRate = emailStats.totalContacted > 0 
      ? Math.round((emailStats.replied / emailStats.totalContacted) * 100) 
      : 0;
    emailStats.bounceRate = emailStats.totalContacted > 0 
      ? Math.round((emailStats.bounced / emailStats.totalContacted) * 100) 
      : 0;

    linkedinStats.connectionRate = linkedinStats.totalContacted > 0 
      ? Math.round(((linkedinStats.connected + linkedinStats.replied) / linkedinStats.totalContacted) * 100) 
      : 0;
    linkedinStats.replyRate = linkedinStats.totalContacted > 0 
      ? Math.round((linkedinStats.replied / linkedinStats.totalContacted) * 100) 
      : 0;

    return {
      total,
      todo,
      inReview,
      qualified,
      disqualified,
      qualificationRate: total > 0 ? Math.round((qualified / total) * 100) : 0,
      disqualificationRate: total > 0 ? Math.round((disqualified / total) * 100) : 0,
      inReviewRate: total > 0 ? Math.round((inReview / total) * 100) : 0,
      allContacts,
      totalContacts: allContacts.length,
      validEmailsCount,
      contactsWithLinkedin,
      emailStats,
      linkedinStats,
      setterStats,
      priorityStats,
      urgentFollowups,
      pendingFollowups,
      untouchedCount,
      checkedTodayCount
    };
  }, [filteredProspects]);

  // Export Analytics Summary to CSV
  const handleExportReportCSV = () => {
    const rows = [
      ['Report: UK Prospects Outreach Analytics Summary'],
      ['Generated At', new Date().toLocaleString()],
      ['Active Setter Filter', setterFilter],
      ['Priority Filter', priorityFilter],
      [],
      ['Metric', 'Value'],
      ['Total Tracked Companies', metrics.total],
      ['Qualified Opportunities', metrics.qualified],
      ['Qualification Rate', `${metrics.qualificationRate}%`],
      ['In Review (Active Outreach)', metrics.inReview],
      ['To Do (Untouched/Pending)', metrics.todo],
      ['Disqualified', metrics.disqualified],
      ['Total Decision Makers', metrics.totalContacts],
      ['Valid Email Addresses', metrics.validEmailsCount],
      ['LinkedIn Profiles Identified', metrics.contactsWithLinkedin],
      ['Emails Contacted (Initial + F1 + F2)', metrics.emailStats.totalContacted],
      ['Email Replies', metrics.emailStats.replied],
      ['Email Reply Rate', `${metrics.emailStats.replyRate}%`],
      ['Email Bounced', metrics.emailStats.bounced],
      ['LinkedIn Outreach Initiated', metrics.linkedinStats.totalContacted],
      ['LinkedIn Connected/Replied', metrics.linkedinStats.connected + metrics.linkedinStats.replied],
      ['LinkedIn Connection Rate', `${metrics.linkedinStats.connectionRate}%`],
      ['Urgent Follow-ups Due', metrics.urgentFollowups],
      [],
      ['Setter', 'Accounts Worked', 'Emails Sent', 'Email Replies', 'LinkedIn Sent', 'LinkedIn Connected', 'Qualified Accounts'],
      ...Object.entries(metrics.setterStats).map(([setter, data]) => [
        setter,
        data.worked,
        data.emailsSent,
        data.emailReplies,
        data.linkedinSent,
        data.linkedinConnected,
        data.qualified
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `outreach_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Outreach & Pipeline Analytics</h1>
              <p className="text-xs text-slate-400">Executive performance, multi-channel outreach metrics & conversion telemetry</p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Export Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Setter Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Setter:</span>
            <select
              value={setterFilter}
              onChange={(e) => setSetterFilter(e.target.value)}
              className="bg-slate-950 font-bold text-indigo-300 border border-slate-700 px-2 py-0.5 rounded focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Setters</option>
              <option value="Fil">Fil</option>
              <option value="Panu">Panu</option>
              <option value="Team">Team</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 font-bold text-emerald-300 border border-slate-700 px-2 py-0.5 rounded focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Tiers</option>
              <option value="A">Tier A (High Value)</option>
              <option value="B">Tier B (Standard)</option>
              <option value="C">Tier C (Secondary)</option>
            </select>
          </div>

          {/* Export Report CSV */}
          <button
            onClick={handleExportReportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
            title="Download report metrics as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Print / PDF Report */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* KPI 1: Pipeline Conversion Rate */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Conversion Rate</span>
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TargetIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.qualificationRate}%</span>
              <span className="text-xs text-emerald-400 font-bold">({metrics.qualified} qualified)</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.qualificationRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Active in Review / Outreach Velocity */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Active Outreach</span>
              <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.inReview}</span>
              <span className="text-xs text-sky-400 font-bold">({metrics.inReviewRate}% of total)</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-500 to-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.inReviewRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Email Response Rate */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Email Reply Rate</span>
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Mail className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.emailStats.replyRate}%</span>
              <span className="text-xs text-amber-400 font-bold">({metrics.emailStats.replied} replied)</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.emailStats.replyRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: LinkedIn Connection Rate */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>LinkedIn Connected</span>
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <LinkedinIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.linkedinStats.connectionRate}%</span>
              <span className="text-xs text-indigo-400 font-bold">({metrics.linkedinStats.connected + metrics.linkedinStats.replied})</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.linkedinStats.connectionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 5: Follow-up Health & SLA */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Follow-ups Due</span>
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.urgentFollowups}</span>
              <span className="text-xs text-purple-300 font-semibold">urgent ({metrics.pendingFollowups} queued)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium">
            {metrics.urgentFollowups === 0 ? '✓ All sequences on schedule' : '⚠️ Action needed today'}
          </div>
        </div>

        {/* KPI 6: Decision Maker Contact Coverage */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700/60 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Total Contacts</span>
              <span className="p-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline space-x-1.5">
              <span>{metrics.totalContacts}</span>
              <span className="text-xs text-emerald-400 font-bold">({metrics.validEmailsCount} emails)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium">
            {metrics.contactsWithLinkedin} LinkedIn profiles verified
          </div>
        </div>

      </div>

      {/* Main Analysis Section */}
      <div className="space-y-6">

          {/* 1. Visual Pipeline Funnel Flow */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Prospect Conversion Funnel</h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{metrics.total} Total Tracked Accounts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Funnel Step 1: To Do */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 relative">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>1. TO DO</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {metrics.total > 0 ? Math.round((metrics.todo / metrics.total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-xl font-bold text-white mt-1.5">{metrics.todo}</div>
                <p className="text-[10px] text-slate-500 mt-1">Pending first research / contact</p>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(metrics.todo / Math.max(metrics.total, 1)) * 100}%` }} />
                </div>
              </div>

              {/* Funnel Step 2: In Review */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-900/40 relative">
                <div className="flex items-center justify-between text-[11px] text-sky-400 font-semibold">
                  <span>2. IN REVIEW</span>
                  <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">
                    {metrics.inReviewRate}%
                  </span>
                </div>
                <div className="text-xl font-bold text-white mt-1.5">{metrics.inReview}</div>
                <p className="text-[10px] text-slate-500 mt-1">Active outreach & sequence</p>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${metrics.inReviewRate}%` }} />
                </div>
              </div>

              {/* Funnel Step 3: Qualified */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-900/40 relative">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                  <span>3. QUALIFIED</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">
                    {metrics.qualificationRate}%
                  </span>
                </div>
                <div className="text-xl font-bold text-white mt-1.5">{metrics.qualified}</div>
                <p className="text-[10px] text-emerald-400/80 mt-1">High-intent appointments booked</p>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.qualificationRate}%` }} />
                </div>
              </div>

              {/* Funnel Step 4: Disqualified */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-900/40 relative">
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-semibold">
                  <span>4. DISQUALIFIED</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300">
                    {metrics.disqualificationRate}%
                  </span>
                </div>
                <div className="text-xl font-bold text-white mt-1.5">{metrics.disqualified}</div>
                <p className="text-[10px] text-slate-500 mt-1">Not a fit / closed / rejected</p>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${metrics.disqualificationRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Multi-Channel Outreach Matrix (Email & LinkedIn Sequences) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Email Sequences */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Email Sequence Breakdown</h3>
                </div>
                <span className="text-[11px] font-semibold text-amber-300">{metrics.emailStats.totalContacted} Contacted</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Sent / Initial */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Initial Email Sent</span>
                  </span>
                  <span className="font-bold text-white">{metrics.emailStats.sent}</span>
                </div>

                {/* Follow-up 1 */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Follow-up 1 (F1)</span>
                  </span>
                  <span className="font-bold text-white">{metrics.emailStats.f1}</span>
                </div>

                {/* Follow-up 2 */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>Follow-up 2 (F2 - Final)</span>
                  </span>
                  <span className="font-bold text-white">{metrics.emailStats.f2}</span>
                </div>

                {/* Replied */}
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>💬 Replied (Positive Lead)</span>
                  </span>
                  <span className="font-bold text-emerald-400">{metrics.emailStats.replied}</span>
                </div>

                {/* Bounced */}
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>⚠️ Bounced / Invalid</span>
                  </span>
                  <span className="font-bold text-rose-400">{metrics.emailStats.bounced}</span>
                </div>

                {/* No Email Found */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>🔍 No Email Found</span>
                  </span>
                  <span className="font-bold text-slate-400">{metrics.emailStats.noEmail}</span>
                </div>
              </div>
            </div>

            {/* LinkedIn Sequences */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <LinkedinIcon className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">LinkedIn Outreach Matrix</h3>
                </div>
                <span className="text-[11px] font-semibold text-sky-300">{metrics.linkedinStats.totalContacted} Invites</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Invites Sent (Pending) */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>⏳ Connection Invite Pending</span>
                  </span>
                  <span className="font-bold text-white">{metrics.linkedinStats.pending}</span>
                </div>

                {/* Connected */}
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>🤝 Connected (Accepted)</span>
                  </span>
                  <span className="font-bold text-emerald-400">{metrics.linkedinStats.connected}</span>
                </div>

                {/* Replied */}
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>💬 Replied to InMail / Message</span>
                  </span>
                  <span className="font-bold text-indigo-400">{metrics.linkedinStats.replied}</span>
                </div>

                {/* Not Started */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>⚪ Not Started Yet</span>
                  </span>
                  <span className="font-bold text-slate-400">{metrics.linkedinStats.notStarted}</span>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Connection Acceptance Rate:</span>
                  <span className="font-bold text-white">{metrics.linkedinStats.connectionRate}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Setter Performance & Productivity Matrix */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Setter Performance & Activity Matrix</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Outreach Activity per Setter</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="pb-2">Setter</th>
                    <th className="pb-2 text-center">Accounts Worked</th>
                    <th className="pb-2 text-center">Emails Sent</th>
                    <th className="pb-2 text-center">Email Replies</th>
                    <th className="pb-2 text-center">LinkedIn Sent</th>
                    <th className="pb-2 text-center">Qualified</th>
                    <th className="pb-2 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {Object.entries(metrics.setterStats).map(([setter, data]) => {
                    const convRate = data.worked > 0 ? Math.round((data.qualified / data.worked) * 100) : 0;
                    return (
                      <tr key={setter} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 font-bold text-white flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                            {setter[0]}
                          </span>
                          <span>{setter}</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-200 font-semibold">{data.worked}</td>
                        <td className="py-2.5 text-center text-amber-300 font-mono">{data.emailsSent}</td>
                        <td className="py-2.5 text-center text-emerald-400 font-bold">{data.emailReplies}</td>
                        <td className="py-2.5 text-center text-sky-400 font-mono">{data.linkedinSent}</td>
                        <td className="py-2.5 text-center text-emerald-300 font-black">{data.qualified}</td>
                        <td className="py-2.5 text-right font-bold text-indigo-300">
                          {convRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

      </div>

    </div>
  );
}

function TargetIcon(props) {
  return (
    <svg 
      {...props}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
