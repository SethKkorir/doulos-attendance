import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const username = (localStorage.getItem('username') || '').trim();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    const isAuthorizedAdmin = username.toLowerCase() === 'seth' && !!token;

    if ((!token && !isGuest) || (!isGuest && !isAuthorizedAdmin)) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
