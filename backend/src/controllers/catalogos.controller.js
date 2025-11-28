// backend/src/controllers/catalogos.controller.js
import {
    findAllEmpresas,
    findAllEstadosCiviles,
    findAllComunas,
    findAllTiposAsistencia
} from '../models/catalogos.model.js';

export async function listarEmpresas(req, res) {
    try {
        const empresas = await findAllEmpresas();
        return res.json({
            ok: true,
            data: empresas
        });
    } catch (error) {
        console.error('Error en listarEmpresas:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el catálogo de empresas.'
        });
    }
}

export async function listarEstadosCiviles(req, res) {
    try {
        const estados = await findAllEstadosCiviles();
        return res.json({
            ok: true,
            data: estados
        });
    } catch (error) {
        console.error('Error en listarEstadosCiviles:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el catálogo de estados civiles.'
        });
    }
}

export async function listarComunas(req, res) {
    try {
        const comunas = await findAllComunas();
        return res.json({
            ok: true,
            data: comunas
        });
    } catch (error) {
        console.error('Error en listarComunas:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el catálogo de comunas.'
        });
    }
}

export async function listarTiposAsistencia(req, res) {
    try {
        const tipos = await findAllTiposAsistencia();
        return res.json({
            ok: true,
            data: tipos
        });
    } catch (error) {
        console.error('Error en listarTiposAsistencia:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el catálogo de tipos de asistencia.'
        });
    }
}
