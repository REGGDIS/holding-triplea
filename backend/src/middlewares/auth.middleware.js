// backend/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para proteger rutas que requieren autenticación.
 * Espera un header: Authorization: Bearer <token>
 */
export function authRequired(req, res, next) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            message: 'Token no proporcionado.'
        });
    }

    const token = authHeader.substring(7); // quitar "Bearer "

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos datos útiles del usuario en req.user
        req.user = {
            id: decoded.sub,
            nombre_completo: decoded.nombre_completo,
            email: decoded.email,
            rol: decoded.rol,
            rol_id: decoded.rol_id,
            empresa_id: decoded.empresa_id
        };

        return next();
    } catch (error) {
        console.error('Error al verificar token JWT:', error);

        return res.status(401).json({
            ok: false,
            message: 'Token inválido o expirado.'
        });
    }
}
