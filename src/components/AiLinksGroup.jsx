import React, { useState } from 'react';
import { Plus, X, Pencil, Trash2, Check, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { detectAiPlatform, getAiPlatformConfig } from '../utils/aiLinkUtils';

export default function AiLinksGroup({ 
  company, 
  onSaveAiLink, 
  onDeleteAiLink 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [inputUrl, setInputUrl] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const aiLinks = (company.aiLinks && company.aiLinks.length > 0) 
    ? company.aiLinks 
    : (company.deepseekUrl ? [{ id: `ds_${company.id}`, label: 'DeepSeek', platform: 'deepseek', url: company.deepseekUrl }] : []);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingLinkId(null);
    setInputUrl('');
    setInputLabel('');
  };

  const handleStartEdit = (link) => {
    setEditingLinkId(link.id);
    setIsAdding(false);
    setInputUrl(link.url || '');
    setInputLabel(link.label || '');
  };

  const handleUrlChange = (val) => {
    setInputUrl(val);
    if (!inputLabel || ['DeepSeek', 'Gemini', 'ChatGPT', 'Claude', 'Perplexity', 'AI Chat'].includes(inputLabel)) {
      const detected = detectAiPlatform(val);
      setInputLabel(detected.defaultLabel);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let cleanUrl = inputUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const detected = detectAiPlatform(cleanUrl);
    const label = inputLabel.trim() || detected.defaultLabel;
    const platform = detected.platform;

    try {
      setSaving(true);
      await onSaveAiLink(company.id, {
        id: editingLinkId || `ai_${Date.now()}`,
        url: cleanUrl,
        label,
        platform
      });
      setIsAdding(false);
      setEditingLinkId(null);
      setInputUrl('');
      setInputLabel('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId) => {
    try {
      setSaving(true);
      await onDeleteAiLink(company.id, linkId);
      setIsAdding(false);
      setEditingLinkId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inline-flex items-center space-x-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {/* Existing AI Links */}
      {aiLinks.map((link) => {
        const config = getAiPlatformConfig(link.platform || detectAiPlatform(link.url).platform);
        const isCurrentlyEditing = editingLinkId === link.id;

        if (isCurrentlyEditing) {
          return (
            <form
              key={link.id}
              onSubmit={handleSubmit}
              className={`inline-flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border ${config.activeBorder} shadow-xl z-20`}
            >
              <input
                type="text"
                placeholder="AI Chat URL (Gemini, DeepSeek, etc.)"
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <input
                type="text"
                placeholder="Label"
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white placeholder-slate-500 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(link.id)}
                className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] cursor-pointer"
                title="Remove this AI link"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLinkId(null);
                  setInputUrl('');
                }}
                className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          );
        }

        return (
          <div
            key={link.id}
            className={`inline-flex items-center rounded-lg border shadow-sm overflow-hidden group ${config.colorClass}`}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 flex items-center transition-all"
              title={`Open ${link.label || 'AI'} Research Chat`}
            >
              {config.icon}
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                {link.label || config.label}
              </span>
            </a>
            <button
              type="button"
              onClick={() => handleStartEdit(link)}
              className={`px-1.5 py-1.5 opacity-60 hover:opacity-100 border-l border-slate-700/60 cursor-pointer transition-all ${config.textColor}`}
              title={`Edit ${link.label || 'AI'} link`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add New AI Link Form or Button */}
      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="inline-flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-indigo-500/60 shadow-xl z-20"
        >
          <input
            type="text"
            placeholder="Paste AI URL (Gemini, DeepSeek, etc.)"
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="Label (e.g. Gemini)"
            value={inputLabel}
            onChange={(e) => setInputLabel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white placeholder-slate-500 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
          >
            {saving ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setInputUrl('');
            }}
            className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={handleStartAdd}
          className="group p-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-950/80 text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700 hover:border-indigo-500/50 flex items-center cursor-pointer transition-all shadow-sm"
          title={aiLinks.length === 0 ? "Add AI Intelligence Link (DeepSeek, Gemini, ChatGPT, etc.)" : "Add Another AI Link"}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400/80 group-hover:text-indigo-300 shrink-0" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
            + AI Link
          </span>
        </button>
      )}
    </div>
  );
}
