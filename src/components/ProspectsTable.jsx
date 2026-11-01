import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronDown, ExternalLink, AlertCircle, X, Copy, Check, Pencil, Plus } from 'lucide-react';
import ChatLinks from './ChatLinks';
import OutreachResponseModal from './OutreachResponseModal';

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
1. What they do: In 1-2 plain sentences, summarize what the business actually does, their core operations, and who their clients are.
2. Lead assessment: Classify clearly as "Potential client" (good fit for workflow automation: active UK property/asset/ops business, roughly 20-80 staff or £2M-£25M turnover), "Disqualified" (wrong industry, software vendor/competitor, solo operator, massive enterprise, closed, or bad data), or "Unsure".
3. Key Leaders: Identify key decision makers (CEO, Managing Director, Founder, COO, Operations Director, Owner, Head of Property/Lettings) with their names, exact titles, and public LinkedIn profile or contact link. Note whether the contact from our list matches or if better senior decision makers were found.
4. Website & Trading: Does the link load and belong to this company? Any signs the company has closed, been acquired, or rebranded (check Companies House if you can)?
5. Observation: Confirm each claim in the observation on their website today. Mark each claim Confirmed, Not found, or Contradicted.
6. Fit: Verify if they match UK-based with roughly 20–80 employees or £2M–£25M turnover.

RULES
- Only use information you actually found. Give the URL for every fact.
- If you cannot open the website or browse the web, say so clearly. Do not guess or fill gaps from memory.

ANSWER IN THIS FORMAT
--- EXECUTIVE SUMMARY (LEAD & LEADERSHIP) ---
Lead Assessment: Potential client / Disqualified / Unsure
What they do: [1-2 concise sentences explaining what the business does and who they serve]
Why / Fit rationale: [1 sentence explaining why they are a potential client or why disqualified]

Key Leaders (Decision Makers):
- [Name] | [Title/Role, e.g. CEO / Managing Director / Ops Director] | [LinkedIn URL or public contact link]
- [Name] | [Title/Role] | [LinkedIn URL or public contact link]

--- VERIFICATION DETAILS ---
Verdict: Verified / Bad data / Unsure
Website: Live and correct / Problem (explain)
Trading status: Active / Acquired / Closed / Unknown (explain)
Fit criteria: Still fits / Doesn't fit (explain size, UK base, headcount/turnover)
Observation claims:
- <claim> | Confirmed / Not found / Contradicted | <URL>
Row contact match: Correct / Wrong / Unconfirmed (explain, with corrected details if found)
Safe details to use in my email: bullet list of facts confirmed on their site today`;
}

/** 
 * Safe clipboard write with fallback for non-secure contexts (e.g. plain HTTP on LAN or custom domain)
 */
async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let successful = false;
  try {
    successful = document.execCommand('copy');
  } catch {
    successful = false;
  } finally {
    document.body.removeChild(textarea);
  }

  if (!successful) {
    throw new Error('Clipboard access denied or unsupported');
  }
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
  const [selectedId, setSelectedId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [outreachModal, setOutreachModal] = useState({ isOpen: false, isEditing: false });
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Looked up from the full list so the panel stays open even if a filter hides the row
  const selected = prospects.find(p => p.id === selectedId);

  useEffect(() => {
    if (selectedId == null) return;
    const onKeyDown = e => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    // Retry so a briefly unavailable API (e.g. nodemon restart) doesn't leave the option buttons empty
    const loadOptions = (url, setOptions, label, attempt = 1) => {
      fetch(url)
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
        .then(options => !cancelled && setOptions(options))
        .catch(err => {
          if (cancelled) return;
          if (attempt < 5) timers.push(setTimeout(() => loadOptions(url, setOptions, label, attempt + 1), attempt * 1000));
          else setSaveError(`Could not load ${label} options: ${err.message}`);
        });
    };
    loadOptions('/api/statuses', setStatusOptions, 'status');
    loadOptions('/api/classifications', setClassificationOptions, 'classification');
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
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

  const handleSaveOutreachResponse = async text => {
    if (!selected) return;
    await saveField(selected, 'outreach_response', text, 'outreach-response', 'outreach_response');
    setOutreachModal({ isOpen: true, isEditing: false });
  };

  const handleDeleteOutreachResponse = async () => {
    if (!selected) return;
    await saveField(selected, 'outreach_response', '', 'outreach-response', 'outreach_response');
  };

  const handleCopyOutreachResponse = async text => {
    try {
      await copyToClipboard(text);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 1500);
    } catch (err) {
      setSaveError(`Could not copy response: ${err.message}`);
    }
  };

  // kind tells the UI which control to show the "copied" tick on
  const copyText = async (prospect, kind, getText) => {
    setSaveError(null);
    try {
      const text = await getText();
      await copyToClipboard(text);
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
            {rows.map(p => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                aria-selected={p.id === selectedId}
                className={`prospect-row hover:bg-slate-800/60 cursor-pointer align-top ${p.id === selectedId ? 'bg-slate-800/60' : ''} ${p.classification === 'Disqualified' ? 'prospect-row--disqualified' : ''}`}
              >
                <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{p.rank}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-100">{p.company}</span>
                    {p.outreach_response && (
                      <span
                        title="Outreach response saved"
                        className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0"
                      >
                        Outreach
                      </span>
                    )}
                  </div>
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
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-12 text-center text-slate-400">
                  No prospects match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80 animate-fade-in" onClick={() => setSelectedId(null)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selected.company}`}
            className="relative w-full max-w-xl h-full overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl animate-slide-in-right">
            <div className="sticky top-0 flex items-start gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-100">{selected.company}</div>
                {selected.website && (
                  <a
                    href={websiteUrl(selected.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300">
                    <span>{selected.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Close (Esc)">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Classification</div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Classification for ${selected.company}`}>
                  {classificationOptions.map(c => {
                    const active = (selected.classification || 'Unclassified') === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={active}
                        disabled={savingIds.has(selected.id)}
                        onClick={() => !active && changeClassification(selected, c)}
                        className={`px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                          active ? `${CLASSIFICATION_STYLES[c]} font-semibold` : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}>
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
                    copied={isCopied(selected, 'verify')}
                    disabled={!selected.website}
                    title={selected.website ? undefined : 'No website for this company'}
                    onClick={() => copyVerifyPrompt(selected)}
                  />
                  <PromptButton
                    label="Copy outreach prompt"
                    copied={isCopied(selected, 'outreach')}
                    onClick={() => copyPrompt(selected)}
                  />
                </div>
              </div>
              <ChatLinks key={selected.id} prospectId={selected.id} />

              {/* Outreach response section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Outreach response
                    </div>
                    {selected.outreach_response && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Saved
                      </span>
                    )}
                  </div>
                  {selected.outreach_response && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyOutreachResponse(selected.outreach_response)}
                        className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 inline-flex items-center gap-1 border border-transparent hover:border-slate-700"
                        title="Copy full response"
                      >
                        {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutreachModal({ isOpen: true, isEditing: true })}
                        className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 inline-flex items-center gap-1 border border-transparent hover:border-slate-700"
                        title="Edit response"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>

                {selected.outreach_response ? (
                  <button
                    type="button"
                    onClick={() => setOutreachModal({ isOpen: true, isEditing: false })}
                    className="w-full py-1.5 px-3 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open full response view</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOutreachModal({ isOpen: true, isEditing: true })}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-indigo-500/5 text-xs text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter prompt outreach response</span>
                  </button>
                )}
              </div>
              <Detail label="Observation (from source)">{selected.observation}</Detail>
              <Detail label="Inference (our assessment)">{selected.inference}</Detail>
              <Detail label="Contact">{selected.contact}</Detail>
              <Detail label="Source">{selected.source}</Detail>
              <Detail label="Date contacted">{selected.date_contacted}</Detail>
              <Detail label="Reply / notes">{selected.reply_notes}</Detail>
              <Detail label="Next step">{selected.next_step}</Detail>
            </div>
          </aside>
        </div>
      )}
      {selected && (
        <OutreachResponseModal
          isOpen={outreachModal.isOpen}
          isEditing={outreachModal.isEditing}
          prospect={selected}
          onSave={handleSaveOutreachResponse}
          onClose={() => setOutreachModal(prev => ({ ...prev, isOpen: false }))}
          onEdit={() => setOutreachModal({ isOpen: true, isEditing: true })}
          onDelete={handleDeleteOutreachResponse}
        />
      )}
    </div>
  );
}
