// backend/src/models/asistencias.model.js
import pool from '../config/db.js';

/**
 * Registra un nuevo evento de asistencia.
 * data: { empleado_id, fecha, hora?, hora_salida?, tipo_id, observaciones? }
 */
export async function createAsistencia(data) {
  const query = `
    INSERT INTO asistencias (
      empleado_id,
      fecha,
      hora,
      hora_salida,
      tipo_id,
      observaciones
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.empleado_id,
    data.fecha,               // 'YYYY-MM-DD'
    data.hora ?? null,        // 'HH:MM:SS' o null
    data.hora_salida ?? null, // 'HH:MM:SS' o null
    data.tipo_id,
    data.observaciones ?? null
  ];

  const [result] = await pool.query(query, values);
  return result.insertId;
}

// Actualiza una asistencia completa por ID
export async function updateAsistencia(id, data) {
  const query = `
    UPDATE asistencias
    SET
      empleado_id = ?,
      fecha        = ?,
      hora         = ?,
      hora_salida  = ?,
      tipo_id      = ?,
      observaciones = ?
    WHERE id = ?
  `;

  const values = [
    data.empleado_id,
    data.fecha,
    data.hora ?? null,
    data.hora_salida ?? null,
    data.tipo_id,
    data.observaciones ?? null,
    id
  ];

  const [result] = await pool.query(query, values);
  return result;
}

// Elimina una asistencia por ID (borrado físico)
export async function deleteAsistencia(id) {
  const query = 'DELETE FROM asistencias WHERE id = ?';
  const [result] = await pool.query(query, [id]);
  return result;
}

/**
 * Obtiene una asistencia por ID (con joins a empleado, empresa y tipo).
 */
export async function findAsistenciaById(id) {
  const query = `
    SELECT
      a.id,
      a.empleado_id,
      e.nombre_completo AS empleado_nombre,
      e.empresa_id,
      em.nombre AS empresa_nombre,
      a.fecha,
      a.hora,
      a.hora_salida,
      a.tipo_id,
      ta.codigo AS tipo_codigo,
      ta.nombre AS tipo_nombre,
      a.observaciones,
      a.creado_en
    FROM asistencias a
    JOIN empleados e ON a.empleado_id = e.id
    JOIN empresas em ON e.empresa_id = em.id
    JOIN tipos_asistencia ta ON a.tipo_id = ta.id
    WHERE a.id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Lista asistencias con filtros opcionales.
 */
export async function findAsistencias({
  empleadoId = null,
  empresaId = null,
  desde = null,
  hasta = null,
  tipoId = null
} = {}) {
  let query = `
    SELECT
      a.id,
      a.empleado_id,
      e.nombre_completo AS empleado_nombre,
      e.empresa_id,
      em.nombre AS empresa_nombre,
      a.fecha,
      a.hora,
      a.hora_salida,
      a.tipo_id,
      ta.codigo AS tipo_codigo,
      ta.nombre AS tipo_nombre,
      a.observaciones,
      a.creado_en
    FROM asistencias a
    JOIN empleados e ON a.empleado_id = e.id
    JOIN empresas em ON e.empresa_id = em.id
    JOIN tipos_asistencia ta ON a.tipo_id = ta.id
    WHERE 1 = 1
  `;

  const params = [];

  if (empleadoId) {
    query += ' AND a.empleado_id = ?';
    params.push(empleadoId);
  }

  if (empresaId) {
    query += ' AND e.empresa_id = ?';
    params.push(empresaId);
  }

  if (desde) {
    query += ' AND a.fecha >= ?';
    params.push(desde);
  }

  if (hasta) {
    query += ' AND a.fecha <= ?';
    params.push(hasta);
  }

  if (tipoId) {
    query += ' AND a.tipo_id = ?';
    params.push(tipoId);
  }

  query += `
    ORDER BY a.fecha DESC, a.hora DESC, e.nombre_completo
  `;

  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Historial de asistencia de un empleado específico.
 */
export async function findHistorialPorEmpleado(
  empleadoId,
  { desde = null, hasta = null } = {}
) {
  return findAsistencias({
    empleadoId,
    desde,
    hasta
  });
}

/**
 * Asistencia filtrada por empresa y rango de fechas.
 */
export async function findAsistenciasPorEmpresa(
  empresaId,
  { desde = null, hasta = null } = {}
) {
  return findAsistencias({
    empresaId,
    desde,
    hasta
  });
}
