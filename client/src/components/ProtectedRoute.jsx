import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    // In a real app, verify token validity/expiration here or via API check

    if (!token && !isGuest) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
