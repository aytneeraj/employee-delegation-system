import React from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../common/StatCard';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import {
  CheckSquare,
  Share2,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

export const EmployeeDashboard = ({ data, onOpenCreateTask }) => {
  const assignedCount = data?.assigned_to_me_count || 0;
  const delegatedCount = data?.delegated_by_me_count || 0;
  const inProgressCount = data?.in_progress_count || 0;
  const underReviewCount = data?.under_review_count || 0;
  const completedCount = data?.completed_count || 0;
  const overdueCount = data?.overdue_count || 0;
  const upcomingDeadlines = data?.upcoming_deadlines || [];
  const recentAssigned = data?.recent_assigned_tasks || [];

  return (
    <div className="space-y-6">
      {/* 1. Quick Welcome & Action */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Employee Task & Delegation Hub</h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-xl">
            Manage your personal backlog, collaborate with teammates, and delegate specialized tasks across departments while maintaining end-to-end accountability.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenCreateTask}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Delegate Work</span>
          </button>
          <Link
            to="/tasks/my-tasks"
            className="px-4 py-2.5 bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            My Assigned Backlog
          </Link>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Assigned to Me"
          value={assignedCount}
          icon={CheckSquare}
          color="indigo"
        />
        <StatCard
          title="Delegated by Me"
          value={delegatedCount}
          icon={Share2}
          color="blue"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* 3. Deadlines and Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Deadlines</span>
            </h3>
            <Link to="/tasks/my-tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No active upcoming deadlines! You are all caught up.</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    task.is_overdue
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">[{task.task_code}]</span>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate block"
                    >
                      {task.title}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-semibold block ${task.is_overdue ? 'text-rose-700' : 'text-slate-600'}`}>
                      {task.due_date}
                    </span>
                    {task.is_overdue && (
                      <span className="text-[10px] font-bold text-rose-600 uppercase">Overdue</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Assigned To Me */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Recent Tasks Assigned To Me</span>
            </h3>
            <Link to="/tasks/my-tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Backlog →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAssigned.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No assigned tasks currently.</p>
            ) : (
              recentAssigned.map((task) => (
                <div key={task.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">[{task.task_code}]</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate block"
                    >
                      {task.title}
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Delegated by: <span className="font-medium text-slate-800">{task.delegated_by}</span>
                    </p>
                  </div>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
