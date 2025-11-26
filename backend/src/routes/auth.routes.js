// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 */
router.get('/me', me);

export default router;
