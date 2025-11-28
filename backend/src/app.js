// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';

import { responseMiddleware } from './middlewares/response.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 👉 Middleware de respuestas estándar (res.success / res.fail)
app.use(responseMiddleware);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS result');
        // Aquí ya podrías usar res.success si quisieras:
        // return res.success(rows[0], 'API funcionando correctamente');
        return res.json({
            ok: true,
            message: 'API funcionando correctamente',
            db: rows[0]
        });
    } catch (error) {
        console.error('Error en /api/health:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al conectar con la base de datos'
        });
    }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/catalogos', catalogosRoutes);

// 👉 Middleware 404 (ruta no encontrada)
app.use(notFoundHandler);

// 👉 Middleware de error global (si algo se escapa)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});
