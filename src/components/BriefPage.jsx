import React from 'react';
import { AlertTriangle, ArrowRight, Mail } from 'lucide-react';
import { DocPage, PageHero, SectionCard, LabelledItem } from './DocLayout';

function splitSectionTitle(title) {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  return match ? { number: match[1], text: match[2] } : { number: '', text: title };
}

function sectionAnchor(title) {
  return `brief-${splitSectionTitle(title).number || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// Section 5 rows: label lists segments, body is "Often messy: …\nLead with: …"
function SegmentCard({ label, body }) {
  const [messy, lead] = body.split(/\n(?=Lead with:)/);
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {label.split('\n').map(segment => (
          <span key={segment} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {segment}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        {messy.replace(/^Often messy:\s*/, '')}
      </p>
      {lead && (
        <div className="mt-auto flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 leading-relaxed">{lead.replace(/^Lead with:\s*/, '')}</p>
        </div>
      )}
    </div>
  );
}

function EmailExample({ label, body }) {
  const [title, ...warning] = label.split('\n');
  const [subjectLine, ...rest] = body.split('\n');
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      {warning.length > 0 && (
        <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{warning.join(' ')}</span>
        </div>
      )}
      <div className="rounded-xl border border-slate-700 bg-slate-950/60 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 text-xs">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-200">{subjectLine.replace(/^Subject:\s*/, '')}</span>
        </div>
        <div className="px-4 py-4 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {rest.join('\n').trim()}
        </div>
      </div>
    </div>
  );
}

function BriefSection({ section }) {
  const { number, text } = splitSectionTitle(section.title);
  const segments = section.items.filter(item => /\nLead with:/.test(item.body));
  const others = section.items.filter(item => !segments.includes(item));

  return (
    <SectionCard id={sectionAnchor(section.title)} number={number} title={text}>
      <div className="divide-y divide-slate-800/80">
        {others.map((item, idx) => (
          item.body.startsWith('Subject:')
            ? <div key={idx} className="py-4"><EmailExample {...item} /></div>
            : <LabelledItem key={idx} {...item} />
        ))}
      </div>

      {segments.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {segments.map(item => <SegmentCard key={item.label} {...item} />)}
        </div>
      )}
    </SectionCard>
  );
}

export default function BriefPage({ brief }) {
  const contents = brief.sections.map(section => {
    const { number, text } = splitSectionTitle(section.title);
    return { id: sectionAnchor(section.title), number, title: text };
  });

  return (
    <DocPage
      hero={<PageHero eyebrow="Outreach brief" title={brief.title} intro={brief.intro} />}
      sections={contents}
    >
      {brief.sections.map(section => <BriefSection key={section.title} section={section} />)}
    </DocPage>
  );
}
