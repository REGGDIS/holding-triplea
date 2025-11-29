// Claves usadas en login.js
const AUTH_USER_KEY = 'hta_user';
const AUTH_TOKEN_KEY = 'hta_token';

function getStoredSession() {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!userJson || !token) {
        return null;
    }

    try {
        const user = JSON.parse(userJson);
        return { user, token };
    } catch (error) {
        console.error('Error al parsear usuario desde localStorage:', error);
        return null;
    }
}

function requireAuth() {
    const session = getStoredSession();
    if (!session) {
        // Si no hay sesión, volvemos al login
        window.location.href = 'index.html'; // o login.html según tu archivo
        return null;
    }
    return session;
}

document.addEventListener('DOMContentLoaded', () => {
    const session = requireAuth();
    if (!session) return;

    const { user, token } = session;

    // Mostrar nombre del usuario en la barra
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan && user && user.nombre_completo) {
        userNameSpan.textContent = `Usuario: ${user.nombre_completo}`;
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            window.location.href = 'index.html'; // o login.html
        });
    }

    // TODO: cuando tengamos backend para el resumen,
    // aquí haremos fetch a /api/dashboard/resumen.
    // Por ahora, dejamos valores de ejemplo o los que tú quieras.
    const totalEmpresasValue = document.getElementById('totalEmpresasValue');
    const totalEmpleadosValue = document.getElementById('totalEmpleadosValue');
    const asistenciaHoyValue = document.getElementById('asistenciaHoyValue');
    const ultimaActualizacionValue = document.getElementById('ultimaActualizacionValue');

    if (totalEmpresasValue) totalEmpresasValue.textContent = '3';      // demo
    if (totalEmpleadosValue) totalEmpleadosValue.textContent = '42';   // demo
    if (asistenciaHoyValue) asistenciaHoyValue.textContent = '38';     // demo
    if (ultimaActualizacionValue) {
        const hoy = new Date();
        ultimaActualizacionValue.textContent = hoy.toLocaleDateString('es-CL');
    }
});
