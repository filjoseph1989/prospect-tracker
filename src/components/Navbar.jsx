import React from 'react';
import { 
  Building2, 
  Search, 
  SlidersHorizontal, 
  Download, 
  RotateCcw, 
  MessageSquareCode, 
  Sparkles, 
  Users, 
  Kanban, 
  Table, 
  Zap,
  Filter,
  Plus
} from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  activeView,
  setActiveView,
  onOpenTemplates,
  onOpenQueue,
  onOpenNewProspect,
  onExportCSV,
  onExportJSON,
  onResetData,
  totalResults,
  multiContactCount
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">ProspectPulse</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  UK Property
                </span>
              </div>
              <p className="text-xs text-slate-400">Appointment Setting & Multi-Contact Outreach</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies, decision makers, emails, automation opps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="hidden md:flex items-center bg-slate-800/90 border border-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>All Prospects</span>
            </button>

            <button
              onClick={() => setActiveView('multi')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                activeView === 'multi'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Contact Focus</span>
              {multiContactCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-purple-500/40 text-purple-200 text-[10px] rounded-full border border-purple-400/40 font-bold">
                  {multiContactCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('pipeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenQueue}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
              title="Launch step-by-step focused outreach flow"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Speed Outreach</span>
            </button>

            <button
              onClick={onOpenTemplates}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              title="View outreach email & LinkedIn scripts"
            >
              <MessageSquareCode className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Scripts</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <button
              onClick={onExportCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              title="Export updated dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Export CSV</span>
            </button>

            <button
              onClick={onOpenNewProspect}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              title="Add a new company/prospect"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
