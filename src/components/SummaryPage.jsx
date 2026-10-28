import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { DocPage, PageHero, SectionCard, LabelledItem } from './DocLayout';
import { FIT_STYLES } from './ProspectsTable';

const TONES = {
  good: { icon: CheckCircle2, className: 'text-emerald-400' },
  warn: { icon: AlertTriangle, className: 'text-amber-400' },
  bad: { icon: XCircle, className: 'text-rose-400' },
};

const FIT_BARS = { 5: 'bg-emerald-500', 4: 'bg-sky-500', 3: 'bg-amber-500', 2: 'bg-slate-500' };

const SECTIONS = [
  { id: 'summary-checks', number: '1', title: 'Checks' },
  { id: 'summary-fit', number: '2', title: 'Fit score' },
  { id: 'summary-segments', number: '3', title: 'Segments' },
  { id: 'summary-outreach', number: '4', title: 'Outreach progress' },
  { id: 'summary-notes', number: '5', title: 'How the list was built' },
];

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function Bar({ count, total, fill = 'bg-indigo-500' }) {
  return (
    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${percent(count, total)}%` }} />
    </div>
  );
}

function CountCell({ count, total }) {
  return (
    <div className="text-right tabular-nums">
      <span className="text-sm font-bold text-white">{count}</span>
      <span className="ml-1.5 text-[11px] text-slate-500">{percent(count, total)}%</span>
    </div>
  );
}

function CheckTile({ label, value, tone }) {
  const Tone = tone && TONES[tone];
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] text-slate-400 leading-snug">{label}</span>
        {Tone && <Tone.icon className={`w-4 h-4 shrink-0 ${Tone.className}`} />}
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

export default function SummaryPage({ summary }) {
  const { total } = summary;
  const contacted = summary.statuses
    .filter(s => s.status !== 'Not contacted')
    .reduce((sum, s) => sum + s.count, 0);
  const [section1, section2, section3, section4, section5] = SECTIONS;

  return (
    <DocPage
      hero={
        <PageHero
          eyebrow="List summary"
          title={summary.title}
          intro="Counts are calculated live from the prospects list, so they update as outreach statuses change."
        >
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              [`${total}`, 'companies'],
              [`${summary.segments.length}`, 'segments'],
              [`${contacted} of ${total}`, 'worked on'],
            ].map(([value, label]) => (
              <span key={label} className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-slate-700 text-slate-300">
                <span className="font-bold text-white">{value}</span> {label}
              </span>
            ))}
          </div>
        </PageHero>
      }
      sections={SECTIONS}
    >
      <SectionCard {...section1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {summary.checks.map(check => <CheckTile key={check.label} {...check} />)}
        </div>
      </SectionCard>

      <SectionCard {...section2}>
        <div className="divide-y divide-slate-800/80">
          {summary.fit.map(({ score, count, meaning }) => (
            <div key={score} className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[3rem_10rem_1fr_5rem] items-center gap-x-4 gap-y-2 py-4">
              <span className={`w-9 text-center px-2 py-1 rounded-md border text-sm font-bold ${FIT_STYLES[score] || FIT_STYLES[2]}`}>
                {score}
              </span>
              <div className="md:order-none order-last col-span-3 md:col-span-1">
                <Bar count={count} total={total} fill={FIT_BARS[score]} />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{meaning}</p>
              <CountCell count={count} total={total} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard {...section3}>
        <div className="space-y-3 mt-3">
          {summary.segments.map(({ segment, count }) => (
            <div key={segment} className="grid grid-cols-[1fr_auto] md:grid-cols-[14rem_1fr_5rem] items-center gap-x-4 gap-y-1.5">
              <span className="text-sm text-slate-200">{segment}</span>
              <div className="col-span-2 md:col-span-1 order-last md:order-none">
                <Bar count={count} total={total} />
              </div>
              <CountCell count={count} total={total} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard {...section4} aside={<span className="text-xs text-slate-400">{contacted} of {total} worked on</span>}>
        <div className="space-y-3 mt-3">
          {summary.statuses.map(({ status, count }) => (
            <div key={status} className="grid grid-cols-[1fr_auto] md:grid-cols-[14rem_1fr_5rem] items-center gap-x-4 gap-y-1.5">
              <span className={`text-sm ${count ? 'text-slate-200' : 'text-slate-500'}`}>{status}</span>
              <div className="col-span-2 md:col-span-1 order-last md:order-none">
                <Bar count={count} total={total} fill={status === 'Not contacted' ? 'bg-slate-500' : 'bg-indigo-500'} />
              </div>
              <CountCell count={count} total={total} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard {...section5} title={summary.notesTitle || section5.title}>
        <div className="divide-y divide-slate-800/80">
          {summary.notes.map(note => <LabelledItem key={note.label} {...note} />)}
        </div>
      </SectionCard>
    </DocPage>
  );
}
