import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin';
import G5TrainingPortal from './pages/G5TrainingPortal';
import G2OperationsPortal from './pages/G2OperationsPortal';

import StudentPortal from './pages/StudentPortal';
import CheckIn from './pages/CheckIn';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const clearPersistedAuth = () => {
  const authKeys = ['token', 'role', 'username', 'campus', 'isGuest', 'studentSession', 'initialTab'];
  authKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Failed to clear auth storage key:', key, err);
    }
  });
};

clearPersistedAuth();

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
        <Route path="/guest" element={<Navigate to="/admin" replace />} />

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
