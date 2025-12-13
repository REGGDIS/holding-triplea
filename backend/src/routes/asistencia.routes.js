// backend/src/routes/asistencia.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
    registrarAsistencia,
    listarAsistencias,
    historialPorEmpleado,
    asistenciaPorEmpresa,
    obtenerAsistenciaPorId,
    actualizarAsistencia,
    eliminarAsistencia,
} from '../controllers/asistencias.controller.js';

const router = Router();

// Todas las rutas de asistencia requieren estar autenticado
router.use(authRequired);

// POST /api/asistencias
router.post('/', registrarAsistencia);

// GET /api/asistencias
router.get('/', listarAsistencias);

// GET /api/asistencias/empleado/:id
router.get('/empleado/:id', historialPorEmpleado);

// GET /api/asistencias/empresa/:empresaId
router.get('/empresa/:empresaId', asistenciaPorEmpresa);

// IMPORTANTE: rutas genéricas con :id al final,
// para no interferir con /empleado/:id y /empresa/:empresaId

// GET /api/asistencias/:id
router.get('/:id', obtenerAsistenciaPorId);

// PUT /api/asistencias/:id
router.put('/:id', actualizarAsistencia);

// DELETE /api/asistencias/:id
router.delete('/:id', eliminarAsistencia);

export default router;
