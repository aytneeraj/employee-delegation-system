import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, loading } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const navigate = useNavigate();

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>In-App Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time alerts for task assignments, delegations, status changes, reviews, and deadline reminders
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={filter === 'unread' ? 'You have no unread notifications.' : 'Your notification inbox is clean.'}
          icon={Bell}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.is_read) markAsRead(item.id);
                if (item.task_id) navigate(`/tasks/${item.task_id}`);
              }}
              className={`p-4 flex items-start justify-between cursor-pointer transition-colors hover:bg-slate-50/80 ${
                !item.is_read ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0 pr-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !item.is_read ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`text-xs ${!item.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {item.title}
                    </p>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {item.task_id && (
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0 hover:bg-indigo-100 transition-colors">
                  View Task →
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
