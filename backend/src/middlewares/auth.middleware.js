// backend/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación con JWT.
 * Espera un header: Authorization: Bearer <token>
 */
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            message: 'No se proporcionó un token de autenticación.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const decoded = jwt.verify(token, secret);

        // Ajusta los campos según lo que firmes en el login
        req.user = {
            id: decoded.id,
            email: decoded.email,
            nombre_completo: decoded.nombre_completo,
            rol: decoded.rol,
            empresa_id: decoded.empresa_id,
        };

        next();
    } catch (error) {
        console.error('Error al verificar token JWT:', error);
        return res.status(401).json({
            ok: false,
            message: 'Token inválido o expirado.',
        });
    }
};

// Alias para mantener compatibilidad con auth.routes.js
export const authRequired = authMiddleware;

// También lo exportamos como default
export default authMiddleware;
