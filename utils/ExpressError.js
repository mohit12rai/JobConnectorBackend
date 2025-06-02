class ExpressError extends Error {
    constructor(message, statusCode) {
        super(message); // Ensure the message is properly set in Error
        this.statusCode = statusCode;
    }
}

const errorMiddleware = (error, req, res, next) => {
    // Default status and message
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Internal Server Error";

    // Handle specific errors
    if (error.name === "CastError") {
        const message = `Invalid ${error.path}`;
        error = new ExpressError(message, 400);
    }

    if (error.name === "JsonWebTokenError") {
        const message = `Invalid JSON Web Token`;
        error = new ExpressError(message, 400);
    }

    if (error.name === "TokenExpiredError") {
        const message = `JSON Web Token has expired. Please try again`;
        error = new ExpressError(message, 400);
    }

    // Send response
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
    });
    next(error);
};

module.exports = {
    ExpressError,
    errorMiddleware
};
