// backend/src/routes/reportes.routes.js
import { Router } from 'express';
import {
    generarReporteAsistencia,
    empleadosPorEstadoCivil,
    empleadosPorComuna
} from '../controllers/reportes.controller.js';

const router = Router();

// RB-05 / RB-06: reportes de asistencia
router.post('/', generarReporteAsistencia);

// RB-02: conteo por estado civil y empresa
router.get('/empleados-estado-civil', empleadosPorEstadoCivil);

// RB-03: conteo por comuna y empresa
router.get('/empleados-comuna', empleadosPorComuna);

export default router;
