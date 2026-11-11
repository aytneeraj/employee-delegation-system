import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Share2,
  FolderGit2,
  Users,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  X,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = ({ isOpen, onClose, onOpenCreateTask }) => {
  const { user, isAdmin, isManager } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Assigned Tasks',
      to: '/tasks/my-tasks',
      icon: CheckSquare,
    },
    {
      label: 'Delegated by Me',
      to: '/tasks/delegated-by-me',
      icon: Share2,
    },
    {
      label: 'All Company Tasks',
      to: '/tasks',
      icon: FolderGit2,
    },
    {
      label: 'Employees',
      to: '/employees',
      icon: Users,
    },
    {
      label: 'Projects',
      to: '/projects',
      icon: Briefcase,
    },
    {
      label: 'Reports & Analytics',
      to: '/reports',
      icon: BarChart3,
    },
    {
      label: 'Notifications',
      to: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      label: 'Profile & Settings',
      to: '/profile',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-sm">
              ED
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">TaskDelegator</span>
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Enterprise v1.0</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action button: Create & Delegate Task */}
        <div className="px-4 py-4">
          <button
            onClick={() => {
              if (onOpenCreateTask) onOpenCreateTask();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-900/50 transition-all duration-150 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create & Delegate Task</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom user profile tile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role} Account</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

