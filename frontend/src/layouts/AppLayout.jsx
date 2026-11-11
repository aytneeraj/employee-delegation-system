import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreateTask={() => setCreateTaskOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ openCreateTask: () => setCreateTaskOpen(true) }} />
        </main>
      </div>

      {/* Global Quick Create Task Modal */}
      <TaskCreateModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={() => {
          // Trigger custom event or reload if on tasks page
          window.dispatchEvent(new Event('taskCreated'));
        }}
      />
    </div>
  );
};

