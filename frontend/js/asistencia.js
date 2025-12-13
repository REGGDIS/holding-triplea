// frontend/js/asistencia.js
const API_BASE_URL = 'http://localhost:3000';

const AUTH_USER_KEY = 'hta_user';
const AUTH_TOKEN_KEY = 'hta_token';

// Ajusta este valor al tipo de asistencia que tengas en tu BD (ej: "Presente")
const DEFAULT_TIPO_ASISTENCIA_ID = 1;

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

document.addEventListener('DOMContentLoaded', () => {
    const session = requireAuth();
    if (!session) return;

    const { user, token } = session;

    // ======== Referencias al DOM ========
    const userNameSpan = document.getElementById('userName');
    const btnLogout = document.getElementById('btnLogout');

    // Filtros
    const filtroEmpresa = document.getElementById('filtroEmpresa');
    const filtroFecha = document.getElementById('filtroFecha');
    const btnFiltrar = document.getElementById('btnFiltrar');

    // Formulario de registro
    const asistenciaForm = document.getElementById('asistenciaForm');
    const empresaAsistencia = document.getElementById('empresaAsistencia');
    const empleadoAsistencia = document.getElementById('empleadoAsistencia');
    const fechaAsistencia = document.getElementById('fechaAsistencia');
    const horaEntrada = document.getElementById('horaEntrada');
    const horaSalida = document.getElementById('horaSalida');

    // Tabla
    const asistenciaBody = document.getElementById('asistenciaBody');

    // ID de asistencia en edición (null = nueva)
    let asistenciaEnEdicionId = null;

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

    // ==================== CARGA DE CATÁLOGOS ====================

    async function cargarEmpresasEnSelect(selectElement, { incluirVacia = true, textoVacio = 'Seleccione' } = {}) {
        if (!selectElement) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/catalogos/empresas`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al cargar empresas:', data);
                return;
            }

            const empresas = data.data || [];

            selectElement.innerHTML = '';

            if (incluirVacia) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = textoVacio;
                selectElement.appendChild(opt);
            }

            empresas.forEach((emp) => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = emp.nombre;
                selectElement.appendChild(opt);
            });
        } catch (error) {
            console.error('Error de red al cargar empresas:', error);
        }
    }

    async function cargarEmpleadosPorEmpresa(empresaId, selectElement, { incluirVacia = true, textoVacio = 'Seleccione empleado' } = {}) {
        if (!selectElement) return;

        selectElement.innerHTML = '';

        if (!empresaId) {
            if (incluirVacia) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = textoVacio;
                selectElement.appendChild(opt);
            }
            return;
        }

        const params = new URLSearchParams();
        params.append('empresa_id', empresaId);

        const url = `${API_BASE_URL}/api/empleados?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al cargar empleados por empresa:', data);
                if (incluirVacia) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'Sin empleados';
                    selectElement.appendChild(opt);
                }
                return;
            }

            const empleados = data.data || [];

            if (incluirVacia) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = textoVacio;
                selectElement.appendChild(opt);
            }

            empleados.forEach((emp) => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = emp.nombre_completo || emp.nombre || '';
                selectElement.appendChild(opt);
            });

        } catch (error) {
            console.error('Error de red al cargar empleados por empresa:', error);
            if (incluirVacia) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Error al cargar';
                selectElement.appendChild(opt);
            }
        }
    }

    // ==================== LISTADO DE ASISTENCIAS ====================

    async function cargarAsistencias() {
        if (!asistenciaBody) return;

        const params = new URLSearchParams();

        if (filtroEmpresa && filtroEmpresa.value) {
            params.append('empresa_id', filtroEmpresa.value);
        }
        if (filtroFecha && filtroFecha.value) {
            params.append('desde', filtroFecha.value);
            params.append('hasta', filtroFecha.value);
        }

        const url = `${API_BASE_URL}/api/asistencias${params.toString() ? `?${params.toString()}` : ''}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al listar asistencias:', data);
                asistenciaBody.innerHTML = '<tr><td colspan="6">No se pudieron cargar las asistencias.</td></tr>';
                return;
            }

            const asistencias = data.data || [];

            if (asistencias.length === 0) {
                asistenciaBody.innerHTML = '<tr><td colspan="6">No hay registros de asistencia con los filtros actuales.</td></tr>';
                return;
            }

            asistenciaBody.innerHTML = '';

            asistencias.forEach((asis) => {
                const tr = document.createElement('tr');

                // El backend probablemente devuelve algo como:
                // empresa_nombre, empleado_nombre, fecha, hora
                const empresaNombre = asis.empresa_nombre || '';
                const empleadoNombre = asis.empleado_nombre || asis.nombre_empleado || '';
                let fecha = '';
                if (asis.fecha) {
                    fecha = typeof asis.fecha === 'string'
                        ? asis.fecha.slice(0, 10)
                        : new Date(asis.fecha).toISOString().slice(0, 10);
                }

                const horaEntradaValue = asis.hora || '';
                const horaSalidaValue = asis.hora_salida || '-';

                tr.innerHTML = `
          <td>${empresaNombre}</td>
          <td>${empleadoNombre}</td>
          <td>${fecha}</td>
          <td>${horaEntradaValue}</td>
          <td>${horaSalidaValue}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${asis.id}">Editar</button>
            <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${asis.id}">Eliminar</button>
          </td>
        `;

                asistenciaBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error de red al listar asistencias:', error);
            asistenciaBody.innerHTML = '<tr><td colspan="6">Error de conexión al cargar asistencias.</td></tr>';
        }
    }

    // ==================== FORMULARIO: Guardar Asistencia ====================

    function limpiarFormulario() {
        asistenciaEnEdicionId = null;
        if (asistenciaForm) asistenciaForm.reset();
    }

    async function guardarAsistencia(event) {
        event.preventDefault();

        if (!asistenciaForm) return;

        const empresaId = empresaAsistencia && empresaAsistencia.value ? Number(empresaAsistencia.value) : null;
        const empleadoId = empleadoAsistencia && empleadoAsistencia.value ? Number(empleadoAsistencia.value) : null;
        const fecha = fechaAsistencia ? fechaAsistencia.value : '';
        const hora = horaEntrada ? horaEntrada.value : '';
        const horaSalidaValue = horaSalida ? horaSalida.value : '';

        // Validaciones mínimas
        if (!empresaId || !empleadoId || !fecha) {
            alert('Debe seleccionar empresa, empleado y fecha.');
            return;
        }

        if (!hora) {
            alert('Debe ingresar Hora de entrada.');
            return;
        }

        const payload = {
            empleado_id: empleadoId,
            fecha,
            hora,
            hora_salida: horaSalidaValue || null,
            tipo_id: DEFAULT_TIPO_ASISTENCIA_ID,
            observaciones: '', // Podríamos agregar campo en el formulario más adelante
        };

        const esEdicion = !!asistenciaEnEdicionId;
        const url = esEdicion
            ? `${API_BASE_URL}/api/asistencias/${asistenciaEnEdicionId}`
            : `${API_BASE_URL}/api/asistencias`;

        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al guardar asistencia:', data);
                alert(data?.message || 'No fue posible guardar la asistencia.');
                return;
            }

            alert(esEdicion ? 'Asistencia actualizada correctamente.' : 'Asistencia registrada correctamente.');
            limpiarFormulario();
            await cargarAsistencias();

        } catch (error) {
            console.error('Error de red al guardar asistencia:', error);
            alert('Error de conexión al guardar la asistencia.');
        }
    }

    if (asistenciaForm) {
        asistenciaForm.addEventListener('submit', guardarAsistencia);
    }

    // ==================== EDITAR / ELIMINAR DESDE LA TABLA ====================

    if (asistenciaBody) {
        asistenciaBody.addEventListener('click', async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (!action || !id) return;

            if (action === 'edit') {
                await cargarAsistenciaEnFormulario(id);
            }

            if (action === 'delete') {
                const confirmar = confirm('¿Desea eliminar este registro de asistencia?');
                if (!confirmar) return;

                await eliminarAsistencia(id);
            }
        });
    }

    async function cargarAsistenciaEnFormulario(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/asistencias/${id}`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al obtener asistencia:', data);
                alert('No se pudo cargar la información de la asistencia.');
                return;
            }

            const asis = data.data;

            asistenciaEnEdicionId = asis.id;

            // Necesitamos empresaId y empleadoId para rellenar selects
            const empresaId = asis.empresa_id || asis.empresaId;
            const empleadoId = asis.empleado_id || asis.empleadoId;

            if (empresaAsistencia && empresaId) {
                empresaAsistencia.value = empresaId;
                // Cargar empleados de esa empresa y luego seleccionar el empleado
                await cargarEmpleadosPorEmpresa(empresaId, empleadoAsistencia, {
                    incluirVacia: true,
                    textoVacio: 'Seleccione empleado',
                });

                if (empleadoAsistencia && empleadoId) {
                    empleadoAsistencia.value = empleadoId;
                }
            }

            if (fechaAsistencia && asis.fecha) {
                // Normalizar a YYYY-MM-DD para el input date
                let fechaStr = '';

                if (typeof asis.fecha === 'string') {
                    // Si viene como '2025-11-30T03:00:00.000Z'
                    fechaStr = asis.fecha.slice(0, 10);
                } else {
                    // Por si viniera como Date
                    fechaStr = new Date(asis.fecha).toISOString().slice(0, 10);
                }

                fechaAsistencia.value = fechaStr;
            }


            if (horaEntrada && asis.hora) {
                horaEntrada.value = asis.hora;
            }

            // Por ahora no manejamos horaSalida en backend
            if (horaSalida) {
                horaSalida.value = asis.hora_salida || '';
            }

        } catch (error) {
            console.error('Error de red al obtener asistencia:', error);
            alert('Error de conexión al obtener los datos de la asistencia.');
        }
    }

    async function eliminarAsistencia(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/asistencias/${id}`, {
                method: 'DELETE',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al eliminar asistencia:', data);
                alert(data?.message || 'No se pudo eliminar la asistencia.');
                return;
            }

            alert('Asistencia eliminada correctamente.');
            await cargarAsistencias();
        } catch (error) {
            console.error('Error de red al eliminar asistencia:', error);
            alert('Error de conexión al intentar eliminar la asistencia.');
        }
    }

    // ==================== BOTÓN FILTRAR ====================

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', async () => {
            await cargarAsistencias();
        });
    }

    // ==================== CAMBIO DE EMPRESA EN FORMULARIO ====================

    if (empresaAsistencia) {
        empresaAsistencia.addEventListener('change', async () => {
            const empresaId = empresaAsistencia.value;
            await cargarEmpleadosPorEmpresa(empresaId, empleadoAsistencia, {
                incluirVacia: true,
                textoVacio: 'Seleccione empleado',
            });
        });
    }

    // ==================== INICIALIZACIÓN ====================

    (async () => {
        // Empresas en filtros y formulario
        await cargarEmpresasEnSelect(filtroEmpresa, {
            incluirVacia: true,
            textoVacio: 'Todas',
        });

        await cargarEmpresasEnSelect(empresaAsistencia, {
            incluirVacia: true,
            textoVacio: 'Seleccione empresa',
        });

        // Por comodidad, setear la fecha de hoy en filtro y formulario
        const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        if (filtroFecha && !filtroFecha.value) {
            filtroFecha.value = hoy;
        }
        if (fechaAsistencia && !fechaAsistencia.value) {
            fechaAsistencia.value = hoy;
        }

        await cargarAsistencias();
    })();
});
