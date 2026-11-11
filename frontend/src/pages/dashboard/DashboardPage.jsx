import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { ManagerDashboard } from '../../components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from '../../components/dashboard/EmployeeDashboard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const outlet = useOutletContext();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await reportService.getDashboardMetrics();
      setMetrics(resp);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch real-time dashboard analytics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading real-time company analytics..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900">Dashboard Unavailable</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const role = metrics?.role || user?.role;
  const data = metrics?.data || {};

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'admin'
              ? 'Administrator Command Center'
              : role === 'manager'
              ? 'Manager & Team Lead Overview'
              : 'My Workspace & Delegation Backlog'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time database statistics and activity audit trail
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Render Role-Specific Dashboard */}
      {role === 'admin' && <AdminDashboard data={data} />}
      {role === 'manager' && <ManagerDashboard data={data} />}
      {role === 'employee' && (
        <EmployeeDashboard data={data} onOpenCreateTask={outlet?.openCreateTask} />
      )}
    </div>
  );
};

