import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const username = (localStorage.getItem('username') || '').trim();
    const role = (localStorage.getItem('role') || '').trim();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    const isAuthenticated = !!token && (
        ['seth', 'g5', 'g2', 'trainer', 'g2_vice', 'admin', 'superadmin'].includes(String(username).toLowerCase())
        || ['trainer', 'g2_vice', 'admin', 'superadmin'].includes(role.toLowerCase())
    );

    if (!isGuest && !isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
