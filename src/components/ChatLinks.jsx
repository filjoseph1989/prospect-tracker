import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, X, AlertCircle } from 'lucide-react';

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// Fallback label when none is typed, e.g. "https://www.chat.deepseek.com/a/1" -> "chat.deepseek.com"
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Saved links to AI chat results (DeepSeek etc.) for one prospect
export default function ChatLinks({ prospectId }) {
  const [links, setLinks] = useState(null);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    request(`/api/prospects/${prospectId}/chat-links`)
      .then(setLinks)
      .catch(err => {
        setLinks([]);
        setError(`Could not load links: ${err.message}`);
      });
  }, [prospectId]);

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const link = await request(`/api/prospects/${prospectId}/chat-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, label }),
      });
      setLinks(prev => [...prev, link]);
      setUrl('');
      setLabel('');
      setAdding(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async link => {
    setError(null);
    try {
      await request(`/api/prospects/${prospectId}/chat-links/${link.id}`, { method: 'DELETE' });
      setLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      setError(`Could not remove link: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">AI chat links</div>

      {adding ? (
        <form onSubmit={save} className="space-y-2">
          <input
            type="url"
            required
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://chat.deepseek.com/…"
            className="w-full px-2 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional), e.g. DeepSeek verify"
            maxLength={255}
            className="w-full px-2 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="px-3 py-1.5 rounded-md border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add AI chat link</span>
        </button>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {links === null ? (
        <div className="mt-2 text-[11px] text-slate-500">Loading links…</div>
      ) : (
        links.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {links.map(link => (
              <li key={link.id} className="flex items-center gap-2 text-xs">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 min-w-0 text-indigo-400 hover:text-indigo-300"
                  title={link.url}
                >
                  <span className="truncate">{link.label || hostOf(link.url)}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <span className="shrink-0 text-[10px] text-slate-500">
                  {new Date(link.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => remove(link)}
                  className="ml-auto shrink-0 p-0.5 rounded text-slate-500 hover:text-rose-400"
                  title="Remove link"
                  aria-label={`Remove link ${link.label || link.url}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
