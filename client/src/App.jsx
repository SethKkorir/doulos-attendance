import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin';

import CheckIn from './pages/CheckIn';
import StudentPortal from './pages/StudentPortal';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import GuestEntry from './pages/GuestEntry';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/guest" element={<GuestEntry />} />

        {/* Student Routes */}
        <Route path="/check-in/:meetingCode" element={<CheckIn />} />
        <Route path="/portal" element={<StudentPortal />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/superadmin" element={<SuperAdmin />} />
      </Routes >
    </Router >
  );
}

export default App;
