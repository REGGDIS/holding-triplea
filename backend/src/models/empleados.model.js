// backend/src/models/empleados.model.js
import pool from '../config/db.js';

/**
 * Lista empleados (opcionalmente filtrados por empresa y/o solo activos).
 */
export async function findAllEmpleados({ empresaId = null, soloActivos = true } = {}) {
    let query = `
    SELECT
      e.id,
      e.empresa_id,
      em.nombre AS empresa_nombre,
      e.nombre_completo,
      e.rut,
      e.estado_civil_id,
      ec.nombre AS estado_civil_nombre,
      e.comuna_id,
      c.nombre AS comuna_nombre,
      e.direccion,
      e.telefono,
      e.email,
      e.cargo,
      e.fecha_nacimiento,
      e.fecha_ingreso,
      e.fecha_egreso,
      e.activo,
      e.creado_en,
      e.actualizado_en
    FROM empleados e
    JOIN empresas em ON e.empresa_id = em.id
    LEFT JOIN estados_civiles ec ON e.estado_civil_id = ec.id
    LEFT JOIN comunas c ON e.comuna_id = c.id
    WHERE 1 = 1
  `;

    const params = [];

    if (soloActivos) {
        query += ' AND e.activo = 1';
    }

    if (empresaId) {
        query += ' AND e.empresa_id = ?';
        params.push(empresaId);
    }

    query += ' ORDER BY em.nombre, e.nombre_completo';

    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Busca un empleado por ID (incluye datos de empresa, estado civil y comuna).
 */
export async function findEmpleadoById(id) {
    const query = `
    SELECT
      e.id,
      e.empresa_id,
      em.nombre AS empresa_nombre,
      e.nombre_completo,
      e.rut,
      e.estado_civil_id,
      ec.nombre AS estado_civil_nombre,
      e.comuna_id,
      c.nombre AS comuna_nombre,
      e.direccion,
      e.telefono,
      e.email,
      e.cargo,
      e.fecha_nacimiento,
      e.fecha_ingreso,
      e.fecha_egreso,
      e.activo,
      e.creado_en,
      e.actualizado_en
    FROM empleados e
    JOIN empresas em ON e.empresa_id = em.id
    LEFT JOIN estados_civiles ec ON e.estado_civil_id = ec.id
    LEFT JOIN comunas c ON e.comuna_id = c.id
    WHERE e.id = ?
    LIMIT 1
  `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
}

/**
 * Crea un nuevo empleado.
 */
export async function createEmpleado(data) {
    const query = `
    INSERT INTO empleados (
      empresa_id,
      nombre_completo,
      rut,
      estado_civil_id,
      comuna_id,
      direccion,
      telefono,
      email,
      cargo,
      fecha_nacimiento,
      fecha_ingreso,
      fecha_egreso,
      activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
        data.empresa_id,
        data.nombre_completo,
        data.rut,
        data.estado_civil_id ?? null,
        data.comuna_id ?? null,
        data.direccion ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.cargo ?? null,
        data.fecha_nacimiento ?? null, // 'YYYY-MM-DD' o null
        data.fecha_ingreso ?? null,
        data.fecha_egreso ?? null,
        data.activo ?? 1
    ];

    const [result] = await pool.query(query, values);
    return result.insertId;
}

/**
 * Actualiza un empleado (update parcial: solo los campos enviados).
 */
export async function updateEmpleado(id, data) {
    const camposPermitidos = [
        'empresa_id',
        'nombre_completo',
        'rut',
        'estado_civil_id',
        'comuna_id',
        'direccion',
        'telefono',
        'email',
        'cargo',
        'fecha_nacimiento',
        'fecha_ingreso',
        'fecha_egreso',
        'activo'
    ];

    const sets = [];
    const values = [];

    for (const campo of camposPermitidos) {
        if (data[campo] !== undefined) {
            sets.push(`${campo} = ?`);
            values.push(data[campo]);
        }
    }

    if (sets.length === 0) {
        // Nada que actualizar
        return { affectedRows: 0 };
    }

    const query = `
    UPDATE empleados
    SET ${sets.join(', ')}
    WHERE id = ?
  `;
    values.push(id);

    const [result] = await pool.query(query, values);
    return result;
}

/**
 * "Elimina" un empleado marcándolo como inactivo (activo = 0).
 */
export async function softDeleteEmpleado(id) {
    const query = `
    UPDATE empleados
    SET activo = 0
    WHERE id = ?
  `;
    const [result] = await pool.query(query, [id]);
    return result;
}
