// backend/src/routes/catalogos.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
    listarEmpresas,
    listarEstadosCiviles,
    listarComunas,
    listarTiposAsistencia
} from '../controllers/catalogos.controller.js';

const router = Router();

// Todas las rutas de catálogos requieren estar autenticado
router.use(authRequired);

// GET /api/catalogos/empresas
router.get('/empresas', listarEmpresas);

// GET /api/catalogos/estados-civiles
router.get('/estados-civiles', listarEstadosCiviles);

// GET /api/catalogos/comunas
router.get('/comunas', listarComunas);

// GET /api/catalogos/tipos-asistencia
router.get('/tipos-asistencia', listarTiposAsistencia);

export default router;
