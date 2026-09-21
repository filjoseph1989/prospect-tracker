import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Mail, 
  Copy, 
  Check, 
  Users, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  ArrowRight, 
  Plus, 
  UserPlus, 
  X, 
  Pencil,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Bell,
  Clock,
  Globe,
  Trash2,
  Sun,
  Moon,
  BarChart3,
  FileText,
  Briefcase
} from 'lucide-react';
import LinkedinIcon from './components/LinkedinIcon';
import CompanyDetailModal from './components/CompanyDetailModal';
import FollowupNotificationModal from './components/FollowupNotificationModal';
import ContactTimeline from './components/ContactTimeline';
import AiLinksGroup from './components/AiLinksGroup';
import ReportsView from './components/ReportsView';
import { getPromptForCompany } from './utils/promptTemplate';
import { getTodayDateStr, addDaysToDate, getRelativeFollowupInfo, getCompanyActivityInfo, formatDisplayDate } from './utils/dateUtils';
import { copyToClipboard as copyText } from './utils/clipboard';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prospect_tracker_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('prospect_tracker_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900', 'light');
      document.body.classList.add('bg-slate-950', 'text-slate-100', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 4 Core Workflow Navigation Pages:
  // 'todo' | 'in-review' | 'qualified' | 'disqualified' | 'all'
  const [activeTab, setActiveTab] = useState('todo');

  // Channel Mode: 'email' (Mail) | 'linkedin' (LinkedIn)
  const [activeChannel, setActiveChannel] = useState(() => {
    return localStorage.getItem('prospect_tracker_channel') || 'email';
  });

  const handleChannelChange = (channel) => {
    setActiveChannel(channel);
    localStorage.setItem('prospect_tracker_channel', channel);
  };

  // Search & State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSetter, setActiveSetter] = useState('Fil');
  const [copiedText, setCopiedText] = useState(null);

  // Add Contact State
  const [addingContactCompanyId, setAddingContactCompanyId] = useState(null);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    role: '',
    email: '',
    linkedinUrl: ''
  });
  const [savingContact, setSavingContact] = useState(false);

  // Edit Contact State
  const [editingContactId, setEditingContactId] = useState(null);
  const [editContactForm, setEditContactForm] = useState({ name: '', role: '', email: '', linkedinUrl: '' });
  const [savingEditContact, setSavingEditContact] = useState(false);

  // DeepSeek URL Edit State
  const [editingDeepseekCompanyId, setEditingDeepseekCompanyId] = useState(null);
  const [deepseekInputUrl, setDeepseekInputUrl] = useState('');
  const [savingDeepseek, setSavingDeepseek] = useState(false);

  // Website URL Edit State
  const [editingWebsiteCompanyId, setEditingWebsiteCompanyId] = useState(null);
  const [websiteInputUrl, setWebsiteInputUrl] = useState('');
  const [savingWebsite, setSavingWebsite] = useState(false);

  // Company Notes Edit State
  const [editingNoteCompanyId, setEditingNoteCompanyId] = useState(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Copy Prompt State
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  // Dedicated single-company view modal
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Follow-up Notifications State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Card Collapse / Expand State (Empty Set = Collapsed by default)
  const [expandedCompanyIds, setExpandedCompanyIds] = useState(new Set());
  const [highlightedCompanyId, setHighlightedCompanyId] = useState(null);

  // Bulk Company Selection State
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Reset bulk selection on tab switch
  useEffect(() => {
    setSelectedCompanyIds(new Set());
    setLastSelectedId(null);
  }, [activeTab]);

  const toggleCompanyExpanded = (companyId) => {
    setExpandedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (expandedCompanyIds.size === filteredProspects.length && filteredProspects.length > 0) {
      setExpandedCompanyIds(new Set());
    } else {
      setExpandedCompanyIds(new Set(filteredProspects.map(p => p.id)));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Request browser desktop notifications
  const handleEnableDesktopNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setDesktopNotificationsEnabled(true);
          showToast('🔔 Desktop notifications enabled!');
        } else {
          showToast('Notifications permission was not granted', 'error');
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  // Trigger browser notification for urgent follow-up
  const notifyDesktopFollowup = (contact, company) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(`⏰ Follow-up Due: ${contact.name}`, {
          body: `${company.name} • Stage: ${company.stage}\nEmail: ${contact.email || 'None'}`,
          icon: '/favicon.ico',
        });
        n.onclick = () => {
          window.focus();
          setSelectedCompanyId(company.id);
        };
      } catch (e) {
        console.error('Desktop notification error:', e);
      }
    }
  };

  // Fetch prospects from DB API
  const fetchProspects = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`${API_BASE}/prospects`);
      if (!res.ok) throw new Error('Failed to fetch prospects');
      const data = await res.json();
      setProspects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      if (showLoading) setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Active Polling Interval (re-fetches every 30 seconds for live updates)
  useEffect(() => {
    fetchProspects(true);
    const interval = setInterval(() => {
      fetchProspects(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update company stage / move between pages (channel-aware: Mail vs LinkedIn)
  const handleMoveStage = async (companyId, newStage, setter = activeSetter, channel = activeChannel) => {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const stageField = channel === 'email' ? 'emailStage' : 'linkedinStage';
    const updates = {
      [stageField]: newStage,
      workedBy: setter,
      lastContactDate: today,
      updatedAt: nowIso
    };

    // Optimistic UI update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update stage');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));

      const company = prospects.find(p => p.id === companyId);
      const name = company ? company.name : 'Company';
      const channelLabel = channel === 'email' ? 'Mail' : 'LinkedIn';

      if (newStage === 'Qualified') {
        showToast(`🎯 Moved ${name} to Qualified (${channelLabel})!`);
      } else if (newStage === 'Disqualified') {
        showToast(`🚫 Moved ${name} to Disqualified (${channelLabel})`);
      } else if (newStage === 'In Review' || newStage === 'In Progress') {
        showToast(`⚡ Moved ${name} to In Review (${channelLabel} by ${setter})`);
      } else {
        showToast(`📋 Moved ${name} to To Do (${channelLabel})`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to move company stage', 'error');
      fetchProspects(); // Rollback
    }
  };

  const copyToClipboard = async (text, id) => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Quick 1-click Mark Prospect as Checked Today
  const handleMarkCompanyChecked = async (companyId, setter = activeSetter) => {
    const today = getTodayDateStr();
    const nowIso = new Date().toISOString();
    const updates = {
      workedBy: setter,
      lastContactDate: today,
      updatedAt: nowIso
    };

    // Optimistic UI update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));
    const targetComp = prospects.find(p => p.id === companyId);
    showToast(`🕒 Marked ${targetComp ? targetComp.name : 'account'} as checked today by ${setter}`);

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update company');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
    } catch (err) {
      console.error(err);
      fetchProspects();
    }
  };

  // Add key person / decision maker to company
  const handleAddContact = async (companyId, customData = null) => {
    const dataToSend = customData || newContactForm;
    if (!dataToSend.name || !dataToSend.name.trim()) {
      showToast('Please enter a contact name', 'error');
      return null;
    }

    try {
      setSavingContact(true);
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dataToSend.name.trim(),
          role: dataToSend.role?.trim() || 'Key Decision Maker',
          email: dataToSend.email?.trim() || '',
          linkedinUrl: dataToSend.linkedinUrl?.trim() || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to add contact');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      showToast(`👤 Added ${dataToSend.name.trim()} to ${updatedCompany.name}!`);
      setAddingContactCompanyId(null);
      setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to add contact', 'error');
      return null;
    } finally {
      setSavingContact(false);
    }
  };

  // Delete contact / decision maker
  const handleDeleteContact = async (companyId, contactId, contactName = '') => {
    if (!window.confirm(`Are you sure you want to delete ${contactName || 'this contact'}?`)) {
      return null;
    }

    try {
      // Optimistic update
      setProspects(prev => prev.map(p => {
        if (p.id !== companyId) return p;
        return { ...p, contacts: (p.contacts || []).filter(c => c.id !== contactId) };
      }));

      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      showToast(`🗑️ Removed ${contactName || 'contact'}`);
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to delete contact', 'error');
      fetchProspects();
      return null;
    }
  };

  // Save edited contact fields (name, role, email, linkedinUrl)
  const handleSaveEditedContact = async (companyId, contactId, formData = null) => {
    const data = formData || editContactForm;
    if (!data.name || !data.name.trim()) {
      showToast('Contact name is required', 'error');
      return null;
    }

    try {
      setSavingEditContact(true);
      const updates = {
        name: data.name.trim(),
        role: data.role?.trim() || 'Key Decision Maker',
        email: data.email?.trim() || '',
        linkedinUrl: data.linkedinUrl?.trim() || ''
      };

      // Optimistic update
      setProspects(prev => prev.map(p => {
        if (p.id !== companyId) return p;
        const updatedContacts = (p.contacts || []).map(c => {
          if (c.id !== contactId) return c;
          return { ...c, ...updates };
        });
        return { ...p, contacts: updatedContacts };
      }));

      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update contact');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      showToast(`✓ Updated ${data.name.trim()}`);
      setEditingContactId(null);
      setEditContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to update contact', 'error');
      fetchProspects();
      return null;
    } finally {
      setSavingEditContact(false);
    }
  };

  // Update Contact Status (Email, LinkedIn, Appointment, etc.)
  const handleUpdateContactStatus = async (companyId, contactId, updates) => {
    try {
      // Optimistic update
      setProspects(prev => prev.map(p => {
        if (p.id !== companyId) return p;
        const updatedContacts = (p.contacts || []).map(c => {
          if (c.id !== contactId) return c;
          return { ...c, ...updates };
        });
        return { ...p, contacts: updatedContacts };
      }));

      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update contact status');
      const updatedCompany = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));

      if (updates.emailStatus) {
        showToast(`✉️ Email status updated: ${updates.emailStatus}`);
      } else if (updates.linkedinStatus) {
        showToast(`🤝 LinkedIn status updated: ${updates.linkedinStatus}`);
      }
      return updatedCompany;
    } catch (err) {
      console.error(err);
      showToast('Failed to update contact status', 'error');
      fetchProspects();
      return null;
    }
  };

  // Smart Email Status Change with automatic date & follow-up tracking
  const handleEmailStatusChange = (companyId, contact, newStatus) => {
    const today = getTodayDateStr();
    let updates = { emailStatus: newStatus };

    if (newStatus === 'Sent') {
      updates.emailLastContactDate = today;
      if (!contact.emailSentDate) updates.emailSentDate = today;
      if (!contact.nextFollowupDate) updates.nextFollowupDate = addDaysToDate(3);
    } else if (newStatus === 'Follow-up 1') {
      updates.emailLastContactDate = today;
      updates.emailFollowup1Date = today;
      updates.nextFollowupDate = addDaysToDate(4);
    } else if (newStatus === 'Follow-up 2') {
      updates.emailLastContactDate = today;
      updates.emailFollowup2Date = today;
      updates.nextFollowupDate = '';
    } else if (newStatus === 'Replied' || newStatus === 'Bounced' || newStatus === 'No Email Found') {
      updates.nextFollowupDate = '';
    }

    return handleUpdateContactStatus(companyId, contact.id, updates);
  };

  // Reorder contact up or down
  const handleMoveContactOrder = async (companyId, contactIndex, direction) => {
    const targetCompany = prospects.find(p => p.id === companyId);
    if (!targetCompany || !targetCompany.contacts) return;
    const currentContacts = [...targetCompany.contacts];
    const targetIndex = direction === 'up' ? contactIndex - 1 : contactIndex + 1;

    if (targetIndex < 0 || targetIndex >= currentContacts.length) return;

    // Swap
    const temp = currentContacts[contactIndex];
    currentContacts[contactIndex] = currentContacts[targetIndex];
    currentContacts[targetIndex] = temp;

    const orderedIds = currentContacts.map(c => c.id);

    // Optimistic state update
    setProspects(prev => prev.map(p => {
      if (p.id !== companyId) return p;
      return { ...p, contacts: currentContacts };
    }));

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedContactIds: orderedIds })
      });
      if (!res.ok) throw new Error('Failed to save contact order');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      showToast('↕️ Reordered decision makers');
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to reorder contacts', 'error');
      fetchProspects(); // Rollback
      return null;
    }
  };

  // Save or Edit an AI Link (DeepSeek, Gemini, ChatGPT, Claude, etc.)
  const handleSaveAiLink = async (companyId, newLink) => {
    const targetComp = prospects.find(p => p.id === companyId);
    if (!targetComp) return null;

    const currentLinks = targetComp.aiLinks && targetComp.aiLinks.length > 0
      ? [...targetComp.aiLinks]
      : (targetComp.deepseekUrl ? [{ id: `ds_${targetComp.id}`, label: 'DeepSeek', platform: 'deepseek', url: targetComp.deepseekUrl }] : []);

    const existingIdx = currentLinks.findIndex(l => l.id === newLink.id);
    let updatedLinks;
    if (existingIdx >= 0) {
      updatedLinks = currentLinks.map(l => l.id === newLink.id ? newLink : l);
    } else {
      updatedLinks = [...currentLinks, newLink];
    }

    const updates = {
      aiLinks: updatedLinks,
      deepseekUrl: updatedLinks.find(l => l.platform === 'deepseek')?.url || ''
    };

    // Optimistic update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));
    showToast(`🤖 ${newLink.label || 'AI'} link saved!`);

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update AI link');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to save AI link', 'error');
      fetchProspects();
      return null;
    }
  };

  // Delete an AI Link
  const handleDeleteAiLink = async (companyId, linkId) => {
    const targetComp = prospects.find(p => p.id === companyId);
    if (!targetComp) return null;

    const currentLinks = targetComp.aiLinks && targetComp.aiLinks.length > 0
      ? targetComp.aiLinks
      : (targetComp.deepseekUrl ? [{ id: `ds_${targetComp.id}`, label: 'DeepSeek', platform: 'deepseek', url: targetComp.deepseekUrl }] : []);

    const updatedLinks = currentLinks.filter(l => l.id !== linkId);
    const updates = {
      aiLinks: updatedLinks,
      deepseekUrl: updatedLinks.find(l => l.platform === 'deepseek')?.url || ''
    };

    // Optimistic update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));
    showToast('AI link removed');

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to delete AI link');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to delete AI link', 'error');
      fetchProspects();
      return null;
    }
  };

  // Update / Add / Clear DeepSeek Research Link
  const handleSaveDeepseekUrl = async (companyId, url) => {
    const cleanUrl = (url || '').trim();
    try {
      setSavingDeepseek(true);
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deepseekUrl: cleanUrl })
      });
      if (!res.ok) throw new Error('Failed to update DeepSeek link');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      showToast(cleanUrl ? '⚡ DeepSeek research link saved!' : 'DeepSeek link removed');
      setEditingDeepseekCompanyId(null);
      setDeepseekInputUrl('');
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to save DeepSeek link', 'error');
      return null;
    } finally {
      setSavingDeepseek(false);
    }
  };

  // Update / Add / Clear Company Website Link
  const handleSaveWebsiteUrl = async (companyId, url) => {
    let cleanUrl = (url || '').trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    try {
      setSavingWebsite(true);
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: cleanUrl })
      });
      if (!res.ok) throw new Error('Failed to update company website');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      showToast(cleanUrl ? '🌐 Company website saved!' : 'Company website removed');
      setEditingWebsiteCompanyId(null);
      setWebsiteInputUrl('');
      return updated;
    } catch (err) {
      console.error(err);
      showToast('Failed to save company website', 'error');
      return null;
    } finally {
      setSavingWebsite(false);
    }
  };

  // Start Editing Company Notes
  const handleStartEditNote = (companyId, currentNote = '') => {
    setEditingNoteCompanyId(companyId);
    setNoteInputText(currentNote || '');
  };

  // Save / Clear Company Note
  const handleSaveCompanyNote = async (companyId) => {
    const cleanNote = (noteInputText || '').trim();
    setSavingNote(true);

    const nowIso = new Date().toISOString();
    const updates = {
      notes: cleanNote,
      updatedAt: nowIso
    };

    // Optimistic update
    setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));
    showToast(cleanNote ? '📝 Note saved successfully!' : 'Note cleared');

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to save company note');
      const updated = await res.json();
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      setEditingNoteCompanyId(null);
      setNoteInputText('');
    } catch (err) {
      console.error(err);
      showToast('Failed to save note', 'error');
      fetchProspects();
    } finally {
      setSavingNote(false);
    }
  };

  // Copy Prompt Template with auto-injected Company Name
  const handleCopyPrompt = async (companyName, companyId) => {
    try {
      const filledPrompt = getPromptForCompany(companyName);
      const ok = await copyText(filledPrompt);
      if (ok) {
        setCopiedPromptId(companyId);
        showToast(`✨ Research prompt for "${companyName}" copied to clipboard!`);
        setTimeout(() => setCopiedPromptId(null), 2500);
      } else {
        showToast('Failed to copy to clipboard', 'error');
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleExportCSV = (tab = null) => {
    const targetTab = tab !== undefined && tab !== null ? tab : (activeTab !== 'reports' && activeTab !== 'all' ? activeTab : null);
    const channelParam = `channel=${encodeURIComponent(activeChannel)}`;
    const query = targetTab ? `?tab=${encodeURIComponent(targetTab)}&${channelParam}` : `?${channelParam}`;
    const label = targetTab ? (targetTab === 'qualified' ? 'Qualified' : targetTab.charAt(0).toUpperCase() + targetTab.slice(1)) : 'All';
    const channelLabel = activeChannel === 'email' ? 'Mail' : 'LinkedIn';

    const link = document.createElement('a');
    link.href = `${API_BASE}/export/csv${query}`;
    link.setAttribute('download', `${activeChannel}_${targetTab ? `${targetTab}_` : ''}prospects.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Downloading ${channelLabel} ${label} prospects to CSV...`);
  };

  // Helper to categorize company into 1 of the 4 tabs for a given channel:
  // 'todo' | 'in-review' | 'qualified' | 'disqualified'
  const getTabForProspect = (p, channel = activeChannel) => {
    const rawStage = channel === 'email' 
      ? (p.emailStage || p.stage || '') 
      : (p.linkedinStage || p.stage || '');
    const stage = rawStage.trim();
    if (stage === 'Qualified' || stage === 'Done' || stage === 'Appointment Booked' || stage === 'Completed') {
      return 'qualified';
    }
    if (stage === 'Disqualified' || stage === 'Not a Fit' || stage === 'Bounced' || stage === 'Rejected' || stage === 'Lost') {
      return 'disqualified';
    }
    if (stage === 'In Review' || stage === 'In Progress' || stage === 'Follow-Up' || stage === 'Follow-up' || stage === 'Follow-up Due' || stage === 'Follow-up 1' || stage === 'Follow-up 2' || stage === 'Contacted' || stage === 'Email Sent' || stage === 'LinkedIn Pending' || stage === 'LinkedIn Connected' || stage === 'In Discussion') {
      return 'in-review';
    }
    return 'todo';
  };

  // Helper to check if a prospect has at least one valid LinkedIn contact entry / profile URL
  const hasLinkedinEntry = (p) => {
    return (p?.contacts || []).some(c => Boolean(c.linkedinUrl && c.linkedinUrl.trim()));
  };

  // Counts for each of the tabs for the active channel
  const tabCounts = useMemo(() => {
    const counts = { 'todo': 0, 'in-review': 0, 'qualified': 0, 'disqualified': 0, 'all': 0 };
    prospects.forEach(p => {
      // If in LinkedIn channel, only include companies with at least one LinkedIn contact entry
      if (activeChannel === 'linkedin' && !hasLinkedinEntry(p)) return;
      counts.all++;
      const tab = getTabForProspect(p, activeChannel);
      if (counts[tab] !== undefined) counts[tab]++;
    });
    return counts;
  }, [prospects, activeChannel]);

  // Overall counts for both channels (displayed in channel switcher tabs)
  const channelCounts = useMemo(() => {
    const counts = {
      email: { todo: 0, inReview: 0, qualified: 0, disqualified: 0, total: prospects.length },
      linkedin: { todo: 0, inReview: 0, qualified: 0, disqualified: 0, total: 0 }
    };
    prospects.forEach(p => {
      // Mail channel
      const eTab = getTabForProspect(p, 'email');
      if (eTab === 'in-review') counts.email.inReview++;
      else if (counts.email[eTab] !== undefined) counts.email[eTab]++;

      // LinkedIn channel (only companies with LinkedIn contact entry)
      if (hasLinkedinEntry(p)) {
        counts.linkedin.total++;
        const lTab = getTabForProspect(p, 'linkedin');
        if (lTab === 'in-review') counts.linkedin.inReview++;
        else if (counts.linkedin[lTab] !== undefined) counts.linkedin[lTab]++;
      }
    });
    return counts;
  }, [prospects]);

  // Urgent follow-ups count (Overdue or Due Today)
  const urgentFollowupCount = useMemo(() => {
    let count = 0;
    prospects.forEach(p => {
      if (p.stage === 'Disqualified') return;
      (p.contacts || []).forEach(c => {
        if (c.nextFollowupDate && !['Replied', 'Bounced', 'No Email Found'].includes(c.emailStatus)) {
          const info = getRelativeFollowupInfo(c.nextFollowupDate);
          if (info && (info.isOverdue || info.isToday)) {
            count++;
          }
        }
      });
    });
    return count;
  }, [prospects]);

  // Filtered prospects based on active tab, channel, and search
  const filteredProspects = useMemo(() => {
    const list = prospects.filter(p => {
      // If LinkedIn channel, strictly require at least one LinkedIn contact entry
      if (activeChannel === 'linkedin' && !hasLinkedinEntry(p)) {
        return false;
      }

      // 1. Tab filter
      if (activeTab !== 'all') {
        const pTab = getTabForProspect(p, activeChannel);
        if (pTab !== activeTab) return false;
      }

      // 2. Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const modelMatch = (p.businessModel || '').toLowerCase().includes(query);
        const oppMatch = (p.automationOpportunities || '').toLowerCase().includes(query);
        const notesMatch = (p.notes || '').toLowerCase().includes(query);
        const qualMatch = (p.qualification || '').toLowerCase().includes(query);
        const contactMatch = (p.contacts || []).some(c => 
          (c.name || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.role || '').toLowerCase().includes(query) ||
          (c.notes || '').toLowerCase().includes(query)
        );

        if (!nameMatch && !modelMatch && !oppMatch && !notesMatch && !qualMatch && !contactMatch) {
          return false;
        }
      }

      return true;
    });

    // Sorting: In Qualified, In Review, Disqualified, put most recently updated on top!
    if (activeTab === 'qualified' || activeTab === 'in-review' || activeTab === 'disqualified') {
      return [...list].sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0);
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0);
        if (timeB !== timeA) return timeB - timeA;
        return a.rank - b.rank;
      });
    }

    // In To-Do queue or All Prospects: sorted by Rank (#1, #2, #3...)
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [prospects, activeTab, activeChannel, searchTerm]);

  // Selected company object for single modal view
  const selectedCompany = useMemo(() => {
    return prospects.find(p => p.id === selectedCompanyId) || null;
  }, [prospects, selectedCompanyId]);

  const selectedIndexInFiltered = useMemo(() => {
    return filteredProspects.findIndex(p => p.id === selectedCompanyId);
  }, [filteredProspects, selectedCompanyId]);

  const handleNextCompany = () => {
    if (selectedIndexInFiltered < filteredProspects.length - 1) {
      setSelectedCompanyId(filteredProspects[selectedIndexInFiltered + 1].id);
    }
  };

  const handlePrevCompany = () => {
    if (selectedIndexInFiltered > 0) {
      setSelectedCompanyId(filteredProspects[selectedIndexInFiltered - 1].id);
    }
  };

  // Helper selection states for visible filtered prospects
  const isAllFilteredSelected = filteredProspects.length > 0 && filteredProspects.every(p => selectedCompanyIds.has(p.id));
  const isSomeFilteredSelected = filteredProspects.some(p => selectedCompanyIds.has(p.id));

  // Toggle selection for a single company with Shift+Click range support
  const toggleSelectCompany = (companyId, e = null) => {
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      const isSelecting = !prev.has(companyId);

      if (e && e.shiftKey && lastSelectedId) {
        const ids = filteredProspects.map(p => p.id);
        const lastIdx = ids.indexOf(lastSelectedId);
        const currentIdx = ids.indexOf(companyId);

        if (lastIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(lastIdx, currentIdx);
          const end = Math.max(lastIdx, currentIdx);
          for (let i = start; i <= end; i++) {
            if (isSelecting) {
              next.add(ids[i]);
            } else {
              next.delete(ids[i]);
            }
          }
          return next;
        }
      }

      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });

    setLastSelectedId(companyId);
  };

  // Select all or deselect all visible filtered prospects
  const handleToggleSelectAll = () => {
    const visibleIds = filteredProspects.map(p => p.id);
    if (isAllFilteredSelected) {
      setSelectedCompanyIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedCompanyIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Move multiple selected companies to a new stage (To Do, In Review, Qualified, Disqualified)
  const handleBulkMoveStage = async (newStage, targetIds = null) => {
    const ids = targetIds || Array.from(selectedCompanyIds);
    if (!ids || ids.length === 0) return;

    setIsBulkUpdating(true);
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const stageField = activeChannel === 'email' ? 'emailStage' : 'linkedinStage';
    const updates = {
      [stageField]: newStage,
      workedBy: activeSetter,
      lastContactDate: today,
      updatedAt: nowIso
    };

    const idSet = new Set(ids);
    const count = ids.length;

    // Optimistic UI update
    setProspects(prev => prev.map(p => idSet.has(p.id) ? { ...p, ...updates } : p));
    
    // Clear selection for the moved companies
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });

    try {
      // 1. Attempt server bulk endpoint
      const res = await fetch(`${API_BASE}/prospects/bulk-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyIds: ids,
          stage: newStage,
          setter: activeSetter,
          channel: activeChannel
        })
      });

      if (!res.ok) {
        // Fallback to individual updates if the server process has not been restarted yet
        await Promise.all(ids.map(id =>
          fetch(`${API_BASE}/prospects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
        ));
      }

      const stageLabels = {
        'Qualified': '🎯 Qualified',
        'Disqualified': '🚫 Disqualified',
        'In Review': '⚡ In Review',
        'To Do': '📋 To Do'
      };
      const label = stageLabels[newStage] || newStage;
      const channelLabel = activeChannel === 'email' ? 'Mail' : 'LinkedIn';
      showToast(`Moved ${count} ${count === 1 ? 'company' : 'companies'} to ${label} (${channelLabel})!`);
    } catch (err) {
      console.error('Bulk move error:', err);
      showToast('Failed to move selected companies', 'error');
      fetchProspects(false); // Rollback
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Export selected companies to CSV
  const handleExportSelectedCSV = async () => {
    if (selectedCompanyIds.size === 0) return;
    try {
      showToast(`📥 Exporting ${selectedCompanyIds.size} selected companies to CSV...`);
      const res = await fetch(`${API_BASE}/export/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: Array.from(selectedCompanyIds) })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected_prospects_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showToast('Failed to export selected prospects', 'error');
    }
  };

  const getStageBadge = (stage) => {
    const s = (stage || '').trim();
    if (s === 'Qualified' || s === 'Done' || s === 'Appointment Booked' || s === 'Completed') {
      return { text: '🎯 Qualified', bg: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' };
    }
    if (s === 'Disqualified' || s === 'Not a Fit' || s === 'Bounced' || s === 'Rejected' || s === 'Lost') {
      return { text: '🚫 Disqualified', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold' };
    }
    if (s === 'In Review' || s === 'In Progress' || s === 'Follow-Up' || s === 'Follow-up' || s === 'Follow-up Due' || s === 'Contacted' || s === 'Email Sent' || s === 'LinkedIn Pending' || s === 'LinkedIn Connected' || s === 'In Discussion') {
      return { text: '⚡ In Review', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold' };
    }
    return { text: '📋 To Do', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-700'
            : 'bg-indigo-950 text-indigo-200 border-indigo-500 shadow-indigo-500/20'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-base text-white tracking-tight">UK Prospects</h1>
                </div>
                <p className="text-xs text-slate-400">Automation Opportunities</p>
              </div>
            </div>

            {/* Setter Switcher on Mobile */}
            <div className="md:hidden flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400">Setter:</span>
              <select
                value={activeSetter}
                onChange={(e) => setActiveSetter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Fil" className="bg-slate-900 text-white">Fil</option>
                <option value="Panu" className="bg-slate-900 text-white">Panu</option>
                <option value="Team" className="bg-slate-900 text-white">Team</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full md:max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, contact name, email, automation angle, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded px-1.5 py-0.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

            {/* Setter Selector & Notification & Export Buttons */}
            <div className="flex items-center space-x-2.5 shrink-0">
              {/* Follow-up Notification Bell Button */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-sm whitespace-nowrap shrink-0 ${
                  urgentFollowupCount > 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={urgentFollowupCount > 0 ? `${urgentFollowupCount} follow-up(s) due today or overdue` : "Open Follow-up Notification Center"}
              >
                <Bell className={`w-3.5 h-3.5 shrink-0 ${urgentFollowupCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="hidden sm:inline whitespace-nowrap">Follow-ups</span>
                {urgentFollowupCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse shrink-0">
                    {urgentFollowupCount}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
                <span className="text-xs text-slate-400 font-medium">Setter:</span>
                <select
                  value={activeSetter}
                  onChange={(e) => setActiveSetter(e.target.value)}
                  className="bg-slate-900 text-xs font-bold text-indigo-300 border border-slate-700 px-2 py-0.5 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Fil">Fil</option>
                  <option value="Panu">Panu</option>
                  <option value="Team">Team</option>
                </select>
              </div>

              {/* Export Button with Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  title="Export prospects to CSV (Qualified, Current View, or All)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Export CSV</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isExportMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsExportMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        Export to CSV
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleExportCSV('qualified');
                          setIsExportMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-emerald-950/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span>🎯</span>
                          <span className="font-semibold text-emerald-300">Qualified Only</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                          {tabCounts.qualified || 0}
                        </span>
                      </button>

                      {activeTab !== 'qualified' && activeTab !== 'all' && activeTab !== 'reports' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleExportCSV(activeTab);
                            setIsExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center space-x-2">
                            <span>📋</span>
                            <span>Current Tab ({activeTab.charAt(0).toUpperCase() + activeTab.slice(1)})</span>
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {filteredProspects.length}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          handleExportCSV('all');
                          setIsExportMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span>📁</span>
                          <span>{activeChannel === 'linkedin' ? 'All LinkedIn' : 'All Prospects'}</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {tabCounts.all}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle Button (Light / Dark) */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
            </div>

          </div>

        {/* Channel Navigation Switcher: Mail vs LinkedIn */}
        <div className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Channel:</span>
              <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
                {/* 1. Mail Channel Button */}
                <button
                  type="button"
                  onClick={() => handleChannelChange('email')}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChannel === 'email'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Mail</span>
                </button>

                {/* 2. LinkedIn Channel Button */}
                <button
                  type="button"
                  onClick={() => handleChannelChange('linkedin')}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChannel === 'linkedin'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Pipeline Context Tag */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                activeChannel === 'email' ? 'bg-indigo-400' : 'bg-sky-400'
              }`}></span>
              <span>
                Active Mode: <strong className="text-white font-semibold">{activeChannel === 'email' ? 'Email Outreach' : 'LinkedIn Outreach'}</strong>
                {activeChannel === 'linkedin' && (
                  <span className="ml-1.5 text-[11px] text-sky-400 font-medium">
                    ({channelCounts.linkedin.total} with LinkedIn)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Pages / Tabs (To Do, In Review, Qualified, Disqualified, All, Reports) */}
        <div className="border-t border-slate-800/80 bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center overflow-x-auto text-xs no-scrollbar">
            
            {/* The Core Workflow Navigation Pages */}
            <div className="flex items-center space-x-2 py-0.5 shrink-0">
              
              {/* 1. To Do Tab */}
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'todo'
                    ? activeChannel === 'linkedin'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>📋 To Do</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.todo}
                </span>
              </button>

              {/* 2. In Review Tab */}
              <button
                onClick={() => setActiveTab('in-review')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'in-review'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-sky-400 hover:bg-sky-950/40'
                }`}
              >
                <span>⚡ In Review</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts['in-review']}
                </span>
              </button>

              {/* 3. Qualified Tab */}
              <button
                onClick={() => setActiveTab('qualified')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'qualified'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <span>🎯 Qualified</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 text-[10px] font-bold">
                  {tabCounts.qualified}
                </span>
              </button>

              {/* 4. Disqualified Tab */}
              <button
                onClick={() => setActiveTab('disqualified')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'disqualified'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <span>🚫 Disqualified</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.disqualified}
                </span>
              </button>
              {/* All Prospects Option */}
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>📁 All</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-bold">
                  {tabCounts.all}
                </span>
              </button>

              {/* 6. Comprehensive Reports & Analytics Tab */}
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>📊 Reports</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Company List Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading prospects from database...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Error Loading Prospects</h3>
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={fetchProspects}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-600 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : activeTab === 'reports' ? (
          <ReportsView
            prospects={prospects}
            activeSetter={activeSetter}
            onSelectCompany={(companyId) => {
              setSelectedCompanyId(companyId);
            }}
          />
        ) : filteredProspects.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-300 text-base">
              {activeChannel === 'linkedin' && activeTab === 'all'
                ? 'No companies with a LinkedIn profile found.'
                : activeChannel === 'linkedin' && activeTab === 'todo'
                ? '🎉 All caught up! No LinkedIn prospects in the To Do queue.'
                : activeTab === 'todo'
                ? '🎉 All caught up! No companies in the To Do page.'
                : activeTab === 'in-review'
                ? `No companies currently In Review${activeChannel === 'linkedin' ? ' on LinkedIn' : ''}.`
                : activeTab === 'qualified'
                ? `No companies marked as Qualified yet${activeChannel === 'linkedin' ? ' on LinkedIn' : ''}.`
                : activeTab === 'disqualified'
                ? `No companies marked as Disqualified${activeChannel === 'linkedin' ? ' on LinkedIn' : ''}.`
                : 'No companies match your search.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'todo'
                ? 'Check the "In Review" tab to continue outreach, or view "All".'
                : 'Move companies across pages using the dropdown on each card.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium cursor-pointer"
              >
                View All {activeChannel === 'linkedin' ? 'LinkedIn' : ''} Prospects
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Toolbar row with count / multi-selection on left, and actions on right */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 text-xs">
              {/* Left: Select All Checkbox & Count & Inline Stage Movers */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Select All Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer select-none group bg-slate-900/60 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeFilteredSelected && !isAllFilteredSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer accent-indigo-600"
                  />
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                    {selectedCompanyIds.size > 0 ? (
                      <span className="text-indigo-300 font-bold">{selectedCompanyIds.size} of {filteredProspects.length} selected</span>
                    ) : (
                      <span>Select All ({filteredProspects.length})</span>
                    )}
                  </span>
                </label>

                {selectedCompanyIds.size > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyIds(new Set())}
                      className="text-xs text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>

                    <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                    {/* Inline Move Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline mr-0.5">Move to:</span>
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkMoveStage('To Do')}
                        className="px-2.5 py-1 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title={`Move ${selectedCompanyIds.size} selected companies to To Do`}
                      >
                        <span>📋 To Do</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkMoveStage('In Review')}
                        className="px-2.5 py-1 rounded-lg font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center space-x-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title={`Move ${selectedCompanyIds.size} selected companies to In Review`}
                      >
                        <span>⚡ In Review</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkMoveStage('Qualified')}
                        className="px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title={`Move ${selectedCompanyIds.size} selected companies to Qualified`}
                      >
                        <span>🎯 Qualified</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkMoveStage('Disqualified')}
                        className="px-2.5 py-1 rounded-lg font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center space-x-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title={`Move ${selectedCompanyIds.size} selected companies to Disqualified`}
                      >
                        <span>🚫 Disqualified</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    Showing <strong className="text-white font-semibold">{filteredProspects.length}</strong> companies in <strong className={`${activeChannel === 'linkedin' ? 'text-sky-300' : 'text-indigo-300'} uppercase font-bold`}>{activeChannel === 'email' ? 'Mail' : 'LinkedIn'} • {activeTab}</strong>
                  </div>
                )}
              </div>

              {/* Right: Export & Expand/Collapse */}
              <div className="flex items-center space-x-2.5 shrink-0">
                {selectedCompanyIds.size > 0 ? (
                  <button
                    type="button"
                    onClick={handleExportSelectedCSV}
                    className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 cursor-pointer transition-all flex items-center space-x-1.5 font-semibold text-xs shadow-sm"
                    title={`Export ${selectedCompanyIds.size} selected companies to CSV`}
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export Selected ({selectedCompanyIds.size}) to CSV</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExportCSV(activeTab)}
                    className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-1.5 font-semibold text-xs shadow-sm ${
                      activeTab === 'qualified'
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                    title={`Export ${activeTab === 'qualified' ? 'Qualified' : activeTab} (${filteredProspects.length}) to CSV`}
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export {activeTab === 'qualified' ? 'Qualified' : activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} to CSV</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Top Info Banner */}
            {activeTab === 'todo' && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                activeChannel === 'linkedin'
                  ? 'bg-sky-950/40 border-sky-500/30 text-sky-200'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
              }`}>
                <span>
                  🔥 <strong>{activeChannel === 'email' ? 'Mail' : 'LinkedIn'} To Do Queue</strong>: Select <strong>"In Review"</strong>, <strong>"Qualified"</strong>, or <strong>"Disqualified"</strong> in the dropdown to move a company and immediately proceed to the next account.
                </span>
                <span className={`font-mono font-bold ${activeChannel === 'linkedin' ? 'text-sky-300' : 'text-indigo-300'}`}>{filteredProspects.length} remaining</span>
              </div>
            )}

            {/* Prospects Table */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10.5px]">
                      <th className="py-3.5 px-3 w-12 text-center">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="py-3.5 px-2 w-14 text-center">#</th>
                      <th className="py-3.5 px-4">Company</th>
                      <th className="py-3.5 px-4 w-36 text-center">Stage</th>
                      <th className="py-3.5 px-4 w-48 text-right">Activity</th>
                      <th className="py-3.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProspects.map(company => {
                      const channelStage = activeChannel === 'email' ? (company.emailStage || company.stage) : (company.linkedinStage || company.stage);
                      const badge = getStageBadge(channelStage);
                      const activityInfo = getCompanyActivityInfo(company);
                      const isSelected = selectedCompanyIds.has(company.id);
                      const isCurrentActive = selectedCompanyId === company.id;

                      return (
                        <tr
                          key={company.id}
                          id={`company-row-${company.id}`}
                          onClick={() => setSelectedCompanyId(company.id)}
                          className={`group transition-colors cursor-pointer ${
                            isCurrentActive
                              ? 'bg-indigo-950/40 border-l-4 border-indigo-500 ring-1 ring-indigo-500/30'
                              : isSelected
                              ? 'bg-indigo-950/20 border-l-4 border-indigo-600/50'
                              : highlightedCompanyId === company.id
                              ? 'bg-indigo-950/30 border-l-4 border-indigo-400'
                              : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                          }`}
                          title="Click row to slide open company details"
                        >
                          {/* 1. Selection Checkbox */}
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => toggleSelectCompany(company.id, e)}
                              className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer border mx-auto ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/40 ring-1 ring-indigo-400/50'
                                  : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 text-transparent hover:text-slate-400'
                              }`}
                              title={isSelected ? "Deselect company (Shift+click for range)" : "Select company (Shift+click for range)"}
                            >
                              <Check className={`w-3 h-3 transition-opacity ${isSelected ? 'opacity-100 stroke-[3]' : 'opacity-0'}`} />
                            </button>
                          </td>

                          {/* 2. Rank */}
                          <td className="py-3.5 px-2 text-center">
                            <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 inline-flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                              #{company.rank}
                            </span>
                          </td>

                          {/* 3. Company Name & Quick Actions */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompanyId(company.id);
                                }}
                                className="text-sm font-bold text-white tracking-tight hover:text-indigo-300 cursor-pointer transition-colors"
                                title="Click to open company details"
                              >
                                {company.name}
                              </span>

                              {/* Quick Action Icons Group */}
                              <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                {/* Copy Company Name */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyToClipboard(company.name, `title_${company.id}`);
                                    showToast(`📋 Copied: "${company.name}"`);
                                  }}
                                  className={`group/btn relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
                                    copiedText === `title_${company.id}`
                                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                                  }`}
                                  title={`Copy company name: "${company.name}"`}
                                >
                                  {copiedText === `title_${company.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-slate-200 shrink-0" />
                                  )}
                                  <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 group-hover/btn:ml-1.5">
                                    {copiedText === `title_${company.id}` ? 'Copied Name!' : 'Copy Name'}
                                  </span>
                                </button>

                                {/* Copy Research Prompt */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyPrompt(company.name, company.id)}
                                  className={`group/btn relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
                                    copiedPromptId === company.id
                                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
                                  }`}
                                  title={`Copy DeepSeek research prompt for ${company.name}`}
                                >
                                  {copiedPromptId === company.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  )}
                                  <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 group-hover/btn:ml-1.5">
                                    {copiedPromptId === company.id ? 'Copied!' : 'Copy Prompt'}
                                  </span>
                                </button>

                                {/* Website Link / Edit */}
                                {editingWebsiteCompanyId === company.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSaveWebsiteUrl(company.id, websiteInputUrl);
                                    }}
                                    className="inline-flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-indigo-500/60 shadow-lg z-10"
                                  >
                                    <input
                                      type="text"
                                      placeholder="Website (e.g. example.co.uk)"
                                      value={websiteInputUrl}
                                      onChange={(e) => setWebsiteInputUrl(e.target.value)}
                                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 w-40 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      autoFocus
                                    />
                                    <button
                                      type="submit"
                                      disabled={savingWebsite}
                                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                      {savingWebsite ? '...' : 'Save'}
                                    </button>
                                    {company.website && (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveWebsiteUrl(company.id, '')}
                                        className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] cursor-pointer"
                                        title="Remove website link"
                                      >
                                        Clear
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingWebsiteCompanyId(null);
                                        setWebsiteInputUrl('');
                                      }}
                                      className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </form>
                                ) : company.website ? (
                                  <div className="inline-flex items-center rounded-lg bg-indigo-950/80 border border-indigo-700/60 shadow-sm overflow-hidden group/btn">
                                    <a
                                      href={company.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 flex items-center transition-all"
                                      title={`Visit Website: ${company.website}`}
                                    >
                                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 group-hover/btn:ml-1.5">
                                        Website
                                      </span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingWebsiteCompanyId(company.id);
                                        setWebsiteInputUrl(company.website);
                                      }}
                                      className="px-1.5 py-1.5 hover:bg-indigo-900 text-indigo-400/60 hover:text-indigo-200 border-l border-indigo-800/80 cursor-pointer transition-all"
                                      title="Edit Website URL"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingWebsiteCompanyId(company.id);
                                      setWebsiteInputUrl('');
                                    }}
                                    className="group/btn p-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-950/80 text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700 hover:border-indigo-500/50 flex items-center cursor-pointer transition-all shadow-sm"
                                    title="Add Company Website"
                                  >
                                    <Globe className="w-3.5 h-3.5 text-indigo-400/80 group-hover/btn:text-indigo-300 shrink-0" />
                                    <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 group-hover/btn:ml-1.5">
                                      + Website
                                    </span>
                                  </button>
                                )}

                                {/* AI Research Links */}
                                <AiLinksGroup
                                  company={company}
                                  onSaveAiLink={handleSaveAiLink}
                                  onDeleteAiLink={handleDeleteAiLink}
                                />

                                {/* Detail View Button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCompanyId(company.id)}
                                  className="group/btn p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 flex items-center cursor-pointer transition-all shadow-sm"
                                  title="Open Company Details (slide from right)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white shrink-0" />
                                  <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 group-hover/btn:ml-1.5">
                                    Detail View
                                  </span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4. Stage Badge / Dropdown */}
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={channelStage === 'In Progress' ? 'In Review' : channelStage}
                              onChange={(e) => handleMoveStage(company.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none transition-all ${badge.bg}`}
                              title={`Current Stage: ${channelStage} (Click to change)`}
                            >
                              <option value="To Do" className="bg-slate-900 text-slate-300">📋 To Do</option>
                              <option value="In Review" className="bg-slate-900 text-sky-300">⚡ In Review</option>
                              <option value="Qualified" className="bg-slate-900 text-emerald-300">🎯 Qualified</option>
                              <option value="Disqualified" className="bg-slate-900 text-rose-300">🚫 Disqualified</option>
                            </select>
                          </td>

                          {/* 5. Last Checked / Activity Badge */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleMarkCompanyChecked(company.id, activeSetter)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                                activityInfo.isToday
                                  ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 shadow-sm'
                                  : activityInfo.hasActivity
                                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
                                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-500 hover:text-slate-300 border-slate-800/80 hover:border-slate-700'
                              }`}
                              title={`${activityInfo.tooltip} • Click to update into Checked: Today (${activeSetter})`}
                            >
                              {activityInfo.isToday ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ) : (
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                              <span>{activityInfo.badgeText}</span>
                            </button>
                          </td>

                          {/* 6. Slide-out Trigger (Chevron) */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompanyId(company.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 group-hover:text-white border border-slate-700 cursor-pointer transition-all"
                              title="Slide open company details"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Bulk Action Dock (Active when 1+ companies are selected) */}
      {selectedCompanyIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl w-auto bg-slate-900/95 border border-indigo-500/50 shadow-2xl shadow-black/80 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs animate-in slide-in-from-bottom-4 duration-200 ring-2 ring-indigo-500/20">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {selectedCompanyIds.size}
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">
              Selected
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 shrink-0" />

          {/* Move to Stage Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium uppercase mr-0.5 hidden md:inline">Move:</span>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkMoveStage('To Do')}
              className="px-3 py-1.5 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm hover:border-slate-500"
              title="Move selected companies to To Do"
            >
              📋 To Do
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkMoveStage('In Review')}
              className="px-3 py-1.5 rounded-lg font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 cursor-pointer transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm hover:border-sky-400"
              title="Move selected companies to In Review"
            >
              ⚡ In Review
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkMoveStage('Qualified')}
              className="px-3 py-1.5 rounded-lg font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm hover:border-emerald-400"
              title="Move selected companies to Qualified"
            >
              🎯 Qualified
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkMoveStage('Disqualified')}
              className="px-3 py-1.5 rounded-lg font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm hover:border-rose-400"
              title="Move selected companies to Disqualified"
            >
              🚫 Disqualified
            </button>
          </div>

          <div className="h-5 w-px bg-slate-700 shrink-0" />

          {/* Export Selected Button */}
          <button
            type="button"
            onClick={handleExportSelectedCSV}
            className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 cursor-pointer transition-all shrink-0 hidden sm:flex items-center space-x-1"
            title="Export selected to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Export</span>
          </button>

          {/* Deselect / Cancel button */}
          <button
            type="button"
            onClick={() => setSelectedCompanyIds(new Set())}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-all shrink-0"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Single-Company Detail View Modal */}
      <CompanyDetailModal
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        company={selectedCompany}
        prospects={filteredProspects}
        activeChannel={activeChannel}
        onUpdateStatus={handleMoveStage}
        onPrevCompany={selectedIndexInFiltered > 0 ? handlePrevCompany : null}
        onNextCompany={selectedIndexInFiltered < filteredProspects.length - 1 ? handleNextCompany : null}
        activeSetter={activeSetter}
        onAddContact={handleAddContact}
        onUpdateContactStatus={handleUpdateContactStatus}
        onReorderContacts={handleMoveContactOrder}
        onUpdateDeepseek={handleSaveDeepseekUrl}
        onUpdateWebsite={handleSaveWebsiteUrl}
        onSaveAiLink={handleSaveAiLink}
        onDeleteAiLink={handleDeleteAiLink}
        onDeleteContact={handleDeleteContact}
        onEditContact={handleSaveEditedContact}
        onMarkChecked={handleMarkCompanyChecked}
        onSaveNote={handleSaveCompanyNote}
      />

      {/* Follow-up Notification Center Modal */}
      <FollowupNotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        prospects={prospects}
        onSelectCompany={(companyId) => {
          setSelectedCompanyId(companyId);
        }}
        onUpdateContactStatus={handleUpdateContactStatus}
        onEnableDesktopNotifications={handleEnableDesktopNotifications}
        desktopNotificationsEnabled={desktopNotificationsEnabled}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        UK Prospects Automation Tracker • Active Setter: {activeSetter}
      </footer>

    </div>
  );
}
