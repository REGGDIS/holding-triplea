// backend/src/controllers/asistencias.controller.js
import {
    createAsistencia,
    findAsistenciaById,
    findAsistencias,
    findHistorialPorEmpleado,
    findAsistenciasPorEmpresa,
    updateAsistencia,
    deleteAsistencia
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
 *  - hora_salida (HH:MM:SS)
 *  - observaciones
 */
export async function registrarAsistencia(req, res) {
    try {
        const {
            empleado_id,
            fecha,
            hora,
            hora_salida,
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
            hora_salida,
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

// GET /api/asistencias/:id
export async function obtenerAsistenciaPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de asistencia no válido.'
            });
        }

        const asistencia = await findAsistenciaById(id);

        if (!asistencia) {
            return res.status(404).json({
                ok: false,
                message: 'Asistencia no encontrada.'
            });
        }

        return res.json({
            ok: true,
            data: asistencia
        });
    } catch (error) {
        console.error('Error en obtenerAsistenciaPorId:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la asistencia.'
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

// PUT /api/asistencias/:id
export async function actualizarAsistencia(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de asistencia no válido.'
            });
        }

        const {
            empleado_id,
            fecha,
            hora,
            hora_salida,
            tipo_id,
            observaciones
        } = req.body;

        // Validación básica
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
            hora_salida,
            tipo_id,
            observaciones
        };

        const result = await updateAsistencia(id, data);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Asistencia no encontrada o sin cambios.'
            });
        }

        const asistenciaActualizada = await findAsistenciaById(id);

        return res.json({
            ok: true,
            message: 'Asistencia actualizada correctamente.',
            data: asistenciaActualizada
        });
    } catch (error) {
        console.error('Error en actualizarAsistencia:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe un registro de asistencia para ese empleado, fecha y tipo.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar la asistencia.'
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

// DELETE /api/asistencias/:id
export async function eliminarAsistencia(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de asistencia no válido.'
            });
        }

        const result = await deleteAsistencia(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Asistencia no encontrada.'
            });
        }

        return res.json({
            ok: true,
            message: 'Asistencia eliminada correctamente.'
        });
    } catch (error) {
        console.error('Error en eliminarAsistencia:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar la asistencia.'
        });
    }
}
