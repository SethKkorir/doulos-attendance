import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
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
            'g1_coordinator', 'g2_vice', 'g3_secretary', 'g4_logistics', 
            'g5_training', 'g6_welfare', 'g7_treasurer', 'g8_assets', 'g9_media'
        ];
        if (allowedRoles.includes(req.user?.role) || (req.user?.role && req.user.role.startsWith('g'))) {
            next();
        } else {
            res.status(403).json({ message: 'G-Council or Admin access required' });
        }
    });
};

export const optionalVerify = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
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
