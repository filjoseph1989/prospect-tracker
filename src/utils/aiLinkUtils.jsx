import React from 'react';
import { Bot, Sparkles, Zap, MessageSquare } from 'lucide-react';

export function detectAiPlatform(url = '') {
  const lower = (url || '').toLowerCase();
  if (lower.includes('gemini.google.com') || lower.includes('gemini')) {
    return { platform: 'gemini', defaultLabel: 'Gemini' };
  }
  if (lower.includes('deepseek.com')) {
    return { platform: 'deepseek', defaultLabel: 'DeepSeek' };
  }
  if (lower.includes('chatgpt.com') || lower.includes('openai.com')) {
    return { platform: 'chatgpt', defaultLabel: 'ChatGPT' };
  }
  if (lower.includes('claude.ai') || lower.includes('anthropic.com')) {
    return { platform: 'claude', defaultLabel: 'Claude' };
  }
  if (lower.includes('perplexity.ai')) {
    return { platform: 'perplexity', defaultLabel: 'Perplexity' };
  }
  return { platform: 'custom', defaultLabel: 'AI Chat' };
}

export function getAiPlatformConfig(platform = 'custom') {
  switch (platform) {
    case 'gemini':
      return {
        label: 'Gemini',
        colorClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60 hover:bg-purple-900',
        activeBorder: 'border-purple-500/60',
        textColor: 'text-purple-400',
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      };
    case 'deepseek':
      return {
        label: 'DeepSeek',
        colorClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60 hover:bg-blue-900',
        activeBorder: 'border-blue-500/60',
        textColor: 'text-blue-400',
        icon: <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      };
    case 'chatgpt':
      return {
        label: 'ChatGPT',
        colorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900',
        activeBorder: 'border-emerald-500/60',
        textColor: 'text-emerald-400',
        icon: <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      };
    case 'claude':
      return {
        label: 'Claude',
        colorClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900',
        activeBorder: 'border-amber-500/60',
        textColor: 'text-amber-400',
        icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      };
    case 'perplexity':
      return {
        label: 'Perplexity',
        colorClass: 'bg-teal-950/80 text-teal-300 border-teal-700/60 hover:bg-teal-900',
        activeBorder: 'border-teal-500/60',
        textColor: 'text-teal-400',
        icon: <Bot className="w-3.5 h-3.5 text-teal-400 shrink-0" />
      };
    default:
      return {
        label: 'AI Chat',
        colorClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900',
        activeBorder: 'border-indigo-500/60',
        textColor: 'text-indigo-400',
        icon: <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      };
  }
}
