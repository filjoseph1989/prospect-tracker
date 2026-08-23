import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Check, 
  Copy, 
  CalendarCheck2, 
  Building2, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight 
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import ContactCard from './ContactCard';

export default function MultiContactView({
  prospects,
  onUpdateCompany,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenCompanyModal,
  onOpenTemplatesWithTarget
}) {
  const [copiedAll, setCopiedAll] = useState(null);

  // Filter for companies that have > 1 contact
  const multiProspects = prospects.filter(p => (p.contacts || []).length > 1);

  const copyAllEmailsForCompany = (company) => {
    const emails = (company.contacts || [])
      .map(c => c.email)
      .filter(Boolean)
      .join(', ');
    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setCopiedAll(company.id);
    setTimeout(() => setCopiedAll(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner explaining multi-contact strategy */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <span>Multi-Stakeholder Account Matrix</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold">
                {multiProspects.length} High-Value Accounts
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              When target property management firms have multiple executives (CEO, CTO, Founder, Operations Director), multi-threading outreach on LinkedIn and Email dramatically increases your appointment setting conversion rate.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-medium text-purple-300">
            {multiProspects.reduce((acc, p) => acc + (p.contacts?.length || 0), 0)} Total Decision Makers
          </span>
        </div>
      </div>

      {multiProspects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No multi-contact companies found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click on any company in the table view to add more decision makers (Founders, MDs, Operations leads).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {multiProspects.map(company => {
            const totalContacts = company.contacts.length;
            const connectedCount = company.contacts.filter(c => c.linkedinStatus === 'Connected').length;
            const pendingCount = company.contacts.filter(c => c.linkedinStatus === 'Pending').length;
            const emailedCount = company.contacts.filter(c => ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(c.emailStatus)).length;
            const bookedCount = company.contacts.filter(c => c.appointmentStatus === 'Appointment Booked').length;

            return (
              <div 
                key={company.id} 
                className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all p-5 shadow-lg shadow-black/20"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-sm shrink-0">
                      #{company.rank}
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-white">{company.name}</h3>
                        
                        {/* Priority Badge */}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          company.priority === 'A'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          Priority {company.priority}
                        </span>

                        {/* Revenue & Size */}
                        {company.revenue && (
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-medium">
                            💰 {company.revenue}
                          </span>
                        )}
                        {company.employees && company.employees !== '0' && (
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-medium">
                            👥 {company.employees} staff
                          </span>
                        )}

                        {/* Website */}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 hover:underline"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Business Model */}
                      {company.businessModel && (
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-slate-300">Model:</span> {company.businessModel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions on Account */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Quick outreach status badges */}
                    <div className="flex items-center space-x-1.5 text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-sky-400 font-semibold">{connectedCount} Connected</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-sky-300">{pendingCount} Pending</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400 font-semibold">{emailedCount} Emailed</span>
                    </div>

                    <button
                      onClick={() => copyAllEmailsForCompany(company)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                      title="Copy all contact emails"
                    >
                      {copiedAll === company.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy All Emails</span>
                    </button>

                    <button
                      onClick={() => onOpenTemplatesWithTarget(company)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Pitch</span>
                    </button>

                    <button
                      onClick={() => onOpenCompanyModal(company)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Edit Account
                    </button>
                  </div>
                </div>

                {/* Automation Opportunity & Intelligence Section */}
                {(company.automationOpportunities || company.notes) && (
                  <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    {company.automationOpportunities && (
                      <div>
                        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                          ⚡ Automation Angles:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {company.automationOpportunities.split(';').map((opp, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                              {opp.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.notes && (
                      <div>
                        <span className="font-semibold text-purple-400 uppercase tracking-wider text-[10px] block mb-1">
                          🧠 Research & Decision Maker Notes:
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line line-clamp-3">
                          {company.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contacts Grid */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      Key Stakeholders ({company.contacts.length})
                    </span>
                    <button
                      onClick={() => {
                        const name = prompt(`Enter new contact name for ${company.name}:`);
                        if (name && name.trim()) {
                          onAddContact(company.id, { name: name.trim(), role: 'Key Decision Maker' });
                        }
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Decision Maker</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {company.contacts.map(contact => (
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
            );
          })}
        </div>
      )}
    </div>
  );
}
