class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err.code === 11000) {
        // Handle duplicate key errors
        return res.status(400).json({
            error: true,
            message: 'رقم الهاتف مسجل مسبقاً'
        });
    }

    if (err.name === 'ValidationError') {
        // Handle validation errors
        return res.status(400).json({
            error: true,
            message: 'جميع الحقول مطلوبة'
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: true,
            message: 'يرجى تسجيل الدخول مجدداً'
        });
    }

    // Default error response
    res.status(err.statusCode).json({
        error: true,
        message: err.message || 'حدث خطأ في السيرفر'
    });
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler
};