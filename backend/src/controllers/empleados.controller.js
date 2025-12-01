// backend/src/controllers/empleados.controller.js
import pool from '../config/db.js';
import {
    findEmpleadoById,
    createEmpleado,
    updateEmpleado,
    softDeleteEmpleado
} from '../models/empleados.model.js';

/**
 * GET /api/empleados
 *
 * Filtros que puede recibir (desde el frontend):
 *  - ?empresaId=1 | ''  (Todas)
 *  - ?comunaId=5  | ''  (Todas)
 *  - ?estadoCivilId=2 | '' (Todos)
 *  - ?incluirInactivos=true (opcional)
 */
export async function listarEmpleados(req, res) {
    try {
        let { empresaId, comunaId, estadoCivilId } = req.query;

        // Normalizamos los filtros:
        const empresaFilter =
            empresaId && empresaId !== 'todas' ? Number(empresaId) : null;

        const comunaFilter =
            comunaId && comunaId !== 'todas' ? Number(comunaId) : null;

        const estadoCivilFilter =
            estadoCivilId && estadoCivilId !== 'todos' ? Number(estadoCivilId) : null;

        const sql = `
      SELECT 
        e.id,
        e.empresa_id,
        emp.nombre AS empresa_nombre,
        e.rut,
        e.nombre_completo,
        e.cargo,
        e.email AS correo,
        e.comuna_id,
        c.nombre AS comuna_nombre,
        e.estado_civil_id,
        ec.nombre AS estado_civil_nombre,
        e.activo
      FROM empleados e
      INNER JOIN empresas emp       ON e.empresa_id      = emp.id
      LEFT JOIN comunas c           ON e.comuna_id       = c.id
      LEFT JOIN estados_civiles ec  ON e.estado_civil_id = ec.id
      WHERE ( ? IS NULL OR e.empresa_id      = ? )
        AND ( ? IS NULL OR e.comuna_id       = ? )
        AND ( ? IS NULL OR e.estado_civil_id = ? )
      ORDER BY emp.nombre, e.nombre_completo
    `;

        const params = [
            empresaFilter, empresaFilter,
            comunaFilter, comunaFilter,
            estadoCivilFilter, estadoCivilFilter
        ];

        const [rows] = await pool.query(sql, params);

        return res.json({
            ok: true,
            data: rows
        });
    } catch (error) {
        console.error('Error en listarEmpleados:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la lista de empleados.'
        });
    }
}

/**
 * GET /api/empleados/:id
 */
export async function obtenerEmpleadoPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empleado no válido.'
            });
        }

        const empleado = await findEmpleadoById(id);

        if (!empleado) {
            return res.status(404).json({
                ok: false,
                message: 'Empleado no encontrado.'
            });
        }

        return res.json({
            ok: true,
            data: empleado
        });
    } catch (error) {
        console.error('Error en obtenerEmpleadoPorId:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el empleado.'
        });
    }
}

/**
 * POST /api/empleados
 * Body mínimo requerido:
 *  - empresa_id
 *  - nombre_completo
 *  - rut
 * El resto de campos son opcionales.
 */
export async function crearEmpleado(req, res) {
    try {
        const {
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
        } = req.body;

        // Validaciones básicas
        if (!empresa_id || !nombre_completo || !rut) {
            return res.status(400).json({
                ok: false,
                message: 'Debe indicar empresa_id, nombre_completo y rut.'
            });
        }

        const nuevoEmpleadoData = {
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
        };

        const nuevoId = await createEmpleado(nuevoEmpleadoData);
        const empleadoCreado = await findEmpleadoById(nuevoId);

        return res.status(201).json({
            ok: true,
            message: 'Empleado creado correctamente.',
            data: empleadoCreado
        });
    } catch (error) {
        console.error('Error en crearEmpleado:', error);

        // Manejo de RUT duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe un empleado con ese RUT.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al crear el empleado.'
        });
    }
}

/**
 * PUT /api/empleados/:id
 * Actualiza los campos enviados en el body (update parcial).
 */
export async function actualizarEmpleado(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empleado no válido.'
            });
        }

        const data = req.body;

        const result = await updateEmpleado(id, data);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Empleado no encontrado o sin cambios.'
            });
        }

        const empleadoActualizado = await findEmpleadoById(id);

        return res.json({
            ok: true,
            message: 'Empleado actualizado correctamente.',
            data: empleadoActualizado
        });
    } catch (error) {
        console.error('Error en actualizarEmpleado:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe un empleado con ese RUT.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el empleado.'
        });
    }
}

/**
 * DELETE /api/empleados/:id
 * "Elimina" el empleado marcándolo como inactivo (activo = 0).
 */
export async function eliminarEmpleado(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empleado no válido.'
            });
        }

        const result = await softDeleteEmpleado(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Empleado no encontrado.'
            });
        }

        return res.json({
            ok: true,
            message: 'Empleado marcado como inactivo correctamente.'
        });
    } catch (error) {
        console.error('Error en eliminarEmpleado:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar el empleado.'
        });
    }
}
