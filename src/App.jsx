import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  ExternalLink, 
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
  Bot,
  Trash2,
  Sun,
  Moon,
  BarChart3,
  FileText
} from 'lucide-react';
import LinkedinIcon from './components/LinkedinIcon';
import CompanyDetailModal from './components/CompanyDetailModal';
import FollowupNotificationModal from './components/FollowupNotificationModal';
import ContactTimeline from './components/ContactTimeline';
import AiLinksGroup from './components/AiLinksGroup';
import ReportsView from './components/ReportsView';
import { getPromptForCompany } from './utils/promptTemplate';
import { getTodayDateStr, addDaysToDate, getRelativeFollowupInfo, getCompanyActivityInfo, formatDisplayDate } from './utils/dateUtils';

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
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Card Collapse / Expand State (Empty Set = Collapsed by default)
  const [expandedCompanyIds, setExpandedCompanyIds] = useState(new Set());
  const [highlightedCompanyId, setHighlightedCompanyId] = useState(null);

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

  // Update company stage / move between pages & automatically follow to target page
  const handleMoveStage = async (companyId, newStage, setter = activeSetter) => {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const updates = {
      stage: newStage,
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

      if (newStage === 'Qualified') {
        showToast(`🎯 Moved ${name} to Qualified!`);
      } else if (newStage === 'Disqualified') {
        showToast(`🚫 Moved ${name} to Disqualified`);
      } else if (newStage === 'In Review' || newStage === 'In Progress') {
        showToast(`⚡ Moved ${name} to In Review (by ${setter})`);
      } else {
        showToast(`📋 Moved ${name} to To Do`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to move company stage', 'error');
      fetchProspects(); // Rollback
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
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
      await navigator.clipboard.writeText(filledPrompt);
      setCopiedPromptId(companyId);
      showToast(`✨ Research prompt for "${companyName}" copied to clipboard!`);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
    showToast('Downloading CSV...');
  };

  // Helper to categorize company into 1 of the 4 tabs:
  // 'todo' | 'in-review' | 'qualified' | 'disqualified'
  const getTabForProspect = (p) => {
    const stage = (p.stage || '').trim();
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

  // Counts for each of the tabs + followups due
  const tabCounts = useMemo(() => {
    const counts = { 'todo': 0, 'in-review': 0, 'qualified': 0, 'disqualified': 0, 'followups': 0, 'all': prospects.length };
    prospects.forEach(p => {
      const tab = getTabForProspect(p);
      if (counts[tab] !== undefined) counts[tab]++;

      const hasDueFollowup = (p.contacts || []).some(c => {
        if (!c.nextFollowupDate || ['Replied', 'Bounced', 'No Email Found'].includes(c.emailStatus) || p.stage === 'Disqualified') return false;
        const info = getRelativeFollowupInfo(c.nextFollowupDate);
        return info && (info.isOverdue || info.isToday || info.days <= 3);
      });
      if (hasDueFollowup) counts.followups++;
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

  // Filtered prospects based on active tab and search
  const filteredProspects = useMemo(() => {
    const list = prospects.filter(p => {
      // 1. Tab filter
      if (activeTab === 'followups') {
        const hasDueFollowup = (p.contacts || []).some(c => {
          if (!c.nextFollowupDate || ['Replied', 'Bounced', 'No Email Found'].includes(c.emailStatus) || p.stage === 'Disqualified') return false;
          const info = getRelativeFollowupInfo(c.nextFollowupDate);
          return info && (info.isOverdue || info.isToday || info.days <= 3);
        });
        if (!hasDueFollowup) return false;
      } else if (activeTab !== 'all') {
        const pTab = getTabForProspect(p);
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

    // Sorting: In Qualified, In Review, Disqualified, and Follow-ups, put most recently updated on top!
    if (activeTab === 'qualified' || activeTab === 'in-review' || activeTab === 'disqualified' || activeTab === 'followups') {
      return [...list].sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0);
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0);
        if (timeB !== timeA) return timeB - timeA;
        return a.rank - b.rank;
      });
    }

    // In To-Do queue or All Prospects: sorted by Rank (#1, #2, #3...)
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [prospects, activeTab, searchTerm]);

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
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    {prospects.length} Total
                  </span>
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
            <div className="flex items-center space-x-2.5">
              {/* Follow-up Notification Bell Button */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-sm ${
                  urgentFollowupCount > 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Open Follow-up Notification Center"
              >
                <Bell className={`w-3.5 h-3.5 ${urgentFollowupCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Follow-ups</span>
                {urgentFollowupCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse">
                    {urgentFollowupCount}
                  </span>
                ) : tabCounts.followups > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 text-[10px] font-medium border border-slate-700">
                    {tabCounts.followups}
                  </span>
                ) : null}
              </button>

              <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
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

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
                title="Download entire dataset to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

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

        {/* Navigation Pages / Tabs (To Do, In Review, Done, Follow-ups, All) */}
        <div className="border-t border-slate-800/80 bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
            
            {/* The Core Workflow Navigation Pages */}
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5 w-full sm:w-auto">
              
              {/* 1. To Do Tab */}
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'todo'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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

              {/* 5. Follow-ups Due Tab */}
              {tabCounts.followups > 0 && (
                <button
                  onClick={() => setActiveTab('followups')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'followups'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                      : urgentFollowupCount > 0
                      ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25'
                      : 'text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Follow-ups</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'followups'
                      ? 'bg-amber-950 text-amber-200'
                      : urgentFollowupCount > 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950/60 text-slate-300'
                  }`}>
                    {tabCounts.followups}
                  </span>
                </button>
              )}

              {/* All Prospects Option */}
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>📊 Reports</span>
              </button>

            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="text-slate-400 hidden md:block">
                {activeTab === 'reports' ? (
                  <span>Outreach & Pipeline Performance Telemetry</span>
                ) : (
                  <span>Showing <strong className="text-white">{filteredProspects.length}</strong> companies in <strong className="text-indigo-300 uppercase">{activeTab}</strong></span>
                )}
              </div>

              {filteredProspects.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all flex items-center space-x-1 font-medium"
                >
                  {expandedCompanyIds.size === filteredProspects.length ? (
                    <>
                      <ChevronUp className="w-3 h-3 text-indigo-300" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 text-slate-300" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Company List Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
              {activeTab === 'todo'
                ? '🎉 All caught up! No companies in the To Do page.'
                : activeTab === 'in-review'
                ? 'No companies currently In Review.'
                : activeTab === 'qualified'
                ? 'No companies marked as Qualified yet.'
                : activeTab === 'disqualified'
                ? 'No companies marked as Disqualified.'
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
                View All Prospects
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Top Info Banner */}
            {activeTab === 'todo' && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
                <span>
                  🔥 <strong>To Do Queue</strong>: Select <strong>"In Review"</strong>, <strong>"Qualified"</strong>, or <strong>"Disqualified"</strong> in the dropdown to move a company and immediately proceed to the next account.
                </span>
                <span className="font-mono text-indigo-300 font-bold">{filteredProspects.length} remaining</span>
              </div>
            )}

            {filteredProspects.map(company => {
              const allContacts = company.contacts || [];
              const hasRealContacts = allContacts.some(c => !(c.name || '').toLowerCase().includes('to identify'));
              const contacts = hasRealContacts 
                ? allContacts.filter(c => !(c.name || '').toLowerCase().includes('to identify'))
                : allContacts;
              const badge = getStageBadge(company.stage);
              const currentTab = getTabForProspect(company);
              const isExpanded = expandedCompanyIds.has(company.id);
              const activityInfo = getCompanyActivityInfo(company);

              return (
                <div 
                  key={company.id}
                  id={`company-card-${company.id}`}
                  className={`rounded-xl border transition-all p-3.5 sm:p-4 shadow-lg shadow-black/20 ${
                    highlightedCompanyId === company.id
                      ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-indigo-500/10'
                      : 'border-slate-800/90 bg-slate-900/70 hover:border-slate-700'
                  } ${
                    !isExpanded ? 'hover:bg-slate-900/90 cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (!isExpanded) toggleCompanyExpanded(company.id);
                  }}
                >
                  {/* Top Row: Rank, Company Name, Badges, Revenue, Staff */}
                  <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 ${isExpanded ? 'pb-3 border-b border-slate-800/80' : ''}`}>
                    
                    {/* Left: Rank, Company Name, Actions */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0 flex-1">
                      {/* Rank */}
                      <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                        #{company.rank}
                      </span>

                      {/* Company Name */}
                      <h2 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompanyId(company.id);
                        }}
                        className="text-base font-bold text-white tracking-tight hover:text-indigo-300 cursor-pointer transition-colors"
                        title="Click to open dedicated company view"
                      >
                        {company.name}
                      </h2>

                      {/* Action Icons Group */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Copy Company Name / Title */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(company.name, `title_${company.id}`);
                            showToast(`📋 Copied: "${company.name}"`);
                          }}
                          className={`group relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
                            copiedText === `title_${company.id}`
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                          }`}
                          title={`Copy company name: "${company.name}"`}
                        >
                          {copiedText === `title_${company.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                          )}
                          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                            {copiedText === `title_${company.id}` ? 'Copied Name!' : 'Copy Name'}
                          </span>
                        </button>

                        {/* 1. Copy Research Prompt */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(company.name, company.id);
                          }}
                          className={`group relative p-1.5 rounded-lg flex items-center cursor-pointer transition-all border shadow-sm ${
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
                          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                            {copiedPromptId === company.id ? 'Copied!' : 'Copy Prompt'}
                          </span>
                        </button>

                        {/* 2. Website Link / Add / Edit Button */}
                        {editingWebsiteCompanyId === company.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveWebsiteUrl(company.id, websiteInputUrl);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-indigo-500/60 shadow-lg z-10"
                            onClick={(e) => e.stopPropagation()}
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
                          <div 
                            className="inline-flex items-center rounded-lg bg-indigo-950/80 border border-indigo-700/60 shadow-sm overflow-hidden group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 flex items-center transition-all"
                              title={`Visit Website: ${company.website}`}
                            >
                              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWebsiteCompanyId(company.id);
                              setWebsiteInputUrl('');
                            }}
                            className="group p-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-950/80 text-slate-400 hover:text-indigo-300 border border-dashed border-slate-700 hover:border-indigo-500/50 flex items-center cursor-pointer transition-all shadow-sm"
                            title="Add Company Website"
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-400/80 group-hover:text-indigo-300 shrink-0" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                              + Website
                            </span>
                          </button>
                        )}

                        {/* 3. AI Research Links */}
                        <AiLinksGroup
                          company={company}
                          onSaveAiLink={handleSaveAiLink}
                          onDeleteAiLink={handleDeleteAiLink}
                        />

                        {/* 4. Detail View Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(company.id);
                          }}
                          className="group p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 flex items-center cursor-pointer transition-all shadow-sm"
                          title="Open Dedicated Company Detail View"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 ease-in-out whitespace-nowrap text-[10px] font-semibold opacity-0 group-hover:opacity-100 group-hover:ml-1.5">
                            Detail View
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Meta Badges & Expand/Collapse Button */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 justify-start sm:justify-end">
                      {/* Stage Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${badge.bg}`}>
                        {badge.text}
                      </span>

                      {/* Last Checked / Activity Indicator */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10.5px] font-medium border flex items-center gap-1 ${
                          activityInfo.isToday
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : activityInfo.hasActivity
                            ? 'bg-slate-800/90 text-slate-300 border-slate-700/80'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                        }`}
                        title={activityInfo.tooltip}
                      >
                        {activityInfo.isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        ) : (
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                        <span>{activityInfo.badgeText}</span>
                      </span>

                      {/* Expand / Collapse Chevron Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompanyExpanded(company.id);
                        }}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-all ml-0.5"
                        title={isExpanded ? "Collapse card" : "Expand card"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-300" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Body Content (Collapsed by default) */}
                  {isExpanded && (
                    <div className="mt-3.5 space-y-3.5 text-xs animate-in fade-in duration-150">
                    
                    {/* Business Model */}
                    {company.businessModel && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Business Model
                        </span>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {company.businessModel}
                        </p>
                      </div>
                    )}

                    {/* 2-Column Section: Key Decision Makers (Flex-1) & Move to Page (Compact) */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                      
                      {/* Left Column: Key Stakeholders & Decision Makers (Takes All Remaining Space) */}
                      <div className="flex-1 min-w-0 w-full space-y-1.5 flex flex-col justify-start">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Key Decision Makers ({contacts.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (addingContactCompanyId === company.id) {
                                setAddingContactCompanyId(null);
                              } else {
                                setAddingContactCompanyId(company.id);
                                setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                              }
                            }}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-[10px] font-semibold cursor-pointer transition-all"
                            title="Add a key decision maker / contact"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Person</span>
                          </button>
                        </div>

                        {/* Inline Add Person Form */}
                        {addingContactCompanyId === company.id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAddContact(company.id);
                            }}
                            className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/40 shadow-lg space-y-2 mb-2"
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                              <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
                                <UserPlus className="w-3 h-3 text-indigo-400" />
                                <span>Add Decision Maker</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingContactCompanyId(null);
                                  setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                }}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Name *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. John Doe"
                                  value={newContactForm.name}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Role / Job Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Managing Director / CEO"
                                  value={newContactForm.role}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, role: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
                                <input
                                  type="email"
                                  placeholder="e.g. john@company.com"
                                  value={newContactForm.email}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">LinkedIn Profile URL</label>
                                <input
                                  type="url"
                                  placeholder="e.g. https://linkedin.com/in/..."
                                  value={newContactForm.linkedinUrl}
                                  onChange={(e) => setNewContactForm({ ...newContactForm, linkedinUrl: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingContactCompanyId(null);
                                  setNewContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                }}
                                className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingContact}
                                className="px-3 py-1 rounded text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                {savingContact ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Save Person</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {contacts.map((contact, contactIdx) => (
                            editingContactId === contact.id ? (
                              <form
                                key={contact.id}
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleSaveEditedContact(company.id, contact.id);
                                }}
                                className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/50 shadow-lg space-y-2"
                              >
                                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                                  <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
                                    <Pencil className="w-3 h-3 text-indigo-400" />
                                    <span>Edit Decision Maker</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingContactId(null);
                                      setEditContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                    }}
                                    className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Name *</label>
                                    <input
                                      type="text"
                                      required
                                      value={editContactForm.name}
                                      onChange={(e) => setEditContactForm({ ...editContactForm, name: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      autoFocus
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Role / Job Title</label>
                                    <input
                                      type="text"
                                      value={editContactForm.role}
                                      onChange={(e) => setEditContactForm({ ...editContactForm, role: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
                                    <input
                                      type="email"
                                      value={editContactForm.email}
                                      onChange={(e) => setEditContactForm({ ...editContactForm, email: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">LinkedIn Profile URL</label>
                                    <input
                                      type="url"
                                      value={editContactForm.linkedinUrl}
                                      onChange={(e) => setEditContactForm({ ...editContactForm, linkedinUrl: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingContactId(null);
                                      setEditContactForm({ name: '', role: '', email: '', linkedinUrl: '' });
                                    }}
                                    className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={savingEditContact}
                                    className="px-3 py-1 rounded text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                                  >
                                    {savingEditContact ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Save Changes</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </form>
                            ) : (
                            <div 
                              key={contact.id}
                              className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col gap-2 group/contact"
                            >
                              {/* Top row: Name, Role, and Action Buttons */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span className="font-semibold text-white text-xs">{contact.name}</span>
                                    {contact.role && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {contact.role}
                                      </span>
                                    )}
                                  </div>

                                  {contact.email && (
                                    <div className="flex items-center space-x-1.5 mt-1 font-mono text-[11px] text-amber-300/90 truncate">
                                      <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="truncate">{contact.email}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Contact Action Buttons (Mail, LinkedIn, Copy, Edit, Delete, Reorder) */}
                                <div className="flex items-center space-x-1.5 shrink-0 self-start sm:self-center">
                                  {contact.email && (
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                                      title="Send Email"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
                                  )}

                                  {contact.linkedinUrl && (
                                    <a
                                      href={contact.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-[11px] font-semibold transition-all"
                                      title="Open LinkedIn profile"
                                    >
                                      <LinkedinIcon className="w-3 h-3" />
                                      <span>LinkedIn</span>
                                    </a>
                                  )}

                                  {contact.email && (
                                    <button
                                      onClick={() => copyToClipboard(contact.email, contact.id)}
                                      className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] cursor-pointer transition-all"
                                      title="Copy email address"
                                    >
                                      {copiedText === contact.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Edit Contact Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingContactId(contact.id);
                                      setEditContactForm({
                                        name: contact.name || '',
                                        role: contact.role || '',
                                        email: contact.email || '',
                                        linkedinUrl: contact.linkedinUrl || ''
                                      });
                                    }}
                                    className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 border border-slate-700 cursor-pointer transition-all"
                                    title="Edit contact details"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Contact Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteContact(company.id, contact.id, contact.name)}
                                    className="p-1 rounded bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 cursor-pointer transition-all"
                                    title="Delete contact"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Rightmost: Reorder Up / Down Controls */}
                                  {contacts.length > 1 && (
                                    <div className="flex items-center rounded bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
                                      <button
                                        type="button"
                                        disabled={contactIdx === 0}
                                        onClick={() => handleMoveContactOrder(company.id, contactIdx, 'up')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-all"
                                        title="Move contact up"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={contactIdx === contacts.length - 1}
                                        onClick={() => handleMoveContactOrder(company.id, contactIdx, 'down')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 border-l border-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all"
                                        title="Move contact down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bottom row: Outreach Indicators & Interactive Selectors */}
                              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5 pt-1.5 border-t border-slate-900">
                                {/* Email Outreach Status Selector */}
                                <div className="inline-flex items-center space-x-1">
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Email:</span>
                                  <select
                                    value={contact.emailStatus || 'Not Sent'}
                                    onChange={(e) => handleEmailStatusChange(company.id, contact, e.target.value)}
                                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none transition-all ${
                                      contact.emailStatus === 'Sent'
                                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                                        : contact.emailStatus === 'Follow-up 1'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        : contact.emailStatus === 'Follow-up 2'
                                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                                        : contact.emailStatus === 'Replied'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                                        : contact.emailStatus === 'Bounced'
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                        : contact.emailStatus === 'No Email Found'
                                        ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700/60'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                    title="Update Email Outreach Status"
                                  >
                                    <option value="Not Sent">✉️ Not Sent</option>
                                    <option value="Sent">✉️ Sent</option>
                                    <option value="Follow-up 1">🔄 Follow-up 1</option>
                                    <option value="Follow-up 2">🔁 Follow-up 2</option>
                                    <option value="Replied">💬 Replied</option>
                                    <option value="Bounced">⚠️ Bounced</option>
                                    <option value="No Email Found">🔍 No Email Found</option>
                                  </select>
                                </div>

                                {/* LinkedIn Outreach Status Selector */}
                                <div className="inline-flex items-center space-x-1">
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">LinkedIn:</span>
                                  <select
                                    value={contact.linkedinStatus || 'Not Started'}
                                    onChange={(e) => handleUpdateContactStatus(company.id, contact.id, { linkedinStatus: e.target.value })}
                                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none transition-all ${
                                      contact.linkedinStatus === 'Connected'
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                        : contact.linkedinStatus === 'Pending'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        : contact.linkedinStatus === 'Replied'
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                    title="Update LinkedIn Connection Status"
                                  >
                                    <option value="Not Started">⚪ Not Started</option>
                                    <option value="Pending">⏳ Invite Sent (Pending)</option>
                                    <option value="Connected">🤝 Connected</option>
                                    <option value="Replied">💬 Replied</option>
                                  </select>
                                </div>
                              </div>

                              {/* Dates & Follow-up Timeline */}
                              <ContactTimeline
                                contact={contact}
                                companyId={company.id}
                                onUpdateStatus={handleUpdateContactStatus}
                              />

                            </div>
                          )
                        ))}
                        </div>
                      </div>

                      {/* Right Column: Move Company Dropdown Selector (Compact) */}
                      <div className="w-full lg:w-44 xl:w-48 shrink-0 space-y-1.5 flex flex-col justify-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center space-x-1">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Move to Page:</span>
                        </span>

                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5 items-stretch justify-between shadow-sm">
                          <div className="flex items-center justify-between space-x-1 flex-wrap">
                            {company.workedBy || company.lastContactDate ? (
                              <span className="text-[10px] text-slate-400 font-mono truncate" title={activityInfo.tooltip}>
                                (By <strong className="text-indigo-300">{company.workedBy || activeSetter}</strong>{company.lastContactDate ? ` • ${formatDisplayDate(company.lastContactDate)}` : ''})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">
                                Setter: <strong className="text-slate-400">{activeSetter}</strong>
                              </span>
                            )}

                            {/* 1-Click Mark Checked Today Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkCompanyChecked(company.id, activeSetter);
                              }}
                              className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-slate-700 font-medium cursor-pointer transition-all ml-auto"
                              title="Update last checked date to Today"
                            >
                              ✓ Checked
                            </button>
                          </div>

                          {/* Clean Dropdown */}
                          <select
                            value={currentTab === 'in-review' ? 'In Review' : currentTab === 'qualified' ? 'Qualified' : currentTab === 'disqualified' ? 'Disqualified' : 'To Do'}
                            onChange={(e) => handleMoveStage(company.id, e.target.value, activeSetter)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                          >
                            <option value="To Do">📋 To Do</option>
                            <option value="In Review">⚡ In Review</option>
                            <option value="Qualified">🎯 Qualified</option>
                            <option value="Disqualified">🚫 Disqualified</option>
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* Notes & Outreach Log Section at the Bottom of Card */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>Company Notes & Outreach Log</span>
                          </span>

                          {editingNoteCompanyId !== company.id && (
                            <button
                              type="button"
                              onClick={() => handleStartEditNote(company.id, company.notes)}
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
                            >
                              {company.notes ? (
                                <>
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit Note</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Add Note</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {editingNoteCompanyId === company.id ? (
                          <div className="space-y-2 animate-in fade-in duration-100">
                            <textarea
                              rows={3}
                              value={noteInputText}
                              onChange={(e) => setNoteInputText(e.target.value)}
                              placeholder="Add outreach notes, objections, conversation summary, gatekeeper info, specific pain points, next steps..."
                              className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                              autoFocus
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCompanyNote(company.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">⌘/Ctrl + Enter</kbd> to save</span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteCompanyId(null);
                                    setNoteInputText('');
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingNote}
                                  onClick={() => handleSaveCompanyNote(company.id)}
                                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                                >
                                  {savingNote ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Save Note</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : company.notes ? (
                          <div 
                            onClick={() => handleStartEditNote(company.id, company.notes)}
                            className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-200 cursor-pointer transition-all hover:bg-slate-900 group"
                            title="Click to edit note"
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{company.notes}</p>
                            <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors block mt-1.5 font-medium">
                              ✏️ Click to edit note
                            </span>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditNote(company.id, '')}
                            className="p-3 rounded-lg border border-dashed border-slate-800 hover:border-indigo-500/40 text-center cursor-pointer hover:bg-slate-900/50 transition-all group"
                          >
                            <p className="text-xs text-slate-500 group-hover:text-indigo-300 transition-colors flex items-center justify-center space-x-1.5 font-medium">
                              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                              <span>Click here to add notes, outreach details, or call summaries...</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Dedicated Single-Company Detail View Modal */}
      <CompanyDetailModal
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        company={selectedCompany}
        prospects={filteredProspects}
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
