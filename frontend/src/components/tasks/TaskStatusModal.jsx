import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, RotateCcw, Play, Check, Send, AlertTriangle } from 'lucide-react';

export const TaskStatusModal = ({ isOpen, onClose, task, onStatusUpdated }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!task) return null;

  const isAssignee = task.current_assignee_id === user?.id;
  const isDelegator = task.delegated_by_id === user?.id;
  const isCreator = task.created_by_id === user?.id;
  const canApprove = isDelegator || isCreator || isManager || isAdmin;

  const handleTransition = async (targetStatus) => {
    try {
      setSubmitting(true);
      setError('');
      const updated = await taskService.updateTaskStatus(task.id, targetStatus, comment.trim());
      if (onStatusUpdated) onStatusUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.detail || 'Failed to update task status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Task Status & Workflow" maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">[{task.task_code}] {task.title}</p>
        <p className="text-slate-500 mt-0.5">Current Status: <span className="font-bold uppercase text-indigo-700">{task.status.replace('_', ' ')}</span></p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status Note / Feedback (Optional or Required for Revisions)
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add handover note, progress summary, or revision requirements..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-900"
          />
        </div>

        {/* Workflow Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* 1. Accept Task */}
          {task.status === 'assigned' && isAssignee && (
            <button
              onClick={() => handleTransition('accepted')}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Accept Task Assignment</span>
            </button>
          )}

          {/* 2. Start Work */}
          {['assigned', 'accepted', 'revision_required'].includes(task.status) && (isAssignee || isManager || isAdmin) && (
            <button
              onClick={() => handleTransition('in_progress')}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Start Working (Move to In Progress)</span>
            </button>
          )}

          {/* 3. Submit for Review */}
          {['in_progress', 'revision_required', 'accepted'].includes(task.status) && (isAssignee || isManager || isAdmin) && (
            <button
              onClick={() => handleTransition('under_review')}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit Work for Review</span>
            </button>
          )}

          {/* 4. Review Workflow (Approve or Request Revision) */}
          {task.status === 'under_review' && canApprove && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTransition('completed')}
                disabled={submitting}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Complete</span>
              </button>
              <button
                onClick={() => {
                  if (!comment.trim()) {
                    setError('Please provide feedback in the note above explaining the revision requirements.');
                    return;
                  }
                  handleTransition('revision_required');
                }}
                disabled={submitting}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request Revision</span>
              </button>
            </div>
          )}

          {task.status === 'under_review' && !canApprove && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-xs text-center font-medium">
              Task is currently submitted for review. Waiting for {task.delegated_by?.full_name || 'delegator'} to approve.
            </div>
          )}

          {/* Manager / Admin override */}
          {(isManager || isAdmin) && task.status !== 'cancelled' && (
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleTransition('cancelled')}
                disabled={submitting}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1 font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cancel Task</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
