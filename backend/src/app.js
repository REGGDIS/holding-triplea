// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import pool from './config/db.js';

// Rutas
import authRoutes from './routes/auth.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import empresasRoutes from './routes/empresas.routes.js';

// Middlewares
import authMiddleware from './middlewares/auth.middleware.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import {
    notFoundHandler,
    errorHandler,
} from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 👉 Middleware de respuestas estándar (res.success / res.fail)
app.use(responseMiddleware);

// =================== Health check ===================
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS result');

        return res.json({
            ok: true,
            message: 'API funcionando correctamente',
            db: rows[0],
        });
    } catch (error) {
        console.error('Error en /api/health:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al conectar con la base de datos',
        });
    }
});

// =================== Rutas públicas ===================
app.use('/api/auth', authRoutes);

// =================== Rutas protegidas ===================
app.use('/api/catalogos', authMiddleware, catalogosRoutes);
app.use('/api/empleados', authMiddleware, empleadosRoutes);
app.use('/api/asistencias', authMiddleware, asistenciaRoutes);
app.use('/api/reportes', authMiddleware, reportesRoutes);
app.use('/api/empresas', empresasRoutes);

// =================== Middlewares finales ===================
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});

export default app;
