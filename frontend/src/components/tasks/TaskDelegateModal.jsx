import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { Share2, AlertCircle, History } from 'lucide-react';

export const TaskDelegateModal = ({ isOpen, onClose, task, onTaskDelegated }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setReason('');
      setTargetUserId('');
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      const data = await userService.getUsers({ is_active: true });
      // Exclude self (cannot assign to self) and exclude currently assigned user
      const filtered = data.filter(
        (emp) => emp.id !== user?.id && emp.id !== task?.current_assignee_id
      );
      setEmployees(filtered);
    } catch (e) {
      console.error('Failed to load employee list:', e);
      setError('Failed to load available employees.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId) {
      setError('Please select an employee to delegate this task to.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a clear reason for delegation / reassignment.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const updated = await taskService.delegateTask(task.id, parseInt(targetUserId), reason.trim());
      if (onTaskDelegated) onTaskDelegated(updated);
      onClose();
    } catch (err) {
      console.error('Failed to delegate task:', err);
      setError(err.response?.data?.detail || 'Failed to complete delegation workflow.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delegate Task (Controlled Reassignment)" maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task Summary Box */}
      <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">[{task?.task_code}] {task?.title}</span>
        </div>
        <p className="text-slate-500">Currently Assigned: <span className="font-medium text-slate-800">{task?.current_assignee?.full_name}</span></p>
      </div>

      {/* Audit Trail Guarantee Notice */}
      <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs flex items-start space-x-2.5">
        <History className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
        <div>
          <p className="font-semibold text-indigo-900">Full Audit History Preserved</p>
          <p className="text-indigo-700 mt-0.5">
            Previous assignments and actions remain recorded permanently. The target employee will receive an instant notification, and the task status will reset to <strong>Assigned</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Delegate To Employee <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 bg-white"
          >
            <option value="">Select Target Employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} — {emp.designation} ({emp.department?.name || 'General'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reassignment Reason & Hand-off Instructions <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this task is being delegated and provide any relevant context..."
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
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{submitting ? 'Delegating...' : 'Confirm Delegation'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

