import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronDown, ChevronRight, ExternalLink, AlertCircle, X, Copy, Check } from 'lucide-react';
import ChatLinks from './ChatLinks';

const COLUMNS = [
  { key: 'rank', label: '#', className: 'w-12 text-center' },
  { key: 'company', label: 'Company', className: 'min-w-[200px]' },
  { key: 'segment', label: 'Segment', className: 'min-w-[140px]' },
  { key: 'location', label: 'Location', className: 'min-w-[130px]' },
  { key: 'max_revenue_m', label: 'Est. revenue', className: 'w-28' },
  { key: 'fit', label: 'Fit', className: 'w-14 text-center' },
  { key: 'evidence', label: 'Ev.', className: 'w-12 text-center' },
  { key: 'suggested_service', label: 'Suggested service', className: 'min-w-[220px]' },
  { key: 'outreach_status', label: 'Status', className: 'w-40' },
];

export const FIT_STYLES = {
  5: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  4: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  3: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  2: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

// Empty values always sort last, whichever direction is active
function compare(a, b, field, asc) {
  const va = a[field];
  const vb = b[field];
  const emptyA = va == null || va === '';
  const emptyB = vb == null || vb === '';
  if (emptyA || emptyB) return emptyA - emptyB;
  const diff = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
  return asc ? diff : -diff;
}

function websiteUrl(website) {
  if (!website) return '';
  return /^https?:\/\//.test(website) ? website : `https://${website}`;
}

// The "Input Company" line gets the full details; the rest of the prompt just needs the name
function buildPrompt(template, prospect) {
  const details = [
    prospect.website && `website: ${prospect.website}`,
    prospect.location && `location: ${prospect.location}`,
    prospect.segment && `segment: ${prospect.segment}`,
  ].filter(Boolean);
  const fullName = details.length ? `${prospect.company} (${details.join(', ')})` : prospect.company;
  return template
    .replaceAll('Input Company: [COMPANY-NAME]', `Input Company: ${fullName}`)
    .replaceAll('[COMPANY-NAME]', prospect.company);
}

// Prompt for an AI with web access (DeepSeek etc.) to check the row against the live website
function buildVerifyPrompt(prospect) {
  const field = (label, value) => `${label}: ${value || '(not provided)'}`;
  return `You are a careful research assistant. Verify the company below against its live website before I contact them.

COMPANY DATA FROM MY LIST
${field('Company', prospect.company)}
${field('Website', websiteUrl(prospect.website))}
${field('Location', prospect.location)}
${field('Segment', prospect.segment)}
${field('Estimated revenue', prospect.est_revenue)}
${field('Contact', prospect.contact)}
${field('Observation', prospect.observation)}
${field('Source of observation', prospect.source)}
${field('Evidence grade', prospect.evidence)} (A = seen on their own site, B = from third-party directories and may be out of date)

WHAT TO CHECK
1. Website: Does the link load, and does it belong to this company (not a parked domain, redirect to another business, or a closed/archived site)?
2. Still trading: Any signs the company has closed, been acquired, or rebranded? Check Companies House if you can.
3. Observation: Confirm each claim in the observation on their website today. Mark each claim Confirmed, Not found, or Contradicted.
4. Contact details: Do the contact name, role, email and phone match what the website (or LinkedIn) shows today?
5. Fit: Is it still UK-based with roughly 20–80 employees or £2M–£25M turnover?

RULES
- Only use information you actually found. Give the URL for every fact.
- If you cannot open the website or browse the web, say so clearly. Do not guess or fill gaps from memory.

ANSWER IN THIS FORMAT
Verdict: Verified / Bad data / Unsure
Reason: one or two sentences
Website: Live and correct / Problem (explain)
Observation claims:
- <claim> | Confirmed / Not found / Contradicted | <URL>
Contact details: Correct / Wrong / Unconfirmed (explain, with the corrected details if found)
Fit: Still fits / Doesn't fit (explain)
Safe details to use in my email: bullet list of facts confirmed on their site today`;
}

function PromptButton({ label, copied, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
        copied ? STATUS_STYLES['Call booked'] : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
      }`}
      {...rest}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function Detail({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}

const STATUS_STYLES = {
  'Not contacted': 'bg-slate-800 border-slate-700 text-slate-300',
  'Verified': 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  'Contacted': 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  'Replied': 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  'Call booked': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  'Handed to Panu': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-semibold',
  'Not interested': 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  'Bad data': 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

const CLASSIFICATION_STYLES = {
  'Unclassified': 'bg-slate-800 border-slate-700 text-slate-300',
  'Potential client': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  'Disqualified': 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

// Native select arrows can't be padded, so hide them and draw our own chevron inset from the edge
function FilterSelect({ value, onChange, children, compact = false, tone = 'border-slate-700 bg-slate-900 text-slate-200', ...rest }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full appearance-none border text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-60 ${tone} ${
          compact ? 'pl-2 pr-7 py-1 rounded-md' : 'pl-3 pr-9 py-2 rounded-lg'
        }`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className={`text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${compact ? 'w-3.5 h-3.5 right-2' : 'w-4 h-4 right-3'}`} />
    </div>
  );
}

export default function ProspectsTable({ prospects, onProspectsChange }) {
  const [statusOptions, setStatusOptions] = useState([]);
  const [classificationOptions, setClassificationOptions] = useState([]);
  const [savingIds, setSavingIds] = useState(new Set());
  const [saveError, setSaveError] = useState(null);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [minFit, setMinFit] = useState('');
  const [evidence, setEvidence] = useState('');
  const [sortField, setSortField] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetch('/api/statuses')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then(setStatusOptions)
      .catch(err => setSaveError(`Could not load status options: ${err.message}`));
    fetch('/api/classifications')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then(setClassificationOptions)
      .catch(err => setSaveError(`Could not load classification options: ${err.message}`));
  }, []);

  const setProspectField = (id, field, value) => {
    onProspectsChange(list => list.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Optimistic: show the new value straight away, roll back if the save fails
  const saveField = async (prospect, field, value, path, bodyKey) => {
    const previous = prospect[field];
    setSaveError(null);
    setProspectField(prospect.id, field, value);
    setSavingIds(prev => new Set(prev).add(prospect.id));
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      setProspectField(prospect.id, field, previous);
      setSaveError(`Could not update ${prospect.company}: ${err.message}`);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(prospect.id);
        return next;
      });
    }
  };

  const changeStatus = (prospect, status) => saveField(prospect, 'outreach_status', status, 'status', 'status');
  const changeClassification = (prospect, classification) =>
    saveField(prospect, 'classification', classification, 'classification', 'classification');

  // kind tells the UI which control to show the "copied" tick on
  const copyText = async (prospect, kind, getText) => {
    setSaveError(null);
    try {
      await navigator.clipboard.writeText(await getText());
      const copiedNow = { id: prospect.id, kind };
      setCopied(copiedNow);
      setTimeout(() => setCopied(c => (c === copiedNow ? null : c)), 1500);
    } catch (err) {
      setSaveError(`Could not copy prompt for ${prospect.company}: ${err.message}`);
    }
  };

  const copyPrompt = prospect =>
    copyText(prospect, 'outreach', async () => {
      const res = await fetch('/api/prompt-template');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      return buildPrompt(await res.text(), prospect);
    });

  const copyVerifyPrompt = prospect => copyText(prospect, 'verify', () => buildVerifyPrompt(prospect));

  const isCopied = (prospect, kind) => copied?.id === prospect.id && copied.kind === kind;

  const segments = useMemo(
    () => [...new Set(prospects.map(p => p.segment).filter(Boolean))].sort(),
    [prospects]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = prospects.filter(p => {
      if (segment && p.segment !== segment) return false;
      if (minFit && (p.fit ?? 0) < Number(minFit)) return false;
      if (evidence && p.evidence !== evidence) return false;
      if (!q) return true;
      return [p.company, p.location, p.website, p.contact, p.suggested_service, p.observation]
        .some(v => (v || '').toLowerCase().includes(q));
    });
    return filtered.sort((a, b) => compare(a, b, sortField, sortAsc));
  }, [prospects, search, segment, minFit, evidence, sortField, sortAsc]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      // Bigger is better for fit and revenue, so start those descending
      setSortAsc(!['fit', 'max_revenue_m'].includes(field));
    }
  };

  const toggleRow = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, location, contact, service…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <FilterSelect value={segment} onChange={setSegment}>
          <option value="">All segments</option>
          {segments.map(s => <option key={s} value={s}>{s}</option>)}
        </FilterSelect>
        <FilterSelect value={minFit} onChange={setMinFit}>
          <option value="">Any fit</option>
          <option value="5">Fit 5</option>
          <option value="4">Fit 4+</option>
          <option value="3">Fit 3+</option>
        </FilterSelect>
        <FilterSelect value={evidence} onChange={setEvidence}>
          <option value="">Any evidence</option>
          <option value="A">Evidence A</option>
          <option value="B">Evidence B</option>
        </FilterSelect>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-700 bg-rose-950/60 text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{saveError}</span>
          <button onClick={() => setSaveError(null)} className="p-1 rounded hover:bg-rose-900/60" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-2 w-8" />
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-3 px-3 cursor-pointer hover:text-white select-none ${col.className}`}
                >
                  <div className={`flex items-center space-x-1 ${col.className.includes('text-center') ? 'justify-center' : ''}`}>
                    <span>{col.label}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === col.key ? 'text-indigo-400' : ''}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map(p => {
              const isOpen = expanded.has(p.id);
              return (
                <React.Fragment key={p.id}>
                  <tr onClick={() => toggleRow(p.id)} className={`prospect-row hover:bg-slate-800/60 cursor-pointer align-top ${p.classification === 'Disqualified' ? 'prospect-row--disqualified' : ''}`}>
                    <td className="py-3 px-2 text-slate-500">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{p.rank}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-100">{p.company}</div>
                      {p.website && (
                        <a
                          href={websiteUrl(p.website)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          <span>{p.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.segment}</td>
                    <td className="py-3 px-3 text-slate-300">{p.location}</td>
                    <td className="py-3 px-3 text-slate-300 tabular-nums">{p.est_revenue}</td>
                    <td className="py-3 px-3 text-center">
                      {p.fit != null && (
                        <span className={`inline-block px-2 py-0.5 rounded-md border font-bold ${FIT_STYLES[p.fit] || FIT_STYLES[2]}`}>
                          {p.fit}
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${p.evidence === 'A' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {p.evidence}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.suggested_service}</td>
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                      <FilterSelect
                        compact
                        value={p.outreach_status}
                        onChange={status => changeStatus(p, status)}
                        disabled={savingIds.has(p.id) || statusOptions.length === 0}
                        tone={STATUS_STYLES[p.outreach_status] || STATUS_STYLES['Not contacted']}
                        aria-label={`Outreach status for ${p.company}`}
                      >
                        {/* Keep a status from an older import selectable even if it's not in today's list */}
                        {[...new Set([...statusOptions, p.outreach_status])].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </FilterSelect>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-950/40">
                      <td />
                      <td colSpan={COLUMNS.length} className="py-4 px-3">
                        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-6">
                          <div className="space-y-4">
                            <Detail label="Observation (from source)">{p.observation}</Detail>
                            <Detail label="Inference (our assessment)">{p.inference}</Detail>
                            <Detail label="Contact">{p.contact}</Detail>
                            <Detail label="Source">{p.source}</Detail>
                            <Detail label="Date contacted">{p.date_contacted}</Detail>
                            <Detail label="Reply / notes">{p.reply_notes}</Detail>
                            <Detail label="Next step">{p.next_step}</Detail>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Classification</div>
                              <div className="flex flex-wrap gap-2" role="group" aria-label={`Classification for ${p.company}`}>
                                {classificationOptions.map(c => {
                                  const active = (p.classification || 'Unclassified') === c;
                                  return (
                                    <button
                                      key={c}
                                      type="button"
                                      aria-pressed={active}
                                      disabled={savingIds.has(p.id)}
                                      onClick={() => !active && changeClassification(p, c)}
                                      className={`px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                                        active ? `${CLASSIFICATION_STYLES[c]} font-semibold` : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'
                                      }`}
                                    >
                                      {c}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Prompts</div>
                              <div className="flex flex-wrap gap-2">
                                <PromptButton
                                  label="Copy verify prompt"
                                  copied={isCopied(p, 'verify')}
                                  disabled={!p.website}
                                  title={p.website ? undefined : 'No website for this company'}
                                  onClick={() => copyVerifyPrompt(p)}
                                />
                                <PromptButton
                                  label="Copy outreach prompt"
                                  copied={isCopied(p, 'outreach')}
                                  onClick={() => copyPrompt(p)}
                                />
                              </div>
                            </div>
                            <ChatLinks prospectId={p.id} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="py-12 text-center text-slate-400">
                  No prospects match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
