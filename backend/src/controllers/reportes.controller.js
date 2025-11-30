// backend/src/controllers/reportes.controller.js
import pool from '../config/db.js';

/**
 * POST /api/reportes
 * Body esperado:
 * {
 *   empresaId: null | number,
 *   fechaInicio: 'YYYY-MM-DD',
 *   fechaFin: 'YYYY-MM-DD'
 * }
 */
export const generarReporteAsistencia = async (req, res, next) => {
    try {
        const { empresaId, fechaInicio, fechaFin } = req.body;

        // Validaciones básicas
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                ok: false,
                message: 'Las fechas inicio y fin son obligatorias.',
            });
        }

        // Si empresaId viene como string 'todas' o vacío, lo consideramos null (todas las empresas)
        const empresaFilter =
            empresaId && empresaId !== 'todas' ? Number(empresaId) : null;

        const connection = await pool.getConnection();

        try {
            // 1) Total de empleados que aparecen en el reporte
            //    (empleados distintos con algún registro de asistencia en el período)
            const [rowsEmpleados] = await connection.query(
                `
        SELECT COUNT(DISTINCT e.id) AS total_empleados
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR e.empresa_id = ? )
      `,
                [fechaInicio, fechaFin, empresaFilter, empresaFilter],
            );

            const totalEmpleados = rowsEmpleados[0]?.total_empleados || 0;

            // 2) Total de asistencias (todas las marcas registradas en el período)
            const [rowsAsistencias] = await connection.query(
                `
        SELECT COUNT(*) AS total_asistencias
        FROM asistencias a
        INNER JOIN empleados e ON a.empleado_id = e.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR e.empresa_id = ? )
      `,
                [fechaInicio, fechaFin, empresaFilter, empresaFilter],
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
      `,
                [fechaInicio, fechaFin, empresaFilter, empresaFilter],
            );

            const totalInasistencias =
                rowsInasistencias[0]?.total_inasistencias || 0;

            // 4) Horas trabajadas (aprox): cantidad de "PRESENTE" * 8 horas
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
      `,
                [fechaInicio, fechaFin, empresaFilter, empresaFilter],
            );

            const horasTotales = rowsHoras[0]?.horas_totales || 0;

            // 5) Detalle por registro (para la tabla de resultados)
            const [rowsDetalle] = await connection.query(
                `
        SELECT 
          emp.nombre AS empresa,
          e.nombre_completo AS empleado,
          a.fecha,
          a.hora AS entrada,
          NULL AS salida,
          CASE WHEN t.codigo = 'PRESENTE' THEN 8 ELSE 0 END AS horas
        FROM asistencias a
        INNER JOIN empleados e   ON a.empleado_id = e.id
        INNER JOIN empresas emp  ON e.empresa_id = emp.id
        INNER JOIN tipos_asistencia t ON a.tipo_id = t.id
        WHERE a.fecha BETWEEN ? AND ?
          AND ( ? IS NULL OR emp.id = ? )
        ORDER BY emp.nombre, e.nombre_completo, a.fecha, a.hora
      `,
                [fechaInicio, fechaFin, empresaFilter, empresaFilter],
            );

            // Respuesta al frontend (estructura acordada)
            return res.json({
                ok: true,
                data: {
                    empleados: totalEmpleados,
                    asistencias: totalAsistencias,
                    inasistencias: totalInasistencias,
                    horasTotales,
                    resultados: rowsDetalle,
                },
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        // Delega al middleware de errores que ya tienes
        next(error);
    }
};
