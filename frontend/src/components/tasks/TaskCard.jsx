import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Share2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/Badge';

export const TaskCard = ({ task, onOpenDelegate, onOpenStatus }) => {
  const isOverdue =
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top badges: Code, Priority, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {task.task_code}
          </span>
          <div className="flex items-center space-x-1.5">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>

        {/* Task Title */}
        <Link
          to={`/tasks/${task.id}`}
          className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2"
        >
          {task.title}
        </Link>

        {/* Task Description */}
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        {/* Associated Project */}
        {task.project && (
          <div className="mt-3">
            <span className="inline-block text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
              {task.project.name}
            </span>
          </div>
        )}

        {/* Delegation Chain Info */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Delegated By:</span>
            <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
              {task.delegated_by?.full_name || 'System'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Assigned To:</span>
            <span className="font-semibold text-indigo-700 text-[11px] truncate max-w-[150px]">
              {task.current_assignee?.full_name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>Progress</span>
            <span className="font-semibold">{task.current_progress || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                task.status === 'completed'
                  ? 'bg-emerald-500'
                  : task.current_progress > 60
                  ? 'bg-indigo-600'
                  : 'bg-indigo-400'
              }`}
              style={{ width: `${task.current_progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Due date + Action buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className={`text-[11px] font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            {task.due_date}
          </span>
          {isOverdue && (
            <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
              Overdue
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {onOpenDelegate && task.status !== 'completed' && task.status !== 'cancelled' && (
            <button
              onClick={() => onOpenDelegate(task)}
              title="Delegate to another employee"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {onOpenStatus && task.status !== 'completed' && task.status !== 'cancelled' && (
            <button
              onClick={() => onOpenStatus(task)}
              title="Update status"
              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Status
            </button>
          )}

          <Link
            to={`/tasks/${task.id}`}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

