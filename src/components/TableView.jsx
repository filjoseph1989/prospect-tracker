import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Edit3, 
  Check, 
  Copy,
  CalendarCheck2,
  ArrowUpDown,
  Zap,
  Info
} from 'lucide-react';
import LinkedinIcon from './LinkedinIcon';
import ContactCard from './ContactCard';

export default function TableView({
  prospects,
  onUpdateCompany,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenCompanyModal,
  onOpenTemplatesWithTarget,
  onOpenQueueAtCompany
}) {
  const [expandedRows, setExpandedRows] = useState(new Set([1, 2, 4, 5, 17, 18]));
  const [sortField, setSortField] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const toggleRow = (rank) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRows(new Set(prospects.map(p => p.rank)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sort logic
  const sorted = [...prospects].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'contactsCount') {
      valA = a.contacts?.length || 0;
      valB = b.contacts?.length || 0;
    }
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'Appointment Booked':
        return 'bg-emerald-500 text-slate-950 font-bold border-emerald-400';
      case 'In Discussion':
      case 'In Discussion (Multi-Channel)':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'LinkedIn Connected':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'Email Sent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Multi-Channel Outreach (Email & LI)':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'LinkedIn Pending':
        return 'bg-sky-900/30 text-sky-400 border-sky-800';
      case 'Ready for Outreach':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span>Showing <strong className="text-white">{sorted.length}</strong> companies</span>
          <span>•</span>
          <button
            onClick={expandAll}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            onClick={collapseAll}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Collapse All
          </button>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th 
                onClick={() => handleSort('rank')}
                className="py-3 px-3 w-16 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Rank</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('priority')}
                className="py-3 px-3 w-20 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Pri</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="py-3 px-4 min-w-[200px] cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Company</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[220px]">
                <div className="flex items-center space-x-1">
                  <span>Key Stakeholders & Channels</span>
                </div>
              </th>
              <th className="py-3 px-3 min-w-[160px]">Automation Angles</th>
              <th 
                onClick={() => handleSort('stage')}
                className="py-3 px-3 min-w-[160px] cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Pipeline Stage</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 w-24 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {paginated.map(company => {
              const isExpanded = expandedRows.has(company.rank);
              const contacts = company.contacts || [];
              const hasMulti = contacts.length > 1;

              return (
                <React.Fragment key={company.id}>
                  <tr 
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      isExpanded ? 'bg-slate-800/20' : ''
                    }`}
                  >
                    {/* Expand/Collapse Toggle */}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => toggleRow(company.rank)}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                        title={isExpanded ? 'Collapse row' : 'Expand row to see contacts'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Rank */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">
                      #{company.rank}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] inline-block ${
                        company.priority === 'A'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : company.priority === 'B'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {company.priority}
                      </span>
                    </td>

                    {/* Company info */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{company.name}</span>
                          {hasMulti && (
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center space-x-1">
                              <Users className="w-2.5 h-2.5" />
                              <span>{contacts.length} Contacts</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                          {company.revenue && <span className="text-emerald-400/90 font-medium">{company.revenue}</span>}
                          {company.revenue && company.employees && company.employees !== '0' && <span>•</span>}
                          {company.employees && company.employees !== '0' && <span>{company.employees} staff</span>}
                          {company.website && (
                            <>
                              <span>•</span>
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-0.5"
                              >
                                <span>Web</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Key Stakeholders summary pills */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1.5">
                        {contacts.map((contact) => (
                          <div 
                            key={contact.id} 
                            className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded-md border border-slate-800 text-[11px]"
                          >
                            <span className="font-medium text-slate-200 truncate max-w-[110px]" title={contact.name}>
                              {contact.name}
                            </span>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              {/* LinkedIn dot/badge */}
                              {contact.linkedinUrl ? (
                                <a
                                  href={contact.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold flex items-center space-x-0.5 ${
                                    contact.linkedinStatus === 'Connected'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : contact.linkedinStatus === 'Pending'
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                  title={`LinkedIn: ${contact.linkedinStatus || 'Not Connected'}`}
                                >
                                  <LinkedinIcon className="w-2.5 h-2.5" />
                                  <span>{contact.linkedinStatus === 'Connected' ? 'Conn' : contact.linkedinStatus === 'Pending' ? 'Pend' : 'LI'}</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-600">no li</span>
                              )}

                              {/* Email dot/badge */}
                              {contact.email ? (
                                <span 
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold flex items-center space-x-0.5 ${
                                    ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied'].includes(contact.emailStatus)
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                  title={`Email: ${contact.emailStatus}`}
                                >
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>{contact.emailStatus === 'Sent' ? 'Sent' : contact.emailStatus === 'Replied' ? 'Replied' : 'Email'}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Automation opportunities snippet */}
                    <td className="py-3 px-3">
                      {company.automationOpportunities ? (
                        <p className="text-slate-300 text-[11px] line-clamp-2 max-w-[220px]" title={company.automationOpportunities}>
                          {company.automationOpportunities}
                        </p>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">General property automation</span>
                      )}
                    </td>

                    {/* Pipeline Stage dropdown */}
                    <td className="py-3 px-3">
                      <select
                        value={company.stage || 'To Research'}
                        onChange={(e) => onUpdateCompany(company.id, { stage: e.target.value })}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer w-full ${getStageBadgeClass(company.stage)}`}
                      >
                        <option value="To Research" className="bg-slate-900 text-slate-300">To Research</option>
                        <option value="Ready for Outreach" className="bg-slate-900 text-blue-300">Ready for Outreach</option>
                        <option value="LinkedIn Pending" className="bg-slate-900 text-sky-300">LinkedIn Pending</option>
                        <option value="Email Sent" className="bg-slate-900 text-amber-300">Email Sent</option>
                        <option value="Multi-Channel Outreach (Email & LI)" className="bg-slate-900 text-indigo-300">Multi-Channel Outreach</option>
                        <option value="LinkedIn Connected" className="bg-slate-900 text-sky-300">LinkedIn Connected</option>
                        <option value="In Discussion" className="bg-slate-900 text-purple-300">In Discussion</option>
                        <option value="Appointment Booked" className="bg-slate-900 text-emerald-300">🎯 Appointment Booked</option>
                        <option value="Not a Fit" className="bg-slate-900 text-rose-300">Not a Fit</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenTemplatesWithTarget(company)}
                          className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-all cursor-pointer"
                          title="Generate outreach pitch"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenCompanyModal(company)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                          title="Edit company & contacts"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row showing full Contact Cards & Notes */}
                  {isExpanded && (
                    <tr className="bg-slate-950/60 border-b border-slate-800">
                      <td colSpan={8} className="py-4 px-6">
                        <div className="space-y-4">
                          
                          {/* Company notes snippet if present */}
                          {company.notes && (
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                              <span className="font-semibold text-purple-300 uppercase tracking-wider text-[10px] block mb-1">
                                Company Notes & Intelligence:
                              </span>
                              <p className="text-slate-300 whitespace-pre-line text-[11px] leading-relaxed">
                                {company.notes}
                              </p>
                            </div>
                          )}

                          {/* Contacts Header & Add Contact */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Key Decision Makers ({contacts.length})</span>
                            </span>

                            <button
                              onClick={() => {
                                const name = prompt(`Enter contact name for ${company.name}:`);
                                if (name && name.trim()) {
                                  onAddContact(company.id, { name: name.trim(), role: 'Key Decision Maker' });
                                }
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Decision Maker</span>
                            </button>
                          </div>

                          {/* Contact Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {contacts.map((contact) => (
                              <ContactCard
                                key={contact.id}
                                contact={contact}
                                companyId={company.id}
                                onUpdateContact={onUpdateContact}
                                onDeleteContact={onDeleteContact}
                              />
                            ))}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 py-2">
          <span>Page {currentPage} of {totalPages} ({sorted.length} total)</span>
          <div className="flex space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
            >
              Previous Page
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
            >
              Next Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
