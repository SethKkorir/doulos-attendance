import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');
    // In a real app, verify token validity/expiration here or via API check

    if (!token) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
