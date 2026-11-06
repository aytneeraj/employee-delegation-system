import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MyTasksPage } from './pages/tasks/MyTasksPage';
import { DelegatedByMePage } from './pages/tasks/DelegatedByMePage';
import { AllTasksPage } from './pages/tasks/AllTasksPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks/my-tasks" element={<MyTasksPage />} />
              <Route path="tasks/delegated-by-me" element={<DelegatedByMePage />} />
              <Route path="tasks" element={<AllTasksPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
