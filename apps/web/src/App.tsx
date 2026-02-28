import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import DashboardLayout from './common/layouts/DashboardLayout';
import AdminLayout from './common/layouts/AdminLayout';
import StoreDashboardPage from './features/dashboard/pages/StoreDashboardPage';
import ClientListPage from './features/clients/pages/ClientListPage';
import FilesPage from './features/files/pages/FilesPage';
import FileDetailsPage from './features/files/pages/FileDetailsPage';
import StaffListPage from './features/staff/pages/StaffListPage';
import FinancePage from './features/staff/pages/FinancePage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import ComingSoonPage from './features/dashboard/pages/ComingSoonPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Admin Area */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/overview" element={<ComingSoonPage />} />
        </Route>

        {/* Store Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<StoreDashboardPage />} />
          <Route path="/clients" element={<ClientListPage />} />
          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/files/:id" element={<FileDetailsPage />} />
          <Route path="/expenses" element={<FinancePage />} />
          <Route path="/reports" element={<ComingSoonPage />} />
          <Route path="/settings" element={<ComingSoonPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
