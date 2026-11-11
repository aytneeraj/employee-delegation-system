import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskDelegateModal } from '../../components/tasks/TaskDelegateModal';
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Filter, Search, CheckSquare, RefreshCw } from 'lucide-react';

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [delegateTask, setDelegateTask] = useState(null);
  const [statusTask, setStatusTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const data = await taskService.getMyTasks(params);
      setTasks(data);
    } catch (e) {
      console.error('Failed to load my tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.task_code.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>My Assigned Tasks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tasks currently assigned to you for execution, delegation, or review submission
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="revision_required">Revision Required</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Fetching your assigned tasks..." />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No assigned tasks found"
          description={
            statusFilter || search
              ? 'No tasks match your selected filter criteria.'
              : 'You do not have any tasks currently assigned to you.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenDelegate={(t) => setDelegateTask(t)}
              onOpenStatus={(t) => setStatusTask(t)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {delegateTask && (
        <TaskDelegateModal
          isOpen={!!delegateTask}
          onClose={() => setDelegateTask(null)}
          task={delegateTask}
          onTaskDelegated={() => fetchTasks()}
        />
      )}

      {statusTask && (
        <TaskStatusModal
          isOpen={!!statusTask}
          onClose={() => setStatusTask(null)}
          task={statusTask}
          onStatusUpdated={() => fetchTasks()}
        />
      )}
    </div>
  );
};

