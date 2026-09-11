import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import NewComplaintPage from './pages/NewComplaintPage';
import ReportsPage from './pages/ReportsPage';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/tickets" />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user.role === ROLES.MANAGER) return <Navigate to="/dashboard" />;
  return <Navigate to="/tickets" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<RoleRoute allowedRoles={[ROLES.MANAGER]}><DashboardPage /></RoleRoute>} />
        <Route path="reports" element={<RoleRoute allowedRoles={[ROLES.MANAGER]}><ReportsPage /></RoleRoute>} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="complaints/new" element={<NewComplaintPage />} />
      </Route>
    </Routes>
  );
}
