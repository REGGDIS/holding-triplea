// backend/src/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Carga variables de entorno desde .env

// Creamos un pool de conexiones paar reutilizar conexiones a la BD
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'holding_triplea',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;