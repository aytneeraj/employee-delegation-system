import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No items found', description = 'There are no records matching your criteria.', icon: Icon = Inbox, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 mb-4 ring-1 ring-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
