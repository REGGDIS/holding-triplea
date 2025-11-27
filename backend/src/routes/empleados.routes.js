// backend/src/routes/empleados.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
    listarEmpleados,
    obtenerEmpleadoPorId,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado
} from '../controllers/empleados.controller.js';

const router = Router();

// Todas las rutas de empleados requieren estar autenticado
router.use(authRequired);

// GET /api/empleados
router.get('/', listarEmpleados);

// GET /api/empleados/:id
router.get('/:id', obtenerEmpleadoPorId);

// POST /api/empleados
router.post('/', crearEmpleado);

// PUT /api/empleados/:id
router.put('/:id', actualizarEmpleado);

// DELETE /api/empleados/:id  (soft delete)
router.delete('/:id', eliminarEmpleado);

export default router;
