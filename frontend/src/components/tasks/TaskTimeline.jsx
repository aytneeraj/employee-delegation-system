import React from 'react';
import { ArrowDown, CheckCircle, Clock, Share2, UserCheck, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const TaskTimeline = ({ assignments = [], statusHistory = [] }) => {
  return (
    <div className="space-y-6">
      {/* 1. Delegation / Assignment Chain */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span>Delegation Chain & Assignment History</span>
        </h4>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No assignment history recorded.</p>
        ) : (
          <div className="relative pl-6 space-y-4 border-l-2 border-indigo-200">
            {assignments.map((item, idx) => (
              <div key={item.id} className="relative">
                {/* Timeline node bullet */}
                <div
                  className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    item.is_current ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-300'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.is_current ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">
                        {item.from_user?.full_name || 'Creator'}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="text-xs font-bold text-indigo-600">
                        {item.to_user?.full_name || 'Assignee'}
                      </span>
                    </div>
                    {item.is_current && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        Current Assignee
                      </span>
                    )}
                  </div>

                  {item.reassignment_reason && (
                    <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Reason:</span> {item.reassignment_reason}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(item.assigned_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Status History Log */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Workflow Status Transitions</span>
        </h4>

        {statusHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No status history available.</p>
        ) : (
          <div className="space-y-2.5">
            {statusHistory.map((sh) => (
              <div key={sh.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800">{sh.changed_by?.full_name || 'User'}</span>
                    <span className="text-slate-400">changed status to</span>
                    <StatusBadge status={sh.to_status} />
                  </div>
                  {sh.comment && (
                    <p className="text-slate-600 mt-1 text-[11px] bg-slate-50 p-1.5 rounded-md">
                      {sh.comment}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-3">
                  {new Date(sh.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
