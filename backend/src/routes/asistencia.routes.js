// backend/src/routes/asistencia.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
    registrarAsistencia,
    listarAsistencias,
    historialPorEmpleado,
    asistenciaPorEmpresa
} from '../controllers/asistencias.controller.js';

const router = Router();

// Todas las rutas de asistencia requieren estar autenticado
router.use(authRequired);

// Registrar nueva asistencia
// POST /api/asistencias
router.post('/', registrarAsistencia);

// Listar asistencias con filtros generales
// GET /api/asistencias
router.get('/', listarAsistencias);

// Historial por empleado
// GET /api/asistencias/empleado/:id
router.get('/empleado/:id', historialPorEmpleado);

// Asistencia por empresa
// GET /api/asistencias/empresa/:empresaId
router.get('/empresa/:empresaId', asistenciaPorEmpresa);

export default router;
