import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart3,
  RefreshCw,
  PieChart as PieIcon,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
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
  Legend,
} from 'recharts';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const metrics = await reportService.getDashboardMetrics();
      setData(metrics.data || {});
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner size="lg" message="Compiling analytics and performance metrics..." />;

  const counts = data?.counts || {};
  const priorityDist = data?.priority_distribution || [];
  const statusDist = data?.status_distribution || [];
  const deptDist = data?.department_distribution || [];
  const workloads = data?.employee_workloads || [];

  const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Reports, Analytics & Performance Metrics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time database aggregated reporting on company task throughput, workload distribution, and SLA adherence
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks Logged"
          value={counts.total_tasks}
          icon={BarChart3}
          color="indigo"
        />
        <StatCard
          title="Completed Tasks"
          value={counts.completed_tasks}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Backlog"
          value={(counts.in_progress_tasks || 0) + (counts.assigned_tasks || 0)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Tasks"
          value={counts.overdue_tasks}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Task Lifecycle Workflow Statuses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Task Volume by Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables: Department Metrics and Employee Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Department Task Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Headcount</th>
                  <th className="py-2.5 px-3 text-right">Active Tasks</th>
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

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Employee Workload & SLA Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Active</th>
                  <th className="py-2.5 px-3 text-center">Completed</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloads.map((w, i) => (
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
    </div>
  );
};
