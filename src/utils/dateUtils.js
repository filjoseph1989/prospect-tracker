// Utility helpers for outreach and follow-up date calculations

export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(days, baseDateStr = null) {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (e) {
    return dateStr;
  }
}

export function getRelativeFollowupInfo(dateStr) {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateStr.split('-');
    const target = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return {
        isOverdue: true,
        isToday: false,
        days: daysOverdue,
        label: daysOverdue === 1 ? '1d overdue' : `${daysOverdue}d overdue`,
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        isToday: true,
        days: 0,
        label: 'Due Today',
        badgeColor: 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold animate-pulse'
      };
    } else if (diffDays === 1) {
      return {
        isOverdue: false,
        isToday: false,
        days: 1,
        label: 'Tomorrow',
        badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-medium'
      };
    } else {
      return {
        isOverdue: false,
        isToday: false,
        days: diffDays,
        label: `In ${diffDays}d`,
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-medium'
      };
    }
  } catch (e) {
    return null;
  }
}

// Detect and format the latest outreach / review activity for a company
export function getCompanyActivityInfo(company) {
  if (!company) return { hasActivity: false, badgeText: 'Untouched', isToday: false };

  const activities = [];

  if (company.lastContactDate) {
    activities.push({
      date: company.lastContactDate,
      setter: company.workedBy || '',
      action: 'Stage / account update'
    });
  }

  (company.contacts || []).forEach(c => {
    if (c.emailLastContactDate) {
      activities.push({
        date: c.emailLastContactDate,
        setter: c.emailContactedBy || company.workedBy || '',
        action: `Email: ${c.emailStatus || 'Contacted'}`
      });
    }
    if (c.emailSentDate) {
      activities.push({
        date: c.emailSentDate,
        setter: c.emailContactedBy || company.workedBy || '',
        action: 'Email Sent'
      });
    }
    if (c.emailFollowup1Date) {
      activities.push({
        date: c.emailFollowup1Date,
        setter: c.emailContactedBy || company.workedBy || '',
        action: 'Follow-up 1'
      });
    }
    if (c.emailFollowup2Date) {
      activities.push({
        date: c.emailFollowup2Date,
        setter: c.emailContactedBy || company.workedBy || '',
        action: 'Follow-up 2'
      });
    }
    if (c.linkedinLastContactDate) {
      activities.push({
        date: c.linkedinLastContactDate,
        setter: c.linkedinConnectedBy || company.workedBy || '',
        action: `LinkedIn: ${c.linkedinStatus || 'Contacted'}`
      });
    }
  });

  if (activities.length > 0) {
    activities.sort((a, b) => b.date.localeCompare(a.date));
    const latest = activities[0];
    const today = getTodayDateStr();
    const isToday = latest.date === today;

    // Relative day count
    const dToday = new Date(today);
    const dLatest = new Date(latest.date);
    const diffDays = Math.round((dToday - dLatest) / (1000 * 60 * 60 * 24));

    let timeText = '';
    if (isToday) {
      timeText = 'Today';
    } else if (diffDays === 1) {
      timeText = 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      timeText = `${diffDays}d ago`;
    } else {
      timeText = formatDisplayDate(latest.date);
    }

    const setterText = latest.setter ? ` • ${latest.setter}` : '';

    return {
      hasActivity: true,
      rawDate: latest.date,
      timeText,
      setter: latest.setter,
      action: latest.action,
      isToday,
      badgeText: `Checked: ${timeText}${setterText}`,
      shortBadgeText: `${timeText}${setterText}`,
      tooltip: `Last Activity: ${latest.action} on ${formatDisplayDate(latest.date)}${latest.setter ? ` by ${latest.setter}` : ''}`
    };
  }

  if (company.updatedAt && company.stage !== 'To Do') {
    const dateStr = company.updatedAt.split('T')[0];
    const today = getTodayDateStr();
    const isToday = dateStr === today;
    const setterText = company.workedBy ? ` • ${company.workedBy}` : '';
    return {
      hasActivity: true,
      rawDate: dateStr,
      timeText: isToday ? 'Today' : formatDisplayDate(dateStr),
      setter: company.workedBy || '',
      action: `Moved to ${company.stage}`,
      isToday,
      badgeText: `Checked: ${isToday ? 'Today' : formatDisplayDate(dateStr)}${setterText}`,
      shortBadgeText: `${isToday ? 'Today' : formatDisplayDate(dateStr)}${setterText}`,
      tooltip: `Last Activity: Stage updated to ${company.stage}${company.workedBy ? ` by ${company.workedBy}` : ''}`
    };
  }

  return {
    hasActivity: false,
    rawDate: null,
    timeText: 'Untouched',
    setter: '',
    action: 'No activity logged yet',
    isToday: false,
    badgeText: 'Untouched',
    shortBadgeText: 'Untouched',
    tooltip: 'No outreach or updates logged yet'
  };
}
