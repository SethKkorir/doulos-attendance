import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin';
import StudentScan from './pages/StudentScan';
import CheckIn from './pages/CheckIn';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Student Routes */}
        <Route path="/student" element={<StudentScan />} />
        <Route path="/check-in/:meetingCode" element={<CheckIn />} />

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
      </Routes>
    </Router>
  );
}

export default App;
