// frontend/js/reportes.js
const API_BASE_URL = 'http://localhost:3000';

const AUTH_USER_KEY = 'hta_user';
const AUTH_TOKEN_KEY = 'hta_token';

// ======== Helpers de sesión ========
function getStoredSession() {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!userJson || !token) return null;

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
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

function authHeaders(token) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// ======== Helpers de fecha ========
function getTodayISO() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getStartOfMonthISO() {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
}

document.addEventListener('DOMContentLoaded', () => {
    const session = requireAuth();
    if (!session) return;

    const { user, token } = session;

    // ======== Referencias al DOM ========
    const userNameSpan = document.getElementById('userName');
    const btnLogout = document.getElementById('btnLogout');

    const filtroEmpresa = document.getElementById('filtroEmpresa');
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const btnGenerarReporte = document.getElementById('btnGenerarReporte');

    const valorTotalEmpleados = document.getElementById('valorTotalEmpleados');
    const valorTotalAsistencias = document.getElementById('valorTotalAsistencias');
    const valorInasistencias = document.getElementById('valorInasistencias');
    const valorHorasTrabajadas = document.getElementById('valorHorasTrabajadas');

    const reportesBody = document.getElementById('reportesBody');

    // ======== Navbar: usuario + logout ========
    if (userNameSpan && user && user.nombre_completo) {
        userNameSpan.textContent = `Usuario: ${user.nombre_completo}`;
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            window.location.href = 'index.html';
        });
    }

    // ==================== CARGA DE EMPRESAS ====================

    async function cargarEmpresas() {
        if (!filtroEmpresa) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/catalogos/empresas`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al cargar empresas para reportes:', data);
                return;
            }

            const empresas = data.data || [];

            filtroEmpresa.innerHTML = '';

            const optTodas = document.createElement('option');
            optTodas.value = '';
            optTodas.textContent = 'Todas';
            filtroEmpresa.appendChild(optTodas);

            empresas.forEach((emp) => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = emp.nombre;
                filtroEmpresa.appendChild(opt);
            });
        } catch (error) {
            console.error('Error de red al cargar empresas:', error);
        }
    }

    // ==================== RENDER DE KPIs ====================

    function renderKpis(dataKpi) {
        // El backend devuelve:
        // data: { empleados, asistencias, inasistencias, horasTotales, resultados }
        if (!dataKpi) dataKpi = {};

        if (valorTotalEmpleados) {
            valorTotalEmpleados.textContent =
                dataKpi.empleados != null ? dataKpi.empleados : 0;
        }
        if (valorTotalAsistencias) {
            valorTotalAsistencias.textContent =
                dataKpi.asistencias != null ? dataKpi.asistencias : 0;
        }
        if (valorInasistencias) {
            valorInasistencias.textContent =
                dataKpi.inasistencias != null ? dataKpi.inasistencias : 0;
        }
        if (valorHorasTrabajadas) {
            valorHorasTrabajadas.textContent =
                dataKpi.horasTotales != null ? dataKpi.horasTotales : 0;
        }
    }

    // ==================== RENDER TABLA ====================

    function renderTabla(registros) {
        if (!reportesBody) return;

        if (!registros || registros.length === 0) {
            reportesBody.innerHTML =
                '<tr><td colspan="6">No hay registros para el rango seleccionado.</td></tr>';
            return;
        }

        reportesBody.innerHTML = '';

        registros.forEach((reg) => {
            const tr = document.createElement('tr');

            // El controlador construye:
            // empresa, empleado, fecha, entrada, salida (NULL), horas
            const empresaNombre = reg.empresa || '';
            const empleadoNombre = reg.empleado || '';

            const fechaBruta = reg.fecha || '';
            const fecha =
                typeof fechaBruta === 'string' ? fechaBruta.slice(0, 10) : fechaBruta;

            const horaEntrada = reg.entrada || '';
            const horaSalida = reg.salida || '';
            const horasTrabajadas =
                reg.horas != null && reg.horas !== undefined ? reg.horas : '';

            tr.innerHTML = `
        <td>${empresaNombre}</td>
        <td>${empleadoNombre}</td>
        <td>${fecha}</td>
        <td>${horaEntrada}</td>
        <td>${horaSalida}</td>
        <td>${horasTrabajadas}</td>
      `;

            reportesBody.appendChild(tr);
        });
    }

    // ==================== GENERAR REPORTE ====================

    async function generarReporte() {
        if (!fechaInicio || !fechaFin) return;

        const fechaInicioVal = fechaInicio.value;
        const fechaFinVal = fechaFin.value;

        if (!fechaInicioVal || !fechaFinVal) {
            alert('Debe seleccionar Fecha Inicio y Fecha Fin.');
            return;
        }

        if (fechaInicioVal > fechaFinVal) {
            alert('La Fecha Inicio no puede ser mayor que la Fecha Fin.');
            return;
        }

        const payload = {
            empresaId: filtroEmpresa && filtroEmpresa.value ? filtroEmpresa.value : null,
            fechaInicio: fechaInicioVal,
            fechaFin: fechaFinVal,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/reportes`, {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al generar reporte:', data);
                alert(data?.message || 'No fue posible generar el reporte.');
                return;
            }

            // data.data = { empleados, asistencias, inasistencias, horasTotales, resultados }
            const dataKpi = data.data || {};
            const registros = dataKpi.resultados || [];

            renderKpis(dataKpi);
            renderTabla(registros);
        } catch (error) {
            console.error('Error de red al generar reporte:', error);
            alert('Error de conexión al generar el reporte.');
        }
    }

    if (btnGenerarReporte) {
        btnGenerarReporte.addEventListener('click', generarReporte);
    }

    // ==================== INICIALIZACIÓN ====================

    (async () => {
        await cargarEmpresas();

        const hoy = getTodayISO();
        const inicioMes = getStartOfMonthISO();

        if (fechaInicio && !fechaInicio.value) {
            fechaInicio.value = inicioMes;
        }
        if (fechaFin && !fechaFin.value) {
            fechaFin.value = hoy;
        }

        // Generar reporte inicial
        await generarReporte();
    })();
});
