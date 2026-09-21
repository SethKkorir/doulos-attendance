import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    let token = req.header('Authorization')?.split(' ')[1];
    if (!token && req.cookies) {
        token = req.cookies.doulos_session_token || req.cookies.token;
    }
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        const allowedRoles = [
            'admin', 'superadmin', 'developer', 'trainer',
            'g1_coordinator', 'g1', 'g2_vice', 'g2_operations', 'g2_assistant', 'g2', 'operations',
            'g3_secretary', 'g3', 'g4_logistics', 'g4',
            'g5_training', 'g5', 'g6_welfare', 'g6', 'g7_treasurer', 'g7', 'g8_assets', 'g8', 'g9_media', 'g9'
        ];
        const userRole = (req.user?.role || '').toLowerCase();
        if (allowedRoles.includes(userRole) || userRole.startsWith('g')) {
            next();
        } else {
            res.status(403).json({ message: 'G-Council or Admin access required' });
        }
    });
};

export const optionalVerify = (req, res, next) => {
    let token = req.header('Authorization')?.split(' ')[1];
    if (!token && req.cookies) {
        token = req.cookies.doulos_session_token || req.cookies.token;
    }
    if (!token) return next();

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        // Just proceed without user if token is invalid
        next();
    }
};
