import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink, 
  Mail, 
  CalendarCheck2,
  Briefcase
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';

export default function CompanyModal({
  isOpen,
  onClose,
  company,
  onSaveCompany,
  onAddContact,
  onUpdateContact,
  onDeleteContact
}) {
  if (!isOpen || !company) return null;

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    priority: 'B',
    revenue: '',
    employees: '',
    businessModel: '',
    automationOpportunities: '',
    qualification: '',
    stage: 'To Research',
    notes: ''
  });

  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('Key Decision Maker');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactLi, setNewContactLi] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        website: company.website || '',
        priority: company.priority || 'B',
        revenue: company.revenue || '',
        employees: company.employees || '',
        businessModel: company.businessModel || '',
        automationOpportunities: company.automationOpportunities || '',
        qualification: company.qualification || '',
        stage: company.stage || 'To Research',
        notes: company.notes || ''
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveCompany(company.id, formData);
    onClose();
  };

  const handleAddNewContact = () => {
    if (!newContactName.trim()) return;
    onAddContact(company.id, {
      name: newContactName.trim(),
      role: newContactRole,
      email: newContactEmail.trim(),
      linkedinUrl: newContactLi.trim()
    });
    setNewContactName('');
    setNewContactEmail('');
    setNewContactLi('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              #{company.rank || 'New'}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{company.name || 'Edit Prospect'}</h3>
              <p className="text-xs text-slate-400">Manage account information & key decision makers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Name, Priority, Stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="A">Priority A (High Fit / Revenue)</option>
                  <option value="B">Priority B (Medium Fit)</option>
                  <option value="C">Priority C (Lower Fit)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Overall Stage</label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="To Research">To Research</option>
                  <option value="Ready for Outreach">Ready for Outreach</option>
                  <option value="LinkedIn Pending">LinkedIn Pending</option>
                  <option value="Email Sent">Email Sent</option>
                  <option value="Multi-Channel Outreach (Email & LI)">Multi-Channel Outreach</option>
                  <option value="LinkedIn Connected">LinkedIn Connected</option>
                  <option value="In Discussion">In Discussion</option>
                  <option value="Appointment Booked">🎯 Appointment Booked</option>
                  <option value="Not a Fit">Not a Fit</option>
                </select>
              </div>
            </div>

            {/* Row 2: Website, Revenue, Employees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Revenue / Revenue Status</label>
                <input
                  type="text"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleChange}
                  placeholder="£2.9m"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Employees / Staff Count</label>
                <input
                  type="text"
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  placeholder="30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Business Model & Automation Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Business Model</label>
                <input
                  type="text"
                  name="businessModel"
                  value={formData.businessModel}
                  onChange={handleChange}
                  placeholder="Residential block / BTR property management"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Likely Automation Opportunities</label>
                <input
                  type="text"
                  name="automationOpportunities"
                  value={formData.automationOpportunities}
                  onChange={handleChange}
                  placeholder="Tenant queries; maintenance; viewings; contractor coordination"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Notes & Research Intelligence */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Account Notes & Research Intelligence</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Details on decision makers, founder links, relevant news, outreach context..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Company Details</span>
              </button>
            </div>

          </form>

          {/* Key Contacts Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Key Stakeholders & Decision Makers ({company.contacts?.length || 0})</span>
              </h4>
            </div>

            {/* Existing contacts list in table format */}
            <div className="space-y-2">
              {(company.contacts || []).map(contact => (
                <div 
                  key={contact.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-white">{contact.name}</span>
                      {contact.role && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/35 text-[11px] font-medium shadow-xs"
                          title={`Position: ${contact.role}`}
                        >
                          <Briefcase className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Role:</span>
                          <span className="font-semibold text-purple-100">{contact.role}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      {contact.email && <span className="font-mono text-amber-300/90">{contact.email}</span>}
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline flex items-center space-x-0.5">
                          <span>LinkedIn</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      LI: {contact.linkedinStatus || 'Not Started'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Email: {contact.emailStatus || 'Not Sent'}
                    </span>
                    <button
                      onClick={() => onDeleteContact(company.id, contact.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Contact Form */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2.5">
              <span className="font-semibold text-slate-300 text-xs block">
                + Add Another Stakeholder to {company.name}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Phil Johns)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Managing Director)"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="LinkedIn Profile URL"
                  value={newContactLi}
                  onChange={(e) => setNewContactLi(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddNewContact}
                  disabled={!newContactName.trim()}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Stakeholder</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
