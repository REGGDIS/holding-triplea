// backend/src/controllers/empresas.controller.js
import {
    findAllEmpresas,
    findEmpresaById,
    createEmpresa,
    updateEmpresa,
    softDeleteEmpresa
} from '../models/empresas.model.js';

/**
 * GET /api/empresas
 *
 * Query opcionales:
 *  - ?incluirInactivas=true
 */
export async function listarEmpresas(req, res) {
    try {
        const { incluirInactivas } = req.query;

        const soloActivas = incluirInactivas === 'true' ? false : true;

        const empresas = await findAllEmpresas({ soloActivas });

        return res.json({
            ok: true,
            data: empresas
        });
    } catch (error) {
        console.error('Error en listarEmpresas:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la lista de empresas.'
        });
    }
}

/**
 * GET /api/empresas/:id
 */
export async function obtenerEmpresaPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empresa no válido.'
            });
        }

        const empresa = await findEmpresaById(id);

        if (!empresa) {
            return res.status(404).json({
                ok: false,
                message: 'Empresa no encontrada.'
            });
        }

        return res.json({
            ok: true,
            data: empresa
        });
    } catch (error) {
        console.error('Error en obtenerEmpresaPorId:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la empresa.'
        });
    }
}

/**
 * POST /api/empresas
 * Body mínimo:
 *  - nombre
 *  - rut
 * Opcionales:
 *  - giro, direccion, comuna_id, telefono, correo_contacto, activo
 */
export async function crearEmpresa(req, res) {
    try {
        const {
            nombre,
            rut,
            giro,
            direccion,
            comuna_id,
            telefono,
            correo_contacto,
            activo
        } = req.body;

        // Validaciones básicas
        if (!nombre || !rut) {
            return res.status(400).json({
                ok: false,
                message: 'Debe indicar nombre y rut de la empresa.'
            });
        }

        const nuevaEmpresaData = {
            nombre,
            rut,
            giro,
            direccion,
            comuna_id,
            telefono,
            correo_contacto,
            activo
        };

        const nuevoId = await createEmpresa(nuevaEmpresaData);
        const empresaCreada = await findEmpresaById(nuevoId);

        return res.status(201).json({
            ok: true,
            message: 'Empresa creada correctamente.',
            data: empresaCreada
        });
    } catch (error) {
        console.error('Error en crearEmpresa:', error);

        // Manejo de duplicados por UNIQUE (rut, nombre)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe una empresa con ese nombre o RUT.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al crear la empresa.'
        });
    }
}

/**
 * PUT /api/empresas/:id
 * Actualiza parcialmente los campos enviados en el body.
 */
export async function actualizarEmpresa(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empresa no válido.'
            });
        }

        const data = req.body;

        const result = await updateEmpresa(id, data);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Empresa no encontrada o sin cambios.'
            });
        }

        const empresaActualizada = await findEmpresaById(id);

        return res.json({
            ok: true,
            message: 'Empresa actualizada correctamente.',
            data: empresaActualizada
        });
    } catch (error) {
        console.error('Error en actualizarEmpresa:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe una empresa con ese nombre o RUT.'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar la empresa.'
        });
    }
}

/**
 * DELETE /api/empresas/:id
 * Marca la empresa como inactiva (activo = 0).
 */
export async function eliminarEmpresa(req, res) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de empresa no válido.'
            });
        }

        const result = await softDeleteEmpresa(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Empresa no encontrada.'
            });
        }

        return res.json({
            ok: true,
            message: 'Empresa marcada como inactiva correctamente.'
        });
    } catch (error) {
        console.error('Error en eliminarEmpresa:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar (desactivar) la empresa.'
        });
    }
}
