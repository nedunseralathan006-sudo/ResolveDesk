import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Complaints } from '@/pages/Complaints';
import { RegisterComplaint } from '@/pages/RegisterComplaint';
import { ComplaintDetails } from '@/pages/ComplaintDetails';
import { MyTickets } from '@/pages/MyTickets';
import { SlaReports } from '@/pages/SlaReports';
import { Settings } from '@/pages/Settings';
import { CustomerFeedback } from '@/pages/CustomerFeedback';
import { Customers } from '@/pages/Customers';
import { Users } from '@/pages/Users';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><ErrorBoundary><AppLayout><Navigate to="/dashboard" replace /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><AppLayout><Dashboard /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute><ErrorBoundary><AppLayout><Complaints /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/complaints/new" element={<ProtectedRoute><ErrorBoundary><AppLayout><RegisterComplaint /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/complaints/:id" element={<ProtectedRoute><ErrorBoundary><AppLayout><ComplaintDetails /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/complaints/:id/feedback" element={<ProtectedRoute><ErrorBoundary><AppLayout><CustomerFeedback /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><ErrorBoundary><AppLayout><MyTickets /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/sla-reports" element={<ProtectedRoute><ErrorBoundary><AppLayout><SlaReports /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><ErrorBoundary><AppLayout><Customers /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><ErrorBoundary><AppLayout><Users /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><AppLayout><Settings /></AppLayout></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><ErrorBoundary><AppLayout><div className="p-8 text-center"><h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2><p>The requested page does not exist.</p></div></AppLayout></ErrorBoundary></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
