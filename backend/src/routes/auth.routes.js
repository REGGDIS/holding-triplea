// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * POST /api/auth/login
 * Público
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Protegido con JWT
 */
router.get('/me', authRequired, me);

export default router;
