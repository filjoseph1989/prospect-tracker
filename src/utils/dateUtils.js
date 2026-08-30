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
