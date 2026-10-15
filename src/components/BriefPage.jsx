import React from 'react';
import { AlertTriangle, ArrowRight, Mail, ShieldAlert } from 'lucide-react';

// Labels for rules a freelancer must not break get a warning accent
const CAUTION_LABEL = /^(do not|keep internal|important limitation)/i;

function splitSectionTitle(title) {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  return match ? { number: match[1], text: match[2] } : { number: '', text: title };
}

function sectionAnchor(title) {
  return `brief-${splitSectionTitle(title).number || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// Renders sheet cell text: blank lines split paragraphs, "• " lines become bullets, "1. " lines a numbered list
function RichText({ text }) {
  return (
    <div className="space-y-3">
      {text.split(/\n\s*\n/).map((block, blockIdx) => {
        const groups = [];
        block.split('\n').forEach(line => {
          const kind = /^•\s/.test(line) ? 'ul' : /^\d+\.\s/.test(line) ? 'ol' : 'p';
          const content = kind === 'p' ? line : line.replace(/^(•|\d+\.)\s+/, '');
          const last = groups[groups.length - 1];
          if (kind !== 'p' && last?.kind === kind) {
            last.lines.push(content);
          } else {
            groups.push({ kind, lines: [content] });
          }
        });

        return (
          <React.Fragment key={blockIdx}>
            {groups.map((group, groupIdx) => {
              if (group.kind === 'p') {
                return <p key={groupIdx} className="leading-relaxed">{group.lines[0]}</p>;
              }
              const ListTag = group.kind;
              return (
                <ListTag
                  key={groupIdx}
                  className={`space-y-1.5 pl-5 ${group.kind === 'ul' ? 'list-disc marker:text-indigo-400' : 'list-decimal marker:text-indigo-400 marker:font-semibold'}`}
                >
                  {group.lines.map((line, i) => <li key={i} className="leading-relaxed pl-1">{line}</li>)}
                </ListTag>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
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

function BriefItem({ label, body }) {
  const caution = CAUTION_LABEL.test(label);
  const stepMatch = label.match(/^(Step \d+|\d+)[.:]\s*(.*)$/);

  return (
    <div className={`grid md:grid-cols-[13rem_1fr] gap-2 md:gap-6 py-4 ${caution ? 'px-4 -mx-4 rounded-xl bg-rose-500/10' : ''}`}>
      <div className="flex items-start gap-2">
        {caution && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
        {stepMatch ? (
          <div className="space-y-1">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300">
              {stepMatch[1]}
            </span>
            <div className="text-sm font-semibold text-white">{stepMatch[2]}</div>
          </div>
        ) : (
          <div className={`text-sm font-semibold ${caution ? 'text-rose-300' : 'text-white'}`}>{label}</div>
        )}
      </div>
      <div className="text-sm text-slate-300">
        <RichText text={body} />
      </div>
    </div>
  );
}

function BriefSection({ section }) {
  const { number, text } = splitSectionTitle(section.title);
  const segments = section.items.filter(item => /\nLead with:/.test(item.body));
  const others = section.items.filter(item => !segments.includes(item));

  return (
    <section id={sectionAnchor(section.title)} className="scroll-mt-24 p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-3 mb-2">
        {number && (
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            {number}
          </span>
        )}
        <h2 className="text-lg font-bold text-white tracking-tight">{text}</h2>
      </div>

      <div className="divide-y divide-slate-800/80">
        {others.map((item, idx) => (
          item.body.startsWith('Subject:')
            ? <div key={idx} className="py-4"><EmailExample {...item} /></div>
            : <BriefItem key={idx} {...item} />
        ))}
      </div>

      {segments.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {segments.map(item => <SegmentCard key={item.label} {...item} />)}
        </div>
      )}
    </section>
  );
}

export default function BriefPage({ brief }) {
  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-purple-500/10">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-2">Outreach brief</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{brief.title}</h1>
        <p className="mt-3 text-sm text-slate-300 max-w-3xl leading-relaxed">{brief.intro}</p>
      </div>

      <div className="grid lg:grid-cols-[14rem_1fr] gap-6 items-start">
        <nav className="hidden lg:block sticky top-24 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contents</div>
          {brief.sections.map(section => {
            const { number, text } = splitSectionTitle(section.title);
            return (
              <a
                key={section.title}
                href={`#${sectionAnchor(section.title)}`}
                className="flex gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <span className="w-4 text-right font-semibold text-indigo-400">{number}</span>
                <span>{text}</span>
              </a>
            );
          })}
        </nav>

        <div className="space-y-6 min-w-0">
          {brief.sections.map(section => <BriefSection key={section.title} section={section} />)}
        </div>
      </div>
    </div>
  );
}
