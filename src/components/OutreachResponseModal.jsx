import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  Mail,
  Send,
  Sparkles,
  AlignLeft,
  Code2,
} from 'lucide-react';

/**
 * Safe clipboard write with fallback for non-secure contexts
 */
async function safeCopyToClipboard(text) {
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to execCommand
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
    throw new Error('Clipboard access denied');
  }
}

/**
 * Helper to parse outreach response into structured email/touchpoint assets if present
 */
function parseOutreachAssets(text) {
  if (!text) return { assets: [] };

  const assets = [];

  // Match Initial Cold Email (Task 4)
  const coldEmailMatch = text.match(/(?:4\.?\s*Cold Outreach Strategy[^\n]*\n+|Initial Email[^\n]*\n+)([\s\S]*?)(?=(?:\n+5\.|\n+Follow-Up Strategy|\n+###|\n+---|$))/i);
  if (coldEmailMatch) {
    const raw = coldEmailMatch[1].trim();
    const subjMatch = raw.match(/Subject:\s*([^\n]+)/i);
    const subject = subjMatch ? subjMatch[1].trim() : '';
    const body = subjMatch ? raw.replace(/Subject:\s*[^\n]+\n*/i, '').trim() : raw;
    if (body) {
      assets.push({
        type: 'initial_email',
        title: 'Initial Cold Email',
        subject,
        body,
        full: subject ? `Subject: ${subject}\n\n${body}` : body,
      });
    }
  }

  // Match Follow-Up Email (Task 5)
  const followUpMatch = text.match(/(?:5\.?\s*Follow-Up Strategy[^\n]*\n+|Value Asset Email[^\n]*\n+)([\s\S]*?)(?=(?:\n+6\.|\n+Break-Up Strategy|\n+Final Close-Out|\n+###|\n+---|$))/i);
  if (followUpMatch) {
    const raw = followUpMatch[1].trim();
    const subjMatch = raw.match(/Subject:\s*([^\n]+)/i);
    const subject = subjMatch ? subjMatch[1].trim() : '';
    const body = subjMatch ? raw.replace(/Subject:\s*[^\n]+\n*/i, '').trim() : raw;
    if (body) {
      assets.push({
        type: 'followup_email',
        title: 'Follow-Up Email (Calculator)',
        subject,
        body,
        full: subject ? `Subject: ${subject}\n\n${body}` : body,
      });
    }
  }

  // Match Break-Up Email (Task 6)
  const breakUpMatch = text.match(/(?:6\.?\s*Break-Up Strategy[^\n]*\n+|Final Close-Out Email[^\n]*\n+)([\s\S]*?)(?=(?:\n+7\.|\n+LinkedIn Touchpoint|\n+###|\n+---|$))/i);
  if (breakUpMatch) {
    const raw = breakUpMatch[1].trim();
    const subjMatch = raw.match(/Subject:\s*([^\n]+)/i);
    const subject = subjMatch ? subjMatch[1].trim() : '';
    const body = subjMatch ? raw.replace(/Subject:\s*[^\n]+\n*/i, '').trim() : raw;
    if (body) {
      assets.push({
        type: 'breakup_email',
        title: 'Break-Up Email (Close-Out)',
        subject,
        body,
        full: subject ? `Subject: ${subject}\n\n${body}` : body,
      });
    }
  }

  // Match LinkedIn Touchpoint (Task 7)
  const linkedInMatch = text.match(/(?:7\.?\s*LinkedIn Touchpoint[^\n]*\n+)([\s\S]*?)(?=(?:\n+8\.|\n+Playbook Execution|\n+Handling Pre-Booking|\n+###|\n+---|$))/i);
  if (linkedInMatch) {
    const raw = linkedInMatch[1].trim();
    if (raw) {
      assets.push({
        type: 'linkedin',
        title: 'LinkedIn Message',
        subject: '',
        body: raw,
        full: raw,
      });
    }
  }

  return { assets };
}

/**
 * Render a section block with clean formatting for tables, bullets, and emails
 */
function FormattedSection({ content, onCopySnippet, copiedKey, sectionIdx }) {
  const lines = content.trim().split('\n');
  const heading = lines[0].trim();
  const rest = lines.slice(1).join('\n').trim();

  // Check if content contains a tab-separated competitor matrix table
  const tableLines = lines.filter(l => l.includes('\t') || (l.includes('|') && l.includes('---')));
  const isTableSection = tableLines.length >= 2;

  let headers = [];
  let rows = [];
  if (isTableSection) {
    const rawRows = lines.filter(l => l.includes('\t')).map(l => l.split('\t').map(c => c.trim()));
    if (rawRows.length > 1) {
      headers = rawRows[0];
      rows = rawRows.slice(1);
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 min-w-0 max-w-full">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <h3 className="text-sm font-semibold text-slate-100 truncate">{heading}</h3>
        <button
          type="button"
          onClick={() => onCopySnippet(content, `section-${sectionIdx}`)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0 transition-colors"
        >
          {copiedKey === `section-${sectionIdx}` ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>{copiedKey === `section-${sectionIdx}` ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {isTableSection && headers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60 max-w-full">
          <table className="w-full text-left text-xs divide-y divide-slate-800">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3.5 py-2.5 align-top leading-relaxed text-slate-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] select-text min-w-0 max-w-full">
          {rest}
        </div>
      )}
    </div>
  );
}

export default function OutreachResponseModal({
  isOpen,
  isEditing,
  prospect,
  onSave,
  onClose,
  onEdit,
  onDelete,
}) {
  const [draft, setDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewTab, setViewTab] = useState('formatted'); // 'formatted' | 'raw'
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(prospect?.outreach_response || '');
      setCopiedKey(null);
      if (isEditing && textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
  }, [isOpen, isEditing, prospect?.outreach_response]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  const copySnippet = async (text, key) => {
    try {
      await safeCopyToClipboard(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500);
    } catch (err) {
      console.error('Failed to copy snippet:', err);
    }
  };

  const handleSave = async e => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const handleTextareaKeyDown = e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Clear outreach response for ${prospect.company}?`)) {
      setSaving(true);
      try {
        await onDelete();
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  const { assets } = useMemo(() => parseOutreachAssets(prospect?.outreach_response), [prospect?.outreach_response]);

  const sections = useMemo(() => {
    const text = prospect?.outreach_response?.trim();
    if (!text) return [];
    // Split by numbered top-level sections (e.g. "\n1. ", "\n2. ")
    const parts = text.split(/(?=\n\d+\.\s+[^\n]+)/g).map(s => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts : [text];
  }, [prospect?.outreach_response]);

  const stats = useMemo(() => {
    const text = isEditing ? draft : prospect?.outreach_response || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  }, [isEditing, draft, prospect?.outreach_response]);

  if (!isOpen || !prospect) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Outreach response for ${prospect.company}`}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl animate-fade-in overflow-hidden z-10 min-w-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                  {isEditing ? 'Enter Outreach Response' : 'Outreach Response & Playbook'}
                </h2>
                {!isEditing && prospect.outreach_response && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="font-medium text-slate-300">{prospect.company}</span>
                {prospect.website && (
                  <>
                    <span>·</span>
                    <a
                      href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      <span className="truncate">{prospect.website}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!isEditing && prospect.outreach_response && (
              <>
                <button
                  type="button"
                  onClick={() => copySnippet(prospect.outreach_response, 'full')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                  title="Copy full response"
                >
                  {copiedKey === 'full' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{copiedKey === 'full' ? 'Copied' : 'Copy all'}</span>
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                  title="Edit response"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Clear response"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isEditing ? (
          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 min-w-0 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>Paste the response returned by DeepSeek, ChatGPT, or Claude for the outreach prompt:</p>
              <span className="hidden sm:inline text-slate-500">Cmd+Enter to save</span>
            </div>

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={`1. Qualification & Prospect Discovery\n\nExecutive Summary\n• Lead Assessment: ...\n• What they do: ...\n• Key Leaders: ...\n\n4. Cold Outreach Strategy — Initial Email\nSubject: ...\nHi ...`}
              className="flex-1 w-full min-h-[360px] sm:min-h-[440px] p-4 rounded-xl border border-slate-800 bg-slate-900 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none break-words [overflow-wrap:anywhere]"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-500 tabular-nums">
                {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} characters
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !draft.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving…' : 'Save response'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Toolbar / Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewTab('formatted')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                    viewTab === 'formatted'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Formatted View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('raw')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                    viewTab === 'raw'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw Text</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 tabular-nums">
                {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} characters
              </div>
            </div>

            {/* Scrollable Content - Guaranteed no horizontal overflow */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full p-4 sm:p-6 space-y-6">
              {viewTab === 'formatted' ? (
                <>
                  {/* Quick Outreach Asset Cards */}
                  {assets.length > 0 && (
                    <div className="space-y-3 min-w-0 max-w-full">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Quick Outreach Assets</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0 max-w-full">
                        {assets.map((asset, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors min-w-0 max-w-full overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                                {asset.type === 'linkedin' ? (
                                  <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                )}
                                <span className="truncate">{asset.title}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => copySnippet(asset.full, `asset-${idx}`)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0 transition-colors"
                              >
                                {copiedKey === `asset-${idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedKey === `asset-${idx}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            {asset.subject && (
                              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 min-w-0 break-words [overflow-wrap:anywhere]">
                                <span className="font-semibold text-slate-300">Subject: </span>
                                <span className="text-slate-200">{asset.subject}</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                              {asset.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formatted Sections */}
                  <div className="space-y-4 min-w-0 max-w-full">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Full Playbook
                    </div>
                    {sections.map((sectionContent, idx) => (
                      <FormattedSection
                        key={idx}
                        sectionIdx={idx}
                        content={sectionContent}
                        onCopySnippet={copySnippet}
                        copiedKey={copiedKey}
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* Raw Text Tab */
                <div className="space-y-2 min-w-0 max-w-full">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] select-text min-w-0 max-w-full">
                    {prospect.outreach_response}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
