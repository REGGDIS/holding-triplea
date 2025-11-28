// backend/src/middlewares/error.middleware.js

/**
 * Middleware para rutas no encontradas (404).
 * Debe ir DESPUÉS de registrar todas las rutas.
 */
export function notFoundHandler(req, res, next) {
    if (res.headersSent) {
        return next();
    }

    return res.status(404).json({
        ok: false,
        message: 'Ruta no encontrada.'
    });
}

/**
 * Middleware de manejo global de errores.
 * Debe ser el ÚLTIMO middleware del app.
 */
export function errorHandler(err, req, res, next) {
    console.error('Error no manejado:', err);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor.';

    return res.status(status).json({
        ok: false,
        message
    });
}
