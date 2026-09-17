import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin';
import G5TrainingPortal from './pages/G5TrainingPortal';
import G2OperationsPortal from './pages/G2OperationsPortal';

import CheckIn from './pages/CheckIn';
import StudentPortal from './pages/StudentPortal';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import GuestEntry from './pages/GuestEntry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/g5/portal"
          element={
            <ProtectedRoute>
              <G5TrainingPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/g2/portal"
          element={
            <ProtectedRoute>
              <G2OperationsPortal />
            </ProtectedRoute>
          }
        />
      </Routes >
    </Router >
    </QueryClientProvider>
  );
}

export default App;
