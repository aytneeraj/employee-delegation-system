import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toLowerCase();
  
  const styles = {
    urgent: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
    high: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/10',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    low: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
  };

  const labels = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const activeStyle = styles[p] || 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${activeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {labels[p] || priority}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();

  const styles = {
    assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accepted: 'bg-sky-50 text-sky-700 border-sky-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    under_review: 'bg-purple-50 text-purple-700 border-purple-200',
    revision_required: 'bg-amber-50 text-amber-800 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    assigned: 'Assigned',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    under_review: 'Under Review',
    revision_required: 'Revision Required',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const activeStyle = styles[s] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeStyle}`}>
      {labels[s] || status}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const r = (role || '').toLowerCase();
  const styles = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const labels = {
    admin: 'Administrator',
    manager: 'Manager',
    employee: 'Employee',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[r] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {labels[r] || role}
    </span>
  );
};
