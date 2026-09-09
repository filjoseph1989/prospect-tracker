import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MessageSquareCode, 
  Sparkles, 
  Mail, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import { copyToClipboard as copyTextUtil } from '../utils/clipboard';

const TEMPLATES = [
  {
    id: 'email_cold_1',
    title: 'Cold Email #1: Operational Bottlenecks & Maintenance Triage',
    channel: 'Email',
    category: 'Initial Outreach',
    subject: 'Streamlining {CompanyName} resident ops & inquiries',
    body: `Hi {FirstName},

I noticed your work leading operations at {CompanyName}. Managing {BusinessModel} with a growing portfolio often creates heavy inbound friction around tenant queries, contractor coordination, and maintenance triage.

We specialize in AI automation workflows built specifically for UK residential property managers to:
• Auto-triage and route maintenance tickets directly into work orders
• Instantly resolve routine tenant queries 24/7 (leasehold, keys, payments)
• Free up 15-20+ hours per week for your property management team

Would you be open to a brief 10-minute chat this Thursday or Friday to see how this fits into {CompanyName}'s current systems?

Best regards,
Fil`
  },
  {
    id: 'email_cold_2',
    title: 'Cold Email #2: BTR & Portfolio Scalability',
    channel: 'Email',
    category: 'Initial Outreach',
    subject: 'Quick question regarding {CompanyName}\'s automation opportunities',
    body: `Hi {FirstName},

Reaching out as I saw {CompanyName}\'s portfolio footprint in the UK residential space.

Many property managers we speak with are looking to scale their unit count without linearly ballooning operational headcount. {LikelyAutomationSnippet}

We help firms automate resident communications and viewing bookings end-to-end so your team can focus on high-touch landlord and resident relationships.

Do you have 10 minutes next Tuesday for a quick look at our live property management workflows?

Best,
Fil`
  },
  {
    id: 'li_connect_1',
    title: 'LinkedIn Connection Note (Concise & High Acceptance)',
    channel: 'LinkedIn',
    category: 'Connection Request',
    subject: 'LinkedIn Note (max 300 chars)',
    body: `Hi {FirstName}, saw your work heading {CompanyName}. We help UK property management leaders streamline tenant triage & operational workflows with AI. Would love to connect here on LinkedIn!`
  },
  {
    id: 'li_followup_1',
    title: 'LinkedIn DM / InMail (Post-Acceptance)',
    channel: 'LinkedIn',
    category: 'Follow-up',
    subject: 'Thanks for connecting',
    body: `Hi {FirstName}, thanks for connecting! 

Saw that {CompanyName} is active in {BusinessModel}. We've been implementing automated resident triage and viewing workflows for UK property managers that cut inquiry response time by 80%.

Curious if automating tenant queries or maintenance triage is on your roadmap this quarter?`
  },
  {
    id: 'email_followup_1',
    title: 'Email Follow-up #1: Value Add & Case Example',
    channel: 'Email',
    category: 'Follow-up',
    subject: 'Re: Streamlining {CompanyName} resident ops & inquiries',
    body: `Hi {FirstName},

Following up on my note from earlier this week.

One of the common issues property managers face is high volumes of repetitive inquiries ({LikelyAutomationSnippet}) burying the property management desk.

We built automated pipelines that filter and draft replies instantly, synchronizing with your existing CRM and PMS.

Are you free for a quick 10-min intro call next week?

Best,
Fil`
  },
  {
    id: 'email_breakup',
    title: 'Email Follow-up #2: Permission to Close the Loop',
    channel: 'Email',
    category: 'Follow-up',
    subject: 'Closing the loop on {CompanyName}',
    body: `Hi {FirstName},

I haven't heard back, so I assume automated resident triage and operations isn't a priority for {CompanyName} right now.

I'll stop following up for now so I don't clutter your inbox. If things change down the road and you'd like to explore how UK property managers are cutting maintenance overhead, feel free to reach out anytime!

Best of luck with your portfolio,
Fil`
  }
];

export default function TemplatesModal({ 
  isOpen, 
  onClose, 
  selectedCompany = null,
  selectedContact = null
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('email_cold_1');
  const [copied, setCopied] = useState(false);

  const contact = selectedContact || (selectedCompany?.contacts && selectedCompany.contacts[0]) || { name: 'There' };
  const firstName = contact.name ? contact.name.split(' ')[0] : 'there';
  const companyName = selectedCompany?.name || '{Company}';
  const businessModel = selectedCompany?.businessModel || 'residential property management';
  const likelyAutomation = selectedCompany?.automationOpportunities 
    ? `particularly around ${selectedCompany.automationOpportunities.toLowerCase()}` 
    : 'particularly around resident comms and maintenance';

  const currentTemplate = TEMPLATES.find(t => t.id === activeTab) || TEMPLATES[0];

  const renderedSubject = currentTemplate.subject
    .replace(/{CompanyName}/g, companyName)
    .replace(/{FirstName}/g, firstName)
    .replace(/{BusinessModel}/g, businessModel)
    .replace(/{LikelyAutomationSnippet}/g, likelyAutomation);

  const renderedBody = currentTemplate.body
    .replace(/{CompanyName}/g, companyName)
    .replace(/{FirstName}/g, firstName)
    .replace(/{BusinessModel}/g, businessModel)
    .replace(/{LikelyAutomationSnippet}/g, likelyAutomation);

  const copyText = async (text) => {
    const ok = await copyTextUtil(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">UK Property Outreach Scripts & Templates</h3>
              <p className="text-xs text-slate-400">
                Personalized for: <strong className="text-indigo-300">{firstName}</strong> at <strong className="text-white">{companyName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Template Selector Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1.5 overflow-y-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
              Select Template
            </span>

            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex flex-col cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase flex items-center space-x-1 ${
                    t.channel === 'LinkedIn' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {t.channel === 'LinkedIn' ? <LinkedinIcon className="w-2.5 h-2.5 mr-0.5" /> : null}
                    <span>{t.channel}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{t.category}</span>
                </div>
                <span className="font-medium text-slate-200 line-clamp-1">{t.title}</span>
              </button>
            ))}
          </div>

          {/* Template Preview & Actions Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{currentTemplate.title}</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyText(`${renderedSubject ? `Subject: ${renderedSubject}\n\n` : ''}${renderedBody}`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              {renderedSubject && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Subject Line
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-white flex items-center justify-between">
                    <span>{renderedSubject}</span>
                    <button
                      onClick={() => copyText(renderedSubject)}
                      className="text-slate-400 hover:text-white text-[11px] p-1 cursor-pointer"
                      title="Copy subject only"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Message Body
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                  {renderedBody}
                </div>
              </div>

            </div>

            {/* Bottom Target Context */}
            {selectedCompany && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-indigo-300">Target Contact:</span> {contact.name} ({contact.email || 'No email'}, {contact.linkedinUrl ? 'LinkedIn listed' : 'No LI'})
                </div>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(renderedBody)}`}
                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium text-[11px] flex items-center space-x-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Open in Mail Client</span>
                  </a>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
