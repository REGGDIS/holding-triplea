// backend/src/controllers/asistencias.controller.js
import {
    createAsistencia,
    findAsistenciaById,
    findAsistencias,
    findHistorialPorEmpleado,
    findAsistenciasPorEmpresa
} from '../models/asistencias.model.js';

/**
 * POST /api/asistencias
 * Registra un evento de asistencia.
 * Body mínimo:
 *  - empleado_id
 *  - fecha (YYYY-MM-DD)
 *  - tipo_id
 * Opcionales:
 *  - hora (HH:MM:SS)
 *  - observaciones
 */
export async function registrarAsistencia(req, res) {
    try {
        const {
            empleado_id,
            fecha,
            hora,
            tipo_id,
            observaciones
        } = req.body;

        // Validaciones mínimas
        if (!empleado_id || !fecha || !tipo_id) {
            return res.status(400).json({
                ok: false,
                message: 'Debe indicar empleado_id, fecha y tipo_id.'
            });
        }

        const data = {
            empleado_id,
            fecha,
            hora,
            tipo_id,
            observaciones
        };

        const nuevaId = await createAsistencia(data);
        const asistenciaCreada = await findAsistenciaById(nuevaId);

        return res.status(201).json({
            ok: true,
            message: 'Asistencia registrada correctamente.',
            data: asistenciaCreada
        });
    } catch (error) {
        console.error('Error en registrarAsistencia:', error);

        // Manejo de duplicados por la UNIQUE (empleado_id, fecha, tipo_id)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe un registro de asistencia para ese empleado, fecha y tipo.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al registrar la asistencia.'
        });
    }
}

/**
 * GET /api/asistencias
 * Filtros opcionales:
 *  - empleado_id
 *  - empresa_id
 *  - desde (YYYY-MM-DD)
 *  - hasta (YYYY-MM-DD)
 *  - tipo_id
 */
export async function listarAsistencias(req, res) {
    try {
        const {
            empleado_id,
            empresa_id,
            desde,
            hasta,
            tipo_id
        } = req.query;

        const filtros = {
            empleadoId: empleado_id ? Number(empleado_id) : null,
            empresaId: empresa_id ? Number(empresa_id) : null,
            desde: desde || null,
            hasta: hasta || null,
            tipoId: tipo_id ? Number(tipo_id) : null
        };

        const asistencias = await findAsistencias(filtros);

        return res.json({
            ok: true,
            data: asistencias
        });
    } catch (error) {
        console.error('Error en listarAsistencias:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener las asistencias.'
        });
    }
}

/**
 * GET /api/asistencias/empleado/:id
 * Historial por empleado, opcionalmente filtrado por rango de fechas.
 * Query:
 *  - desde (YYYY-MM-DD)
 *  - hasta (YYYY-MM-DD)
 */
export async function historialPorEmpleado(req, res) {
    try {
        const empleadoId = Number(req.params.id);

        if (Number.isNaN(empleadoId)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empleado no válido.'
            });
        }

        const { desde, hasta } = req.query;

        const asistencias = await findHistorialPorEmpleado(empleadoId, {
            desde: desde || null,
            hasta: hasta || null
        });

        return res.json({
            ok: true,
            data: asistencias
        });
    } catch (error) {
        console.error('Error en historialPorEmpleado:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el historial de asistencia del empleado.'
        });
    }
}

/**
 * GET /api/asistencias/empresa/:empresaId
 * Asistencia consolidada por empresa y rango de fechas.
 * Query:
 *  - desde (YYYY-MM-DD)
 *  - hasta (YYYY-MM-DD)
 */
export async function asistenciaPorEmpresa(req, res) {
    try {
        const empresaId = Number(req.params.empresaId);

        if (Number.isNaN(empresaId)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empresa no válido.'
            });
        }

        const { desde, hasta } = req.query;

        const asistencias = await findAsistenciasPorEmpresa(empresaId, {
            desde: desde || null,
            hasta: hasta || null
        });

        return res.json({
            ok: true,
            data: asistencias
        });
    } catch (error) {
        console.error('Error en asistenciaPorEmpresa:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la asistencia de la empresa.'
        });
    }
}
