// backend/src/controllers/reportes.controller.js
import pool from '../config/db.js';

/**
 * POST /api/reportes
 * Body esperado:
 * {
 *   empresaId: null | number,
 *   empleadoId: null | number,
 *   fechaInicio: 'YYYY-MM-DD',
 *   fechaFin: 'YYYY-MM-DD'
 * }
 *
 * Soporta:
 *  - reporte consolidado por empresa (RB-06)
 *  - historial por empleado (RB-05) si se envía empleadoId
 */
export const generarReporteAsistencia = async (req, res, next) => {
    try {
        const { empresaId, empleadoId, fechaInicio, fechaFin } = req.body;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                ok: false,
                message: 'Las fechas inicio y fin son obligatorias.'
            });
        }

        const empresaFilter =
            empresaId && empresaId !== 'todas' ? Number(empresaId) : null;
        const empleadoFilter = empleadoId ? Number(empleadoId) : null;

        const connection = await pool.getConnection();

        try {
            // 1) Total de empleados distintos con asistencia en el período
            const [rowsEmpleados] = await connection.query(
                `
        SELECT COUNT(DISTINCT e.id) AS total_empleados
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR e.empresa_id = ? )
          AND ( ? IS NULL OR e.id = ? )
      `,
                [
                    fechaInicio,
                    fechaFin,
                    empresaFilter,
                    empresaFilter,
                    empleadoFilter,
                    empleadoFilter
                ]
            );

            const totalEmpleados = rowsEmpleados[0]?.total_empleados || 0;

            // 2) Total de asistencias
            const [rowsAsistencias] = await connection.query(
                `
        SELECT COUNT(*) AS total_asistencias
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR e.empresa_id = ? )
          AND ( ? IS NULL OR e.id = ? )
      `,
                [
                    fechaInicio,
                    fechaFin,
                    empresaFilter,
                    empresaFilter,
                    empleadoFilter,
                    empleadoFilter
                ]
            );

            const totalAsistencias = rowsAsistencias[0]?.total_asistencias || 0;

            // 3) Total de inasistencias (tipo codigo = 'AUSENTE')
            const [rowsInasistencias] = await connection.query(
                `
        SELECT COUNT(*) AS total_inasistencias
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        INNER JOIN tipos_asistencia t ON a.tipo_id = t.id
        WHERE a.fecha BETWEEN ? AND ?
          AND t.codigo = 'AUSENTE'
          AND ( ? IS NULL OR e.empresa_id = ? )
          AND ( ? IS NULL OR e.id = ? )
      `,
                [
                    fechaInicio,
                    fechaFin,
                    empresaFilter,
                    empresaFilter,
                    empleadoFilter,
                    empleadoFilter
                ]
            );

            const totalInasistencias =
                rowsInasistencias[0]?.total_inasistencias || 0;

            // 4) Horas trabajadas aproximadas (PRESENTE = 8 horas)
            const [rowsHoras] = await connection.query(
                `
        SELECT 
          COALESCE(SUM(
            CASE WHEN t.codigo = 'PRESENTE' THEN 8 ELSE 0 END
          ), 0) AS horas_totales
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        INNER JOIN tipos_asistencia t ON a.tipo_id = t.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR e.empresa_id = ? )
          AND ( ? IS NULL OR e.id = ? )
      `,
                [
                    fechaInicio,
                    fechaFin,
                    empresaFilter,
                    empresaFilter,
                    empleadoFilter,
                    empleadoFilter
                ]
            );

            const horasTotales = rowsHoras[0]?.horas_totales || 0;

            // 5) Detalle para la tabla
            const [rowsDetalle] = await connection.query(
                `
        SELECT 
          emp.nombre              AS empresa,
          e.nombre_completo       AS empleado,
          a.fecha,
          a.hora                  AS entrada,
          NULL                    AS salida,
          CASE WHEN t.codigo = 'PRESENTE' THEN 8 ELSE 0 END AS horas
        FROM asistencias a
        INNER JOIN empleados e       ON a.empleado_id = e.id
        INNER JOIN empresas emp      ON e.empresa_id = emp.id
        INNER JOIN tipos_asistencia t ON a.tipo_id = t.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR emp.id = ? )
          AND ( ? IS NULL OR e.id = ? )
        ORDER BY emp.nombre, e.nombre_completo, a.fecha, a.hora
      `,
                [
                    fechaInicio,
                    fechaFin,
                    empresaFilter,
                    empresaFilter,
                    empleadoFilter,
                    empleadoFilter
                ]
            );

            return res.json({
                ok: true,
                data: {
                    empleados: totalEmpleados,
                    asistencias: totalAsistencias,
                    inasistencias: totalInasistencias,
                    horasTotales,
                    resultados: rowsDetalle
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/reportes/empleados-estado-civil?empresaId=1
 *
 * RB-02: Conteo de personal por estado civil y empresa.
 */
export const empleadosPorEstadoCivil = async (req, res, next) => {
    try {
        const { empresaId } = req.query;
        const empresaFilter = empresaId ? Number(empresaId) : null;

        const [rows] = await pool.query(
            `
      SELECT
        emp.id                AS empresa_id,
        emp.nombre            AS empresa_nombre,
        ec.id                 AS estado_civil_id,
        ec.nombre             AS estado_civil_nombre,
        COUNT(*)              AS total_empleados
      FROM empleados e
      INNER JOIN empresas       emp ON e.empresa_id = emp.id
      LEFT JOIN estados_civiles ec  ON e.estado_civil_id = ec.id
      WHERE ( ? IS NULL OR emp.id = ? )
        AND e.activo = 1
      GROUP BY emp.id, emp.nombre, ec.id, ec.nombre
      ORDER BY emp.nombre, ec.nombre
    `,
            [empresaFilter, empresaFilter]
        );

        return res.json({
            ok: true,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/reportes/empleados-comuna?empresaId=1
 *
 * RB-03: Conteo de personal por comuna y empresa.
 */
export const empleadosPorComuna = async (req, res, next) => {
    try {
        const { empresaId } = req.query;
        const empresaFilter = empresaId ? Number(empresaId) : null;

        const [rows] = await pool.query(
            `
      SELECT
        emp.id          AS empresa_id,
        emp.nombre      AS empresa_nombre,
        c.id            AS comuna_id,
        c.nombre        AS comuna_nombre,
        COUNT(*)        AS total_empleados
      FROM empleados e
      INNER JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN comunas   c   ON e.comuna_id = c.id
      WHERE ( ? IS NULL OR emp.id = ? )
        AND e.activo = 1
      GROUP BY emp.id, emp.nombre, c.id, c.nombre
      ORDER BY emp.nombre, c.nombre
    `,
            [empresaFilter, empresaFilter]
        );

        return res.json({
            ok: true,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};
