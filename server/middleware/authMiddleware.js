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

export const verifySpiritualCoordinator = (req, res, next) => {
    verifyToken(req, res, () => {
        const allowedRoles = [
            'g3', 'g3_secretary', 'g4', 'g4_logistics',
            'admin', 'superadmin', 'developer'
        ];
        const userRole = (req.user?.role || '').toLowerCase();
        const username = (req.user?.username || '').toLowerCase();
        if (
            allowedRoles.includes(userRole) ||
            userRole.startsWith('g3') ||
            userRole.startsWith('g4') ||
            username.startsWith('g3') ||
            username.startsWith('g4') ||
            username === 'superadmin' ||
            username === 'supersuperadmin' ||
            username === 'seth'
        ) {
            next();
        } else {
            res.status(403).json({ message: 'Access Denied: Spiritual Ministry (G3/G4) coordinator privileges required' });
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
