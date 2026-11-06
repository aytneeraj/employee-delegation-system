import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { TaskTimeline } from '../../components/tasks/TaskTimeline';
import { TaskDelegateModal } from '../../components/tasks/TaskDelegateModal';
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calendar,
  Share2,
  Clock,
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  User,
  Send,
  AlertCircle,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

export const TaskDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // New progress update form
  const [updateText, setUpdateText] = useState('');
  const [progressVal, setProgressVal] = useState(50);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // New comment form
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await taskService.getTaskDetail(id);
      setTask(data);
      setProgressVal(data.current_progress || 0);
    } catch (err) {
      console.error('Failed to load task:', err);
      setError(err.response?.data?.detail || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    try {
      setSubmittingUpdate(true);
      await taskService.addProgressUpdate(task.id, updateText.trim(), progressVal);
      setUpdateText('');
      fetchTask();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit progress update.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await taskService.addComment(task.id, commentText.trim());
      setCommentText('');
      fetchTask();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" message="Loading task details..." />;

  if (error || !task) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Task Not Accessible</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Task could not be found.'}</p>
        <Link
          to="/tasks"
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </Link>
      </div>
    );
  }

  const isOverdue =
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/tasks"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tasks Registry</span>
        </Link>

        <div className="flex items-center space-x-2.5">
          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <button
              onClick={() => setDelegateOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Delegate Task</span>
            </button>
          )}

          <button
            onClick={() => setStatusOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs shadow-indigo-600/30 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Update Workflow Status</span>
          </button>
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono font-bold text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100">
              {task.task_code}
            </span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Due Date:</span>
            <span className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
              {task.due_date}
            </span>
            {isOverdue && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Overdue
              </span>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{task.title}</h1>

        <div className="mt-4 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
          {task.description}
        </div>

        {/* Project & Meta tags */}
        {task.project && (
          <div className="mt-4 flex items-center space-x-2 text-xs text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span>Project:</span>
            <span className="font-semibold text-slate-900">[{task.project.code}] {task.project.name}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Overall Completion Progress</span>
            <span className="text-indigo-600">{task.current_progress || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${task.current_progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stakeholders & Chain Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Assignee</p>
          <div className="flex items-center space-x-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              {task.current_assignee?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{task.current_assignee?.full_name}</p>
              <p className="text-[10px] text-slate-500">{task.current_assignee?.designation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delegated By</p>
          <div className="flex items-center space-x-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
              {task.delegated_by?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{task.delegated_by?.full_name}</p>
              <p className="text-[10px] text-slate-500">{task.delegated_by?.designation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original Creator</p>
          <div className="flex items-center space-x-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
              {task.created_by?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{task.created_by?.full_name}</p>
              <p className="text-[10px] text-slate-500">{task.created_by?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Progress & Comments vs Delegation Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Progress Updates & Collaborative Comments */}
        <div className="space-y-6">
          {/* Progress Updates Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Submit Progress Update</span>
            </h3>

            <form onSubmit={handleAddProgress} className="space-y-3">
              <textarea
                rows={2}
                required
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Describe completed deliverables, API tests, or current milestone status..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center space-x-3">
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">Progress: {progressVal}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 shrink-0"
                >
                  {submittingUpdate ? 'Saving...' : 'Post Update'}
                </button>
              </div>
            </form>

            {/* Historical Updates */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Past Progress Reports</h4>
              {task.updates?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No progress reports submitted yet.</p>
              ) : (
                task.updates?.map((upd) => (
                  <div key={upd.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{upd.user?.full_name}</span>
                      <span className="font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                        {upd.progress_percentage}% Completed
                      </span>
                    </div>
                    <p className="text-slate-700">{upd.update_text}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {new Date(upd.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Collaborative Comments Discussion */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Task Discussion & Comments</span>
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
              {task.comments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No comments yet. Start a discussion with your delegator or assignee.
                </p>
              ) : (
                task.comments?.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{c.user?.full_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700">{c.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a message or note..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Visual Delegation Timeline & Audit History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <TaskTimeline
            assignments={task.assignments || []}
            statusHistory={task.status_history || []}
          />
        </div>
      </div>

      {/* Delegation Modal */}
      {delegateOpen && (
        <TaskDelegateModal
          isOpen={delegateOpen}
          onClose={() => setDelegateOpen(false)}
          task={task}
          onTaskDelegated={() => fetchTask()}
        />
      )}

      {/* Status Modal */}
      {statusOpen && (
        <TaskStatusModal
          isOpen={statusOpen}
          onClose={() => setStatusOpen(false)}
          task={task}
          onStatusUpdated={() => fetchTask()}
        />
      )}
    </div>
  );
};
