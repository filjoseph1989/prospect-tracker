import React from 'react';
import { ShieldAlert } from 'lucide-react';

// Shared building blocks for the document-style pages (/brief, /summary)

// Labels for rules a freelancer must not break get a warning accent
const CAUTION_LABEL = /^(do not|keep internal|important limitation)/i;

// Renders sheet cell text: blank lines split paragraphs, "• " lines become bullets, "1. " lines a numbered list
export function RichText({ text }) {
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

// A label/body row: label on the left, text on the right (stacked on mobile)
export function LabelledItem({ label, body }) {
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

export function PageHero({ eyebrow, title, intro, children }) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-purple-500/10">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-2">{eyebrow}</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
      {intro && <p className="mt-3 text-sm text-slate-300 max-w-3xl leading-relaxed">{intro}</p>}
      {children}
    </div>
  );
}

// sections: [{ id, number, title }]
export function ContentsNav({ sections }) {
  return (
    <nav className="hidden lg:block sticky top-24 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contents</div>
      {sections.map(section => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="flex gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <span className="w-4 text-right font-semibold text-indigo-400">{section.number}</span>
          <span>{section.title}</span>
        </a>
      ))}
    </nav>
  );
}

export function SectionCard({ id, number, title, aside, children }) {
  return (
    <section id={id} className="scroll-mt-24 p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-3 mb-2">
        {number && (
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            {number}
          </span>
        )}
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

// Hero, then a sticky contents list beside the section cards
export function DocPage({ hero, sections, children }) {
  return (
    <div className="space-y-6">
      {hero}
      <div className="grid lg:grid-cols-[14rem_1fr] gap-6 items-start">
        <ContentsNav sections={sections} />
        <div className="space-y-6 min-w-0">{children}</div>
      </div>
    </div>
  );
}
