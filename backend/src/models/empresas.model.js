// backend/src/models/empresas.model.js
import pool from '../config/db.js';

/**
 * Lista empresas, opcionalmente solo las activas.
 */
export async function findAllEmpresas({ soloActivas = true } = {}) {
    let sql = `
    SELECT
      e.id,
      e.nombre,
      e.rut,
      e.giro,
      e.direccion,
      e.comuna_id,
      c.nombre AS comuna_nombre,
      e.telefono,
      e.correo_contacto,
      e.activo,
      e.creado_en,
      e.actualizado_en
    FROM empresas e
    LEFT JOIN comunas c ON e.comuna_id = c.id
  `;

    const params = [];

    if (soloActivas) {
        sql += ' WHERE e.activo = 1';
    }

    sql += ' ORDER BY e.nombre';

    const [rows] = await pool.query(sql, params);
    return rows;
}

/**
 * Busca una empresa por ID.
 */
export async function findEmpresaById(id) {
    const sql = `
    SELECT
      e.id,
      e.nombre,
      e.rut,
      e.giro,
      e.direccion,
      e.comuna_id,
      c.nombre AS comuna_nombre,
      e.telefono,
      e.correo_contacto,
      e.activo,
      e.creado_en,
      e.actualizado_en
    FROM empresas e
    LEFT JOIN comunas c ON e.comuna_id = c.id
    WHERE e.id = ?
    LIMIT 1
  `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
}

/**
 * Crea una nueva empresa y devuelve el ID generado.
 */
export async function createEmpresa(data) {
    const {
        nombre,
        rut,
        giro,
        direccion,
        comuna_id,
        telefono,
        correo_contacto,
        activo = 1
    } = data;

    const sql = `
    INSERT INTO empresas (
      nombre,
      rut,
      giro,
      direccion,
      comuna_id,
      telefono,
      correo_contacto,
      activo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        nombre,
        rut,
        giro,
        direccion,
        comuna_id || null,
        telefono,
        correo_contacto,
        activo
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
}

/**
 * Actualiza parcialmente una empresa.
 */
export async function updateEmpresa(id, data) {
    // Construcción dinámica del UPDATE según los campos recibidos
    const campos = [];
    const params = [];

    const columnasPermitidas = [
        'nombre',
        'rut',
        'giro',
        'direccion',
        'comuna_id',
        'telefono',
        'correo_contacto',
        'activo'
    ];

    for (const key of columnasPermitidas) {
        if (data[key] !== undefined) {
            campos.push(`${key} = ?`);
            params.push(data[key]);
        }
    }

    if (campos.length === 0) {
        // Nada que actualizar
        return { affectedRows: 0 };
    }

    const sql = `
    UPDATE empresas
    SET ${campos.join(', ')}
    WHERE id = ?
  `;

    params.push(id);

    const [result] = await pool.query(sql, params);
    return result;
}

/**
 * "Elimina" la empresa marcándola como inactiva.
 */
export async function softDeleteEmpresa(id) {
    const sql = `
    UPDATE empresas
    SET activo = 0
    WHERE id = ?
  `;

    const [result] = await pool.query(sql, [id]);
    return result;
}
