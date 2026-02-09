const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error(`Path: ${req.path}`);
    console.error(`Method: ${req.method}`);
    console.error(`Message: ${err.message}`);
    console.error(err.stack);

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

    // Default Error
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

export default errorHandler;
