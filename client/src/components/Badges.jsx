import React from 'react';

export function PriorityBadge({ priority, size = 'sm' }) {
  const p = (priority || 'unassigned').toLowerCase();

  const configs = {
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'HIGH',
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'MEDIUM',
    },
    normal: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'NORMAL',
    },
    unassigned: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'PENDING',
    },
  };

  const c = configs[p] || configs.unassigned;
  const padding = size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center space-x-1.5 font-medium tracking-wide rounded border ${c.bg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span>{c.label}</span>
    </span>
  );
}

export function UrgencyBadge({ urgency }) {
  const u = (urgency || 'low').toLowerCase();

  const configs = {
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Medium',
    },
    low: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      label: 'Low',
    },
  };

  const c = configs[u] || configs.low;

  return (
    <span className={`inline-flex items-center text-xs font-normal px-2 py-0.5 rounded border ${c.bg}`}>
      {c.label}
    </span>
  );
}

export function AppointmentBadge({ status }) {
  const s = (status || 'walkin').toLowerCase();

  const configs = {
    scheduled: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Scheduled',
    },
    walkin: {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      label: 'Walk-in',
    },
    missed: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'Missed',
    },
  };

  const c = configs[s] || configs.walkin;

  return (
    <span className={`inline-flex items-center text-xs font-normal px-2 py-0.5 rounded border ${c.bg}`}>
      {c.label}
    </span>
  );
}

export function SpecialBadge({ special }) {
  const s = (special || 'none').toLowerCase();

  if (s === 'none') {
    return <span className="text-xs text-slate-400 font-normal">None</span>;
  }

  const configs = {
    emergency: {
      bg: 'bg-rose-100 text-rose-800 border-rose-300 font-medium',
      label: 'Emergency',
    },
    elderly: {
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
      label: 'Elderly',
    },
    disability: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      label: 'Disability',
    },
    other: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Other',
    },
  };

  const c = configs[s] || configs.other;

  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${c.bg}`}>
      {c.label}
    </span>
  );
}

export function PositionIndicator({ position, priority }) {
  const p = (priority || 'normal').toLowerCase();
  const formatted = String(position).padStart(2, '0');

  const stripeColor =
    p === 'high' ? 'bg-rose-500' :
    p === 'medium' ? 'bg-amber-500' :
    'bg-slate-300';

  return (
    <div className="flex items-center space-x-2 font-mono text-xs text-slate-700">
      <span className={`w-1 h-3.5 rounded-full ${stripeColor}`} />
      <span className="font-semibold">{formatted}</span>
    </div>
  );
}
