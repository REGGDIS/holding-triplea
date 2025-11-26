// backend/src/controllers/auth.controller.js
import pool from '../config/db.js';

function generarTokenParaUsuario(usuarioId) {
    return `fake-token-user-${usuarioId}`;
}

function extraerUsuarioIdDesdeToken(token) {
    if (!token || typeof token !== 'string') return null;

    const prefix = 'fake-token-user-';
    if (!token.startsWith(prefix)) return null;

    const idParte = token.slice(prefix.length);
    const id = Number(idParte);
    if (Number.isNaN(id)) return null;

    return id;
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                message: 'Debe ingresar email y contraseña.'
            });
        }

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
            return res.status(401).json({
                ok: false,
                message: 'Credenciales inválidas.'
            });
        }

        const usuario = rows[0];

        if (password !== usuario.password_hash) {
            return res.status(401).json({
                ok: false,
                message: 'Credenciales inválidas.'
            });
        }

        const token = generarTokenParaUsuario(usuario.id);

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

export async function me(req, res) {
    try {
        const authHeader = req.headers.authorization || '';
        let token = null;

        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            token = req.query.token || (req.body ? req.body.token : null);
        }

        if (!token) {
            return res.status(401).json({
                ok: false,
                message: 'Token no proporcionado.'
            });
        }

        const usuarioId = extraerUsuarioIdDesdeToken(token);

        if (!usuarioId) {
            return res.status(401).json({
                ok: false,
                message: 'Token inválido.'
            });
        }

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
