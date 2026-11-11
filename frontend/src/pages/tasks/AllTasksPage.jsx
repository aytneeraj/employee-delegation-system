import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskDelegateModal } from '../../components/tasks/TaskDelegateModal';
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FolderGit2,
  RefreshCw,
  Search,
  LayoutGrid,
  Kanban,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';

export const AllTasksPage = () => {
  const outlet = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'kanban'

  // Modals
  const [delegateTask, setDelegateTask] = useState(null);
  const [statusTask, setStatusTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectIdFilter) params.project_id = projectIdFilter;
      if (overdueOnly) params.is_overdue = true;

      const [tasksData, projectsData] = await Promise.all([
        taskService.getAllTasks(params),
        projectService.getProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const handleCreated = () => fetchTasks();
    window.addEventListener('taskCreated', handleCreated);
    return () => window.removeEventListener('taskCreated', handleCreated);
  }, [statusFilter, priorityFilter, projectIdFilter, overdueOnly]);

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.task_code.toLowerCase().includes(term) ||
      (t.current_assignee?.full_name && t.current_assignee.full_name.toLowerCase().includes(term))
    );
  });

  // Kanban column groupings
  const kanbanColumns = [
    { id: 'assigned', title: 'Assigned', color: 'border-indigo-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-400' },
    { id: 'under_review', title: 'Under Review', color: 'border-purple-400' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-indigo-600" />
            <span>All Company Tasks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete registry of company task delegations, statuses, and sprint progress
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => outlet?.openCreateTask()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs shadow-indigo-600/30 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
          <button
            onClick={fetchTasks}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and View bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, codes, assignees..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-2 w-full lg:w-auto overflow-x-auto">
          <select
            value={projectIdFilter}
            onChange={(e) => setProjectIdFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

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

          <button
            type="button"
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 ${
              overdueOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>
        </div>

        {/* View Switcher: Grid vs Kanban */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end lg:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
        </div>
      </div>

      {/* Main Task View */}
      {loading ? (
        <LoadingSpinner message="Loading task registry..." />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filter or search criteria."
        />
      ) : viewMode === 'grid' ? (
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
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => {
              if (col.id === 'assigned') return ['assigned', 'accepted'].includes(t.status);
              if (col.id === 'in_progress') return ['in_progress', 'revision_required'].includes(t.status);
              return t.status === col.id;
            });

            return (
              <div key={col.id} className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${col.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {col.title}
                  </span>
                  <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpenDelegate={(t) => setDelegateTask(t)}
                        onOpenStatus={(t) => setStatusTask(t)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
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

