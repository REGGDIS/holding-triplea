// backend/src/routes/reportes.routes.js
import { Router } from 'express';
import { generarReporteAsistencia } from '../controllers/reportes.controller.js';

const router = Router();

// POST /api/reportes
router.post('/', generarReporteAsistencia);

export default router;
