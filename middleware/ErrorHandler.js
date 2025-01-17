module.exports = (app, config) => {
    const errorHandler = (err, req, res, next) => {
        console.error(err);

        if (!err.statusCode) {
            err.statusCode = 500;
        }

        const { statusCode, message } = err;

        res.status(statusCode).send({
            error: message,
        });

        next();
    };

    app.use(errorHandler);
    return app;
};