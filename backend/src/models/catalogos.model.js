// backend/src/models/catalogos.model.js
import pool from '../config/db.js';

export async function findAllEmpresas() {
    const query = `
    SELECT
      id,
      nombre
    FROM empresas
    ORDER BY nombre
  `;
    const [rows] = await pool.query(query);
    return rows;
}

export async function findAllEstadosCiviles() {
    const query = `
    SELECT
      id,
      nombre
    FROM estados_civiles
    ORDER BY nombre
  `;
    const [rows] = await pool.query(query);
    return rows;
}

export async function findAllComunas() {
    const query = `
    SELECT
      id,
      nombre
    FROM comunas
    ORDER BY nombre
  `;
    const [rows] = await pool.query(query);
    return rows;
}

export async function findAllTiposAsistencia() {
    const query = `
    SELECT
      id,
      nombre,
      codigo
    FROM tipos_asistencia
    ORDER BY nombre
  `;
    const [rows] = await pool.query(query);
    return rows;
}
