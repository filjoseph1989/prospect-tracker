import React from 'react';
import { Ban } from 'lucide-react';
import { DocPage, PageHero, SectionCard, LabelledItem } from './DocLayout';

// The sheet has no category column, so rows are grouped by keywords in their reason (first match wins)
const GROUPS = [
  { id: 'excluded-systemised', title: 'Already has booking or ordering software', match: /online booking|books via its website|web shop/i },
  { id: 'excluded-too-large', title: 'Too large or part of a bigger group', match: /above|larger group|acquired/i },
  { id: 'excluded-too-small', title: 'Too small', match: /too small/i },
  { id: 'excluded-different', title: 'Different line of business', match: /now a .*company/i },
  { id: 'excluded-not-checked', title: 'Not checked', match: /not checked/i },
  { id: 'excluded-other', title: 'Other', match: /.*/ },
];

function groupCompanies(companies) {
  const groupOf = row => GROUPS.find(g => g.match.test(row.reason));
  return GROUPS
    .map(group => ({ ...group, rows: companies.filter(row => groupOf(row) === group) }))
    .filter(group => group.rows.length > 0)
    .map((group, idx) => ({ ...group, number: String(idx + 1) }));
}

export default function ExcludedPage({ excluded }) {
  const [heading, ...instruction] = excluded.title.split(':');
  const note = instruction.join(':').trim();
  const groups = groupCompanies(excluded.companies);

  return (
    <DocPage
      hero={
        <PageHero
          eyebrow="Excluded companies"
          title={heading.trim()}
          intro="Companies that were reviewed for the list and left out, grouped by the reason they were excluded."
        >
          {note && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-sm font-semibold text-rose-300">
              <Ban className="w-4 h-4 shrink-0" />
              <span>{note.charAt(0).toUpperCase() + note.slice(1)}</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map(group => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-slate-700 text-slate-300 hover:text-white"
              >
                <span className="font-bold text-white">{group.rows.length}</span> {group.title.toLowerCase()}
              </a>
            ))}
          </div>
        </PageHero>
      }
      sections={groups}
    >
      {groups.map(group => (
        <SectionCard
          key={group.id}
          id={group.id}
          number={group.number}
          title={group.title}
          aside={<span className="text-xs text-slate-400">{group.rows.length} {group.rows.length === 1 ? 'row' : 'rows'}</span>}
        >
          <div className="divide-y divide-slate-800/80">
            {group.rows.map(row => <LabelledItem key={row.company} label={row.company} body={row.reason} />)}
          </div>
        </SectionCard>
      ))}
    </DocPage>
  );
}
