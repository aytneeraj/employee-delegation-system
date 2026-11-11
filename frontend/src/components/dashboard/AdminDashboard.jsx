import React from 'react';
import { StatCard } from '../common/StatCard';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard = ({ data }) => {
  const counts = data?.counts || {};
  const priorityDist = data?.priority_distribution || [];
  const statusDist = data?.status_distribution || [];
  const deptDist = data?.department_distribution || [];
  const workloads = data?.employee_workloads || [];
  const recentActivities = data?.recent_activities || [];

  const COLORS = ['#6366f1', '#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-6">
      {/* 1. KPI Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={counts.total_employees}
          icon={Users}
          color="indigo"
          subtitle="Active workforce"
        />
        <StatCard
          title="Total Projects"
          value={counts.total_projects}
          icon={Briefcase}
          color="blue"
          subtitle="Active initiatives"
        />
        <StatCard
          title="Total Tasks"
          value={counts.total_tasks}
          icon={FileText}
          color="purple"
          subtitle="Company wide"
        />
        <StatCard
          title="Overdue Tasks"
          value={counts.overdue_tasks}
          icon={AlertTriangle}
          color="rose"
          trend="down"
          subtitle="Attention required"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="In Progress"
          value={counts.in_progress_tasks}
          icon={Clock}
          color="amber"
          subtitle="Active work"
        />
        <StatCard
          title="Under Review"
          value={counts.under_review_tasks}
          icon={Layers}
          color="purple"
          subtitle="Pending approval"
        />
        <StatCard
          title="Completed"
          value={counts.completed_tasks}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Verified complete"
        />
        <StatCard
          title="Active System"
          value="100%"
          icon={Activity}
          color="indigo"
          subtitle="Operational"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span>
            <span>Task Distribution by Priority</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm"></span>
            <span>Task Workflow Statuses</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Department Performance & Workload Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Department Task Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Employees</th>
                  <th className="py-2.5 px-3 text-right">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptDist.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.department_name}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{d.employee_count}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600">{d.task_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Workload */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Employee Workload Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Active</th>
                  <th className="py-2.5 px-3 text-center">Done</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloads.slice(0, 6).map((w, i) => (
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
      </div>

      {/* 4. Recent System Activities */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Real-Time Task Activities & Audit Trail</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {recentActivities.map((act) => (
            <div key={act.id} className="py-3 flex items-start justify-between text-xs">
              <div>
                <p className="text-slate-800">
                  <span className="font-bold text-slate-900">{act.user_name}</span>: {act.description}
                </p>
                <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Task: {act.task_title}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 ml-4">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

