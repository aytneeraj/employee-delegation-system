import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, UserCheck } from 'lucide-react';

export const TaskCreateModal = ({ isOpen, onClose, onTaskCreated }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    current_assignee_id: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      setError('');
      setFormData({
        title: '',
        description: '',
        project_id: '',
        current_assignee_id: '',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [usersData, projectsData] = await Promise.all([
        userService.getUsers({ is_active: true }),
        projectService.getProjects({ status: 'active' }),
      ]);
      setEmployees(usersData);
      setProjects(projectsData);
    } catch (e) {
      console.error('Failed to load modal data:', e);
      setError('Could not load employees or projects list.');
    } finally {
      setLoading(false);
    }
  };

  // Filter out current user if employee (no self assignment)
  const assignableEmployees = employees.filter((emp) => {
    if (user?.role === 'employee') {
      return emp.id !== user.id;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    if (!formData.current_assignee_id) {
      setError('Please select an employee to assign this task.');
      return;
    }
    if (!formData.due_date) {
      setError('Please select a valid deadline.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || 'No description provided.',
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        current_assignee_id: parseInt(formData.current_assignee_id),
        priority: formData.priority,
        due_date: formData.due_date,
      };

      const created = await taskService.createTask(payload);
      if (onTaskCreated) onTaskCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(err.response?.data?.detail || 'Failed to create and assign task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create & Delegate Task" maxWidth="max-w-xl">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {user?.role === 'employee' && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-start space-x-2">
          <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Employee Delegation Rule:</strong> You are delegating work to another team member. You will remain tracked as the delegator and will review their completed work before closure.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Implement OAuth2 Refresh Token Service"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign / Delegate To <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.current_assignee_id}
              onChange={(e) => setFormData({ ...formData, current_assignee_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 bg-white"
            >
              <option value="">Select Employee...</option>
              {assignableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Project
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 bg-white"
            >
              <option value="">None / General Task</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  [{proj.code}] {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 bg-white capitalize"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date / Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Description & Acceptance Criteria
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed requirements, deliverables, API specifications, or instructions..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign & Delegate Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

