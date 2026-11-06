import React from 'react';
import { StatCard } from '../common/StatCard';
import { Share2, Clock, CheckCircle2, AlertTriangle, Layers, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ManagerDashboard = ({ data }) => {
  const counts = data?.counts || {};
  const myDelegatedCount = data?.my_delegated_count || 0;
  const underReviewCount = data?.under_review_count || 0;
  const teamWorkloads = data?.team_workloads || [];
  const recentActivities = data?.recent_activities || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Delegated by Me"
          value={myDelegatedCount}
          icon={Share2}
          color="indigo"
          subtitle="Active hand-offs"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          icon={Layers}
          color="purple"
          subtitle="Waiting for your sign-off"
        />
        <StatCard
          title="Team In Progress"
          value={counts.in_progress_tasks}
          icon={Clock}
          color="amber"
          subtitle="Current development"
        />
        <StatCard
          title="Overdue Tasks"
          value={counts.overdue_tasks}
          icon={AlertTriangle}
          color="rose"
          subtitle="Needs reassignment"
        />
      </div>

      {/* Review Queue Alert if any */}
      {underReviewCount > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">
                You have {underReviewCount} task(s) submitted for review
              </p>
              <p className="text-xs text-purple-700">
                Employees have completed work and submitted deliverables for your approval or revision request.
              </p>
            </div>
          </div>
          <Link
            to="/tasks/delegated-by-me?status=under_review"
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Review Deliverables →
          </Link>
        </div>
      )}

      {/* Team Workload & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Team Member Workloads</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3 text-center">Active</th>
                  <th className="py-2.5 px-3 text-center">Done</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamWorkloads.map((w, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900">{w.user.full_name}</p>
                      <p className="text-[10px] text-slate-400">{w.user.designation}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{w.active_tasks}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{w.completed_tasks}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">{w.overdue_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Delegated Task Updates</span>
          </h3>
          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No recent task activities.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-start justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{act.user_name}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{act.description}</p>
                    <p className="text-indigo-600 font-medium text-[10px] mt-0.5">[{act.task_title}]</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-3">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
