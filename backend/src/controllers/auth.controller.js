// backend/src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

/**
 * Genera un JWT para un usuario.
 * El payload incluye info básica del usuario para usar en el frontend.
 */
function generarTokenJWT(usuario) {
    const payload = {
        sub: usuario.id, // "subject" del token
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol_nombre || null,
        rol_id: usuario.rol_id,
        empresa_id: usuario.empresa_id
    };

    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return token;
}

/**
 * Controlador: POST /api/auth/login
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // 1. Validación básica de campos
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                message: 'Debe ingresar email y contraseña.'
            });
        }

        // 2. Buscar usuario por email
        const query = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.password_hash,
        u.rol_id,
        u.empresa_id,
        u.activo,
        r.nombre AS rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
      LIMIT 1;
    `;

        const [rows] = await pool.query(query, [email]);

        if (rows.length === 0) {
            // Usuario no encontrado
            return res.status(401).json({
                ok: false,
                message: 'Credenciales inválidas.'
            });
        }

        const usuario = rows[0];

        // 3. (Opcional) Verificar si el usuario está activo
        // if (usuario.activo === 0) {
        //   return res.status(403).json({
        //     ok: false,
        //     message: 'Usuario inactivo. Contacte al administrador.'
        //   });
        // }

        // 4. Comparar contraseña (texto plano en esta primera versión)
        if (password !== usuario.password_hash) {
            return res.status(401).json({
                ok: false,
                message: 'Credenciales inválidas.'
            });
        }

        // 5. Generar JWT
        const token = generarTokenJWT(usuario);

        // 6. Construir objeto de usuario para el frontend
        const userResponse = {
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            email: usuario.email,
            rol: usuario.rol_nombre || null,
            rol_id: usuario.rol_id,
            empresa_id: usuario.empresa_id
        };

        return res.json({
            ok: true,
            message: 'Inicio de sesión exitoso.',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al intentar iniciar sesión.'
        });
    }
}

/**
 * Controlador: GET /api/auth/me
 * Llega aquí solo si el token fue validado por el middleware authRequired.
 */
export async function me(req, res) {
    try {
        // Gracias al middleware, tenemos info del usuario en req.user
        const usuarioId = req.user.id;

        // Opcional: refrescar datos desde la BD por si cambiaron
        const query = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.rol_id,
        u.empresa_id,
        u.activo,
        r.nombre AS rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
      LIMIT 1;
    `;

        const [rows] = await pool.query(query, [usuarioId]);

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado.'
            });
        }

        const usuario = rows[0];

        const userResponse = {
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            email: usuario.email,
            rol: usuario.rol_nombre || null,
            rol_id: usuario.rol_id,
            empresa_id: usuario.empresa_id
        };

        return res.json({
            ok: true,
            user: userResponse
        });
    } catch (error) {
        console.error('Error en /api/auth/me:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al obtener el usuario.'
        });
    }
}
