import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import Navbar from './components/Navbar';
import StatsDashboard from './components/StatsDashboard';
import TableView from './components/TableView';
import MultiContactView from './components/MultiContactView';
import PipelineView from './components/PipelineView';
import TemplatesModal from './components/TemplatesModal';
import CompanyModal from './components/CompanyModal';
import OutreachQueueModal from './components/OutreachQueueModal';

const API_BASE = '/api';

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeView, setActiveView] = useState('table'); // 'table' | 'multi' | 'pipeline'

  // Modals state
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [selectedTargetForTemplate, setSelectedTargetForTemplate] = useState(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState(null);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [queueStartIndex, setQueueStartIndex] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all prospects and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prosRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/prospects`),
        fetch(`${API_BASE}/stats`)
      ]);

      if (!prosRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const prosData = await prosRes.json();
      const statsData = await statsRes.json();

      setProspects(prosData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching prospects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Company
  const handleUpdateCompany = async (companyId, updates) => {
    try {
      // Optimistic update
      setProspects(prev => prev.map(p => p.id === companyId ? { ...p, ...updates } : p));

      const res = await fetch(`${API_BASE}/prospects/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update company');
      const updated = await res.json();
      
      setProspects(prev => prev.map(p => p.id === companyId ? updated : p));
      fetchStats();
      showToast('Account updated successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to update account', 'error');
      fetchData(); // Rollback
    }
  };

  // Add Contact to Company
  const handleAddContact = async (companyId, contactData) => {
    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) throw new Error('Failed to add contact');
      const updatedCompany = await res.json();

      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      if (selectedCompanyForModal && selectedCompanyForModal.id === companyId) {
        setSelectedCompanyForModal(updatedCompany);
      }
      fetchStats();
      showToast(`Added ${contactData.name} to account`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add contact', 'error');
    }
  };

  // Update Contact
  const handleUpdateContact = async (companyId, contactId, contactUpdates) => {
    try {
      // Optimistic update
      setProspects(prev => prev.map(comp => {
        if (comp.id !== companyId) return comp;
        const updatedContacts = (comp.contacts || []).map(c => 
          c.id === contactId ? { ...c, ...contactUpdates } : c
        );
        return { ...comp, contacts: updatedContacts };
      }));

      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactUpdates),
      });

      if (!res.ok) throw new Error('Failed to update contact');
      const updatedCompany = await res.json();

      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      if (selectedCompanyForModal && selectedCompanyForModal.id === companyId) {
        setSelectedCompanyForModal(updatedCompany);
      }
      fetchStats();
      showToast('Contact status updated');
    } catch (err) {
      console.error(err);
      showToast('Failed to update contact', 'error');
      fetchData();
    }
  };

  // Delete Contact
  const handleDeleteContact = async (companyId, contactId) => {
    if (!window.confirm('Are you sure you want to remove this contact?')) return;

    try {
      const res = await fetch(`${API_BASE}/prospects/${companyId}/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete contact');
      const updatedCompany = await res.json();

      setProspects(prev => prev.map(p => p.id === companyId ? updatedCompany : p));
      if (selectedCompanyForModal && selectedCompanyForModal.id === companyId) {
        setSelectedCompanyForModal(updatedCompany);
      }
      fetchStats();
      showToast('Contact removed');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove contact', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to refresh stats', e);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
    showToast('Exporting CSV...');
  };

  // Export JSON
  const handleExportJSON = () => {
    window.open(`${API_BASE}/export/json`, '_blank');
    showToast('Exporting JSON backup...');
  };

  // Reset database from original CSV
  const handleResetData = async () => {
    if (!window.confirm('Reset all changes back to the original CSV dataset? This will re-parse the 100 rows.')) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await fetchData();
      showToast('Database reset from original CSV');
    } catch (err) {
      console.error(err);
      showToast('Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Template Modal for a specific company / contact
  const handleOpenTemplatesWithTarget = (company, contact = null) => {
    setSelectedTargetForTemplate(company);
    setTemplatesModalOpen(true);
  };

  // Open Company Edit Modal
  const handleOpenCompanyModal = (company) => {
    setSelectedCompanyForModal(company);
    setCompanyModalOpen(true);
  };

  // Create New Prospect
  const handleCreateNewProspect = () => {
    const nextRank = prospects.length + 1;
    const newComp = {
      id: `comp_${nextRank}`,
      rank: nextRank,
      name: `New Prospect #${nextRank}`,
      priority: 'A',
      stage: 'Ready for Outreach',
      contacts: []
    };
    setSelectedCompanyForModal(newComp);
    setCompanyModalOpen(true);
  };

  // Filtered Prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // 1. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const modelMatch = (p.businessModel || '').toLowerCase().includes(query);
        const oppMatch = (p.automationOpportunities || '').toLowerCase().includes(query);
        const notesMatch = (p.notes || '').toLowerCase().includes(query);
        const contactMatch = (p.contacts || []).some(c => 
          (c.name || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.notes || '').toLowerCase().includes(query) ||
          (c.role || '').toLowerCase().includes(query)
        );

        if (!nameMatch && !modelMatch && !oppMatch && !notesMatch && !contactMatch) {
          return false;
        }
      }

      // 2. Priority filter
      if (priorityFilter !== 'ALL') {
        if (p.priority !== priorityFilter) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'ALL') {
        const contacts = p.contacts || [];
        if (statusFilter === 'MULTI_ONLY') {
          if (contacts.length <= 1) return false;
        } else if (statusFilter === 'EMAIL_SENT') {
          const anyEmailed = contacts.some(c => ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(c.emailStatus));
          if (!anyEmailed) return false;
        } else if (statusFilter === 'LINKEDIN_CONNECTED') {
          const anyConnected = contacts.some(c => c.linkedinStatus === 'Connected');
          if (!anyConnected) return false;
        } else if (statusFilter === 'LINKEDIN_PENDING') {
          const anyPending = contacts.some(c => c.linkedinStatus === 'Pending');
          if (!anyPending) return false;
        } else if (statusFilter === 'LINKEDIN_ACTIVE') {
          const anyLi = contacts.some(c => ['Pending', 'Connected', 'Replied'].includes(c.linkedinStatus));
          if (!anyLi) return false;
        } else if (statusFilter === 'BOOKED') {
          const anyBooked = contacts.some(c => c.appointmentStatus === 'Appointment Booked') || p.stage === 'Appointment Booked';
          if (!anyBooked) return false;
        } else if (statusFilter === 'UNCONTACTED') {
          const anyOutreach = contacts.some(c => 
            c.emailStatus !== 'Not Sent' || 
            (c.linkedinStatus !== 'Not Started' && c.linkedinStatus !== 'Not Connected')
          );
          if (anyOutreach) return false;
        }
      }

      return true;
    });
  }, [prospects, searchTerm, priorityFilter, statusFilter]);

  const multiContactCount = useMemo(() => {
    return prospects.filter(p => (p.contacts || []).length > 1).length;
  }, [prospects]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-700'
            : 'bg-indigo-950 text-indigo-200 border-indigo-500'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenTemplates={() => {
          setSelectedTargetForTemplate(prospects[0] || null);
          setTemplatesModalOpen(true);
        }}
        onOpenQueue={() => {
          setQueueStartIndex(0);
          setQueueModalOpen(true);
        }}
        onOpenNewProspect={handleCreateNewProspect}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onResetData={handleResetData}
        totalResults={filteredProspects.length}
        multiContactCount={multiContactCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Dashboard */}
        <StatsDashboard
          stats={stats}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* View Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading prospects and multi-contact intelligence...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Error Loading Prospects</h3>
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            {activeView === 'table' && (
              <TableView
                prospects={filteredProspects}
                onUpdateCompany={handleUpdateCompany}
                onAddContact={handleAddContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onOpenCompanyModal={handleOpenCompanyModal}
                onOpenTemplatesWithTarget={handleOpenTemplatesWithTarget}
                onOpenQueueAtCompany={(company) => {
                  const idx = filteredProspects.findIndex(p => p.id === company.id);
                  setQueueStartIndex(Math.max(0, idx));
                  setQueueModalOpen(true);
                }}
              />
            )}

            {activeView === 'multi' && (
              <MultiContactView
                prospects={filteredProspects}
                onUpdateCompany={handleUpdateCompany}
                onAddContact={handleAddContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onOpenCompanyModal={handleOpenCompanyModal}
                onOpenTemplatesWithTarget={handleOpenTemplatesWithTarget}
              />
            )}

            {activeView === 'pipeline' && (
              <PipelineView
                prospects={filteredProspects}
                onUpdateCompany={handleUpdateCompany}
                onOpenCompanyModal={handleOpenCompanyModal}
                onOpenTemplatesWithTarget={handleOpenTemplatesWithTarget}
              />
            )}
          </div>
        )}

      </main>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        selectedCompany={selectedTargetForTemplate}
      />

      {/* Edit Company Modal */}
      <CompanyModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        company={selectedCompanyForModal}
        onSaveCompany={handleUpdateCompany}
        onAddContact={handleAddContact}
        onUpdateContact={handleUpdateContact}
        onDeleteContact={handleDeleteContact}
      />

      {/* Speed Outreach Queue Modal */}
      <OutreachQueueModal
        isOpen={queueModalOpen}
        onClose={() => setQueueModalOpen(false)}
        prospects={filteredProspects}
        initialIndex={queueStartIndex}
        onUpdateCompany={handleUpdateCompany}
        onAddContact={handleAddContact}
        onUpdateContact={handleUpdateContact}
        onDeleteContact={handleDeleteContact}
        onOpenTemplatesWithTarget={handleOpenTemplatesWithTarget}
      />

    </div>
  );
}
