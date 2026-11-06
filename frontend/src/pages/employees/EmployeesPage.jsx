import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { RoleBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Search,
  PlusCircle,
  RefreshCw,
  UserX,
  UserCheck,
  Building,
  Shield,
  Mail,
  Calendar,
} from 'lucide-react';

export const EmployeesPage = () => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Employee Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    password: '',
    role: 'employee',
    department_id: '',
    designation: '',
    manager_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (deptFilter) params.department_id = deptFilter;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'active';

      const [usersData, deptData] = await Promise.all([
        userService.getUsers(params),
        userService.getDepartments(),
      ]);
      setEmployees(usersData);
      setDepartments(deptData);
    } catch (e) {
      console.error('Failed to load employees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [deptFilter, roleFilter, statusFilter]);

  const handleToggleStatus = async (targetUser) => {
    if (!isAdmin) return;
    const confirmMsg = targetUser.is_active
      ? `Are you sure you want to deactivate ${targetUser.full_name}? They will not be able to log in.`
      : `Reactivate account for ${targetUser.full_name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.toggleUserStatus(targetUser.id, !targetUser.is_active);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update employee status.');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError('');
      const payload = {
        ...newEmp,
        department_id: newEmp.department_id ? parseInt(newEmp.department_id) : null,
        manager_id: newEmp.manager_id ? parseInt(newEmp.manager_id) : null,
      };
      await userService.createUser(payload);
      setAddModalOpen(false);
      setNewEmp({
        employee_id: '',
        full_name: '',
        email: '',
        password: '',
        role: 'employee',
        department_id: '',
        designation: '',
        manager_id: '',
      });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to create employee:', err);
      setModalError(err.response?.data?.detail || 'Failed to register employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      emp.full_name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.employee_id.toLowerCase().includes(term) ||
      emp.designation.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Employee Directory & Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company personnel, departmental assignments, and access privileges
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isAdmin && (
            <button
              onClick={() => {
                setModalError('');
                setAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs shadow-indigo-600/30 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}
          <button
            onClick={fetchEmployees}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, designation..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white capitalize"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      {loading ? (
        <LoadingSpinner message="Fetching employee directory..." />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState title="No employees match your search" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.full_name}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="font-mono text-slate-400">[{emp.employee_id}]</span>
                            <span>•</span>
                            <span>{emp.designation}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <RoleBadge role={emp.role} />
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {emp.department ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                          {emp.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {emp.reporting_manager?.full_name || 'None'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {emp.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {emp.id !== user.id && (
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.is_active
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={emp.is_active ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            {emp.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal (Admin Only) */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Employee" maxWidth="max-w-xl">
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {modalError}
          </div>
        )}

        <form onSubmit={handleCreateEmployee} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP010"
                value={newEmp.employee_id}
                onChange={(e) => setNewEmp({ ...newEmp, employee_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jessica Morgan"
                value={newEmp.full_name}
                onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="jessica@company.com"
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newEmp.password}
                onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={newEmp.role}
                onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager / Team Lead</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior QA Engineer"
                value={newEmp.designation}
                onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newEmp.department_id}
                onChange={(e) => setNewEmp({ ...newEmp, department_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={newEmp.manager_id}
                onChange={(e) => setNewEmp({ ...newEmp, manager_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="">Select Manager...</option>
                {employees
                  .filter((m) => m.role === 'manager' || m.role === 'admin')
                  .map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.full_name} ({mgr.designation})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
