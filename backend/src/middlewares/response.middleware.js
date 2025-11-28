// backend/src/middlewares/response.middleware.js

/**
 * Middleware que agrega helpers a la respuesta:
 *  - res.success(data?, message?, status?)
 *  - res.fail(status?, message?, errors?)
 */
export function responseMiddleware(req, res, next) {
    /**
     * Respuesta exitosa estándar.
     * @param {any} data    Datos a devolver (opcional)
     * @param {string} message Mensaje opcional
     * @param {number} status  Código HTTP (por defecto 200)
     */
    res.success = function (data = null, message = null, status = 200) {
        const body = { ok: true };

        if (message) body.message = message;
        if (data !== null && data !== undefined) body.data = data;

        return res.status(status).json(body);
    };

    /**
     * Respuesta de error estándar.
     * @param {number} status  Código HTTP (por defecto 500)
     * @param {string} message Mensaje de error
     * @param {any} errors     Detalle extra de errores (opcional)
     */
    res.fail = function (status = 500, message = 'Error interno del servidor', errors = null) {
        const body = {
            ok: false,
            message: message || 'Error interno del servidor'
        };

        if (errors) {
            body.errors = errors;
        }

        return res.status(status).json(body);
    };

    next();
}
