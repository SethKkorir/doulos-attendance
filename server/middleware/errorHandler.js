import downtimeManager from './downtimeManager.js';

const errorHandler = (err, req, res, next) => {
    console.error(`[CRITICAL ERROR] ${new Date().toISOString()}`);
    console.error(`Path: ${req.path}`);
    console.error(`Method: ${req.method}`);
    console.error(`Message: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }

    // Token Expired Error
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    // Default Error Handling via Downtime Manager
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    if (statusCode === 500) {
        return downtimeManager.renderDowntime(
            res, 
            'System Latency Optimization', 
            'Our system detected a minor inconsistency and is performing a safety bypass. We will be back in less than a minute.', 
            500
        );
    }

    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

export default errorHandler;
