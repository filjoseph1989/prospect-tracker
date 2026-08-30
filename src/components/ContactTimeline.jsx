import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Check, Plus, X } from 'lucide-react';
import { 
  formatDisplayDate, 
  getRelativeFollowupInfo, 
  getTodayDateStr, 
  addDaysToDate 
} from '../utils/dateUtils';

export default function ContactTimeline({
  contact,
  companyId,
  onUpdateStatus,
  compact = false
}) {
  const [isEditingSent, setIsEditingSent] = useState(false);
  const [isEditingF1, setIsEditingF1] = useState(false);
  const [isEditingF2, setIsEditingF2] = useState(false);
  const [isEditingNext, setIsEditingNext] = useState(false);

  const relativeInfo = getRelativeFollowupInfo(contact.nextFollowupDate);
  const hasOutreachStarted = contact.emailStatus !== 'Not Sent' || contact.emailSentDate || contact.emailFollowup1Date || contact.emailFollowup2Date;

  if (!hasOutreachStarted && !contact.nextFollowupDate) {
    return null;
  }

  const handleQuickNextDays = (days) => {
    const newDate = addDaysToDate(days);
    onUpdateStatus(companyId, contact.id, { nextFollowupDate: newDate });
  };

  const handleClearNext = () => {
    onUpdateStatus(companyId, contact.id, { nextFollowupDate: '' });
  };

  return (
    <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 pt-1.5 text-[11px] border-t border-slate-900/80">
      
      {/* 1. Initial Email Sent Date */}
      {(contact.emailSentDate || contact.emailStatus !== 'Not Sent') && (
        <div className="flex items-center space-x-1 text-slate-400">
          <span className="text-[10px] text-slate-500 font-medium">Sent:</span>
          {isEditingSent ? (
            <input
              type="date"
              defaultValue={contact.emailSentDate || getTodayDateStr()}
              onBlur={() => setIsEditingSent(false)}
              onChange={(e) => {
                onUpdateStatus(companyId, contact.id, { 
                  emailSentDate: e.target.value,
                  emailLastContactDate: e.target.value
                });
                setIsEditingSent(false);
              }}
              autoFocus
              className="bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSent(true)}
              className="hover:underline text-slate-300 font-mono text-[10.5px] cursor-pointer"
              title="Click to edit Initial Email Sent Date"
            >
              {formatDisplayDate(contact.emailSentDate) || 'Set date'}
            </button>
          )}
        </div>
      )}

      {/* 2. Follow-up 1 Date */}
      {(contact.emailFollowup1Date || ['Follow-up 1', 'Follow-up 2', 'Replied'].includes(contact.emailStatus)) && (
        <div className="flex items-center space-x-1 text-slate-400">
          <span className="text-[10px] text-amber-500/80 font-medium">F1:</span>
          {isEditingF1 ? (
            <input
              type="date"
              defaultValue={contact.emailFollowup1Date || getTodayDateStr()}
              onBlur={() => setIsEditingF1(false)}
              onChange={(e) => {
                onUpdateStatus(companyId, contact.id, { 
                  emailFollowup1Date: e.target.value,
                  emailLastContactDate: e.target.value
                });
                setIsEditingF1(false);
              }}
              autoFocus
              className="bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingF1(true)}
              className="hover:underline text-amber-300 font-mono text-[10.5px] cursor-pointer"
              title="Click to edit Follow-up 1 Date"
            >
              {formatDisplayDate(contact.emailFollowup1Date) || 'Set date'}
            </button>
          )}
        </div>
      )}

      {/* 3. Follow-up 2 Date */}
      {(contact.emailFollowup2Date || ['Follow-up 2', 'Replied'].includes(contact.emailStatus)) && (
        <div className="flex items-center space-x-1 text-slate-400">
          <span className="text-[10px] text-orange-500/80 font-medium">F2:</span>
          {isEditingF2 ? (
            <input
              type="date"
              defaultValue={contact.emailFollowup2Date || getTodayDateStr()}
              onBlur={() => setIsEditingF2(false)}
              onChange={(e) => {
                onUpdateStatus(companyId, contact.id, { 
                  emailFollowup2Date: e.target.value,
                  emailLastContactDate: e.target.value
                });
                setIsEditingF2(false);
              }}
              autoFocus
              className="bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingF2(true)}
              className="hover:underline text-orange-300 font-mono text-[10.5px] cursor-pointer"
              title="Click to edit Follow-up 2 Date"
            >
              {formatDisplayDate(contact.emailFollowup2Date) || 'Set date'}
            </button>
          )}
        </div>
      )}

      {/* 4. Next Follow-up Scheduled Date & Relative Badge */}
      <div className="flex items-center space-x-1.5 ml-auto">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Next:</span>
        
        {isEditingNext ? (
          <input
            type="date"
            defaultValue={contact.nextFollowupDate || addDaysToDate(3)}
            onBlur={() => setIsEditingNext(false)}
            onChange={(e) => {
              onUpdateStatus(companyId, contact.id, { nextFollowupDate: e.target.value });
              setIsEditingNext(false);
            }}
            autoFocus
            className="bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 border border-indigo-500 focus:outline-none"
          />
        ) : contact.nextFollowupDate ? (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsEditingNext(true)}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10.5px] font-mono text-slate-200 cursor-pointer transition-all"
              title="Click to change Next Follow-up Date"
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDisplayDate(contact.nextFollowupDate)}</span>
            </button>

            {/* Relative badge */}
            {relativeInfo && (
              <span className={`px-1.5 py-0.5 rounded text-[9.5px] border ${relativeInfo.badgeColor}`}>
                {relativeInfo.label}
              </span>
            )}

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClearNext}
              className="p-0.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Clear next follow-up"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          /* Quick preset helpers */
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsEditingNext(true)}
              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
              title="Set custom follow-up date"
            >
              + Date
            </button>
            <button
              type="button"
              onClick={() => handleQuickNextDays(3)}
              className="px-1 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 text-[9.5px] text-indigo-300 font-semibold cursor-pointer transition-all"
              title="Set next follow-up in 3 days"
            >
              +3d
            </button>
            <button
              type="button"
              onClick={() => handleQuickNextDays(5)}
              className="px-1 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 text-[9.5px] text-indigo-300 font-semibold cursor-pointer transition-all"
              title="Set next follow-up in 5 days"
            >
              +5d
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
