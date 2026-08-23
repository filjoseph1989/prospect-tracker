import React from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  ChevronRight, 
  CalendarCheck2,
  Plus
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';

const COLUMNS = [
  { id: 'To Research', title: 'To Research', color: 'border-slate-700 bg-slate-900/40 text-slate-400' },
  { id: 'Ready for Outreach', title: 'Ready for Outreach', color: 'border-blue-700/40 bg-blue-950/20 text-blue-300' },
  { id: 'LinkedIn Pending', title: 'LinkedIn Pending', color: 'border-sky-700/40 bg-sky-950/20 text-sky-300' },
  { id: 'Email Sent', title: 'Email Sent / Multi', color: 'border-amber-700/40 bg-amber-950/20 text-amber-300' },
  { id: 'In Discussion', title: 'In Discussion', color: 'border-purple-700/40 bg-purple-950/20 text-purple-300' },
  { id: 'Appointment Booked', title: '🎯 Booked', color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300' },
];

export default function PipelineView({
  prospects,
  onUpdateCompany,
  onOpenCompanyModal,
  onOpenTemplatesWithTarget
}) {
  const getColumnForStage = (stage) => {
    if (stage === 'Appointment Booked') return 'Appointment Booked';
    if (stage === 'In Discussion' || stage === 'In Discussion (Multi-Channel)' || stage === 'LinkedIn Connected') return 'In Discussion';
    if (stage === 'Email Sent' || stage === 'Multi-Channel Outreach (Email & LI)') return 'Email Sent';
    if (stage === 'LinkedIn Pending') return 'LinkedIn Pending';
    if (stage === 'Ready for Outreach') return 'Ready for Outreach';
    return 'To Research';
  };

  const grouped = {};
  COLUMNS.forEach(col => {
    grouped[col.id] = [];
  });

  prospects.forEach(p => {
    const colId = getColumnForStage(p.stage);
    if (grouped[colId]) {
      grouped[colId].push(p);
    } else {
      grouped['To Research'].push(p);
    }
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px] items-start">
        {COLUMNS.map(col => {
          const items = grouped[col.id] || [];

          return (
            <div 
              key={col.id}
              className={`w-72 shrink-0 rounded-xl border ${col.color} p-3 flex flex-col max-h-[calc(100vh-220px)] shadow-lg`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider">{col.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
                  {items.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-600 italic">
                    No prospects in this stage
                  </div>
                ) : (
                  items.map(company => {
                    const contacts = company.contacts || [];
                    const hasMulti = contacts.length > 1;

                    return (
                      <div
                        key={company.id}
                        onClick={() => onOpenCompanyModal(company)}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-sm group"
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-500 font-mono">#{company.rank}</span>
                            <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                              {company.name}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            company.priority === 'A' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {company.priority}
                          </span>
                        </div>

                        {/* Revenue / Size */}
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                          {company.revenue && <span>{company.revenue}</span>}
                          {company.revenue && company.employees && <span>•</span>}
                          {company.employees && <span>{company.employees} staff</span>}
                        </div>

                        {/* Contacts overview */}
                        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-purple-400" />
                              <span>{contacts.length} Contact{contacts.length !== 1 ? 's' : ''}</span>
                            </span>
                            {hasMulti && (
                              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">
                                Multi-Contact
                              </span>
                            )}
                          </div>

                          {/* Contact Names & Status snippet */}
                          {contacts.slice(0, 2).map(c => (
                            <div key={c.id} className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-950/60 px-1.5 py-0.5 rounded">
                              <span className="truncate max-w-[120px]">{c.name}</span>
                              <div className="flex items-center space-x-1">
                                {c.linkedinStatus === 'Connected' && <span className="text-emerald-400">LI Connected</span>}
                                {c.linkedinStatus === 'Pending' && <span className="text-sky-400">LI Pend</span>}
                                {c.emailStatus === 'Sent' && <span className="text-amber-400">Email Sent</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Action buttons */}
                        <div className="mt-2.5 flex items-center justify-between pt-1 text-[10px]">
                          <select
                            value={company.stage || 'To Research'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateCompany(company.id, { stage: e.target.value })}
                            className="bg-slate-950 text-slate-300 border border-slate-700 text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                          >
                            <option value="To Research">Move: To Research</option>
                            <option value="Ready for Outreach">Move: Ready</option>
                            <option value="LinkedIn Pending">Move: LI Pending</option>
                            <option value="Email Sent">Move: Email Sent</option>
                            <option value="In Discussion">Move: In Discussion</option>
                            <option value="Appointment Booked">🎯 Move: Booked</option>
                          </select>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTemplatesWithTarget(company);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                            title="Pitch Template"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
