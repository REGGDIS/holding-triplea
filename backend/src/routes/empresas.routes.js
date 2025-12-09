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

router.get('/', listarEmpresas);         // Listar empresas (con ?incluirInactivas=true)
router.get('/:id', obtenerEmpresaPorId); // Obtener detalle de una empresa
router.post('/', crearEmpresa);         // Crear nueva empresa
router.put('/:id', actualizarEmpresa);  // Actualizar empresa
router.delete('/:id', eliminarEmpresa); // Marcar empresa como inactiva

export default router;
