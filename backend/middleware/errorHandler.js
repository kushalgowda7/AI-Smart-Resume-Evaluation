const logger = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    if (process.env.NODE_ENV === 'development') {
        logger.error(err.stack);
    }

    // Handle specific error types
    if (err.name === 'CastError') {
        err.message = 'Resource not found';
        err.statusCode = 404;
    }

    if (err.code === 11000) {
        err.message = 'Duplicate field value entered';
        err.statusCode = 400;
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        err.message = messages.join('. ');
        err.statusCode = 400;
    }

    if (err.name === 'JsonWebTokenError') {
        err.message = 'Invalid token. Please log in again.';
        err.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        err.message = 'Your session has expired. Please log in again.';
        err.statusCode = 401;
    }

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

module.exports = { AppError, errorHandler, notFound };
