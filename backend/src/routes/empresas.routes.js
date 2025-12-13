// backend/src/routes/empresas.routes.js
import { Router } from 'express';
import {
    listarEmpresas,
    obtenerEmpresaPorId,
    crearEmpresa,
    actualizarEmpresa,
    eliminarEmpresa
} from '../controllers/empresas.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de empresas requieren usuario autenticado
router.use(authRequired);

// GET /api/empresas?busqueda=...&solo_activas=1&solo_inactivas=1
router.get('/', listarEmpresas);

// GET /api/empresas/:id
router.get('/:id', obtenerEmpresaPorId);

// POST /api/empresas
router.post('/', crearEmpresa);

// PUT /api/empresas/:id
router.put('/:id', actualizarEmpresa);

// DELETE /api/empresas/:id  (en tu controller la dejaremos como "borrado lógico"/inactiva)
router.delete('/:id', eliminarEmpresa);

export default router;
