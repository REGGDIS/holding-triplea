// frontend/js/empleados.js
const API_BASE_URL = 'http://localhost:3000';

const AUTH_USER_KEY = 'hta_user';
const AUTH_TOKEN_KEY = 'hta_token';

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

// Helpers para armar headers con token
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

    // ==== Referencias al DOM ====
    const userNameSpan = document.getElementById('userName');
    const btnLogout = document.getElementById('btnLogout');

    const filtroEmpresa = document.getElementById('filtroEmpresa');
    const filtroComuna = document.getElementById('filtroComuna');
    const filtroEstadoCivil = document.getElementById('filtroEstadoCivil');
    const btnFiltrar = document.getElementById('btnFiltrar');

    const empresaEmpleado = document.getElementById('empresaEmpleado');
    const rutEmpleado = document.getElementById('rutEmpleado');
    const nombreEmpleado = document.getElementById('nombreEmpleado');
    const cargoEmpleado = document.getElementById('cargoEmpleado');
    const estadoCivilEmpleado = document.getElementById('estadoCivilEmpleado');
    const comunaEmpleado = document.getElementById('comunaEmpleado');
    const correoEmpleado = document.getElementById('correoEmpleado');
    const empleadoActivo = document.getElementById('empleadoActivo');
    const empleadoForm = document.getElementById('empleadoForm');

    const empleadosBody = document.getElementById('empleadosBody');

    // ID del empleado actualmente en edición (null = nuevo)
    let empleadoEnEdicionId = null;

    // ==== Mostrar nombre de usuario en la navbar ====
    if (userNameSpan && user && user.nombre_completo) {
        userNameSpan.textContent = `Usuario: ${user.nombre_completo}`;
    }

    // ==== Cerrar sesión ====
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            window.location.href = 'index.html';
        });
    }

    // ==================== CARGA DE CATÁLOGOS ====================

    async function cargarCatalogo(url, selectElement, { incluirOpcionVacia = true, textoVacio = 'Seleccione' } = {}) {
        if (!selectElement) return;

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();
            if (!response.ok || !data || data.ok === false) {
                console.error(`Error al cargar catálogo ${url}:`, data);
                return;
            }

            const items = data.data || [];

            // Limpiar opciones actuales
            selectElement.innerHTML = '';

            if (incluirOpcionVacia) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = textoVacio;
                selectElement.appendChild(opt);
            }

            items.forEach((item) => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.nombre;
                selectElement.appendChild(opt);
            });
        } catch (error) {
            console.error(`Error de red al cargar catálogo ${url}:`, error);
        }
    }

    async function cargarCatalogos() {
        // Empresas
        await cargarCatalogo('/api/catalogos/empresas', filtroEmpresa, {
            incluirOpcionVacia: true,
            textoVacio: 'Todas',
        });
        await cargarCatalogo('/api/catalogos/empresas', empresaEmpleado, {
            incluirOpcionVacia: true,
            textoVacio: 'Seleccione empresa',
        });

        // Comunas
        await cargarCatalogo('/api/catalogos/comunas', filtroComuna, {
            incluirOpcionVacia: true,
            textoVacio: 'Todas',
        });
        await cargarCatalogo('/api/catalogos/comunas', comunaEmpleado, {
            incluirOpcionVacia: true,
            textoVacio: 'Seleccione',
        });

        // Estados civiles
        await cargarCatalogo('/api/catalogos/estados-civiles', filtroEstadoCivil, {
            incluirOpcionVacia: true,
            textoVacio: 'Todos',
        });
        await cargarCatalogo('/api/catalogos/estados-civiles', estadoCivilEmpleado, {
            incluirOpcionVacia: true,
            textoVacio: 'Seleccione',
        });
    }

    // ==================== LISTADO DE EMPLEADOS ====================

    async function cargarEmpleados() {
        if (!empleadosBody) return;

        const params = new URLSearchParams();

        if (filtroEmpresa && filtroEmpresa.value) {
            params.append('empresa_id', filtroEmpresa.value);
        }
        if (filtroComuna && filtroComuna.value) {
            params.append('comuna_id', filtroComuna.value);
        }
        if (filtroEstadoCivil && filtroEstadoCivil.value) {
            params.append('estado_civil_id', filtroEstadoCivil.value);
        }

        const url = `${API_BASE_URL}/api/empleados${params.toString() ? `?${params.toString()}` : ''}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al listar empleados:', data);
                empleadosBody.innerHTML = '<tr><td colspan="7">No se pudieron cargar los empleados.</td></tr>';
                return;
            }

            const empleados = data.data || [];

            if (empleados.length === 0) {
                empleadosBody.innerHTML = '<tr><td colspan="7">No hay empleados registrados con los filtros actuales.</td></tr>';
                return;
            }

            empleadosBody.innerHTML = '';

            empleados.forEach((emp) => {
                const tr = document.createElement('tr');

                const estadoLabel = emp.activo === 1 || emp.activo === true ? 'Activo' : 'Inactivo';

                tr.innerHTML = `
          <td>${emp.empresa_nombre || ''}</td>
          <td>${emp.rut || ''}</td>
          <td>${emp.nombre_completo || ''}</td>
          <td>${emp.comuna_nombre || ''}</td>
          <td>${emp.estado_civil_nombre || ''}</td>
          <td>${estadoLabel}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${emp.id}">Editar</button>
            <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${emp.id}">Eliminar</button>
          </td>
        `;

                empleadosBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error de red al listar empleados:', error);
            empleadosBody.innerHTML = '<tr><td colspan="7">Error de conexión al cargar empleados.</td></tr>';
        }
    }

    // ==================== MANEJO DE FORMULARIO ====================

    function limpiarFormulario() {
        empleadoEnEdicionId = null;
        if (empleadoForm) empleadoForm.reset();
        if (empleadoActivo) empleadoActivo.checked = true;
    }

    async function guardarEmpleado(event) {
        event.preventDefault();

        if (!empleadoForm) return;

        const payload = {
            empresa_id: empresaEmpleado && empresaEmpleado.value ? Number(empresaEmpleado.value) : null,
            rut: rutEmpleado ? rutEmpleado.value.trim() : '',
            nombre_completo: nombreEmpleado ? nombreEmpleado.value.trim() : '',
            cargo: cargoEmpleado ? cargoEmpleado.value.trim() : '',
            estado_civil_id: estadoCivilEmpleado && estadoCivilEmpleado.value ? Number(estadoCivilEmpleado.value) : null,
            comuna_id: comunaEmpleado && comunaEmpleado.value ? Number(comunaEmpleado.value) : null,
            email: correoEmpleado ? correoEmpleado.value.trim() : '',
            activo: empleadoActivo && empleadoActivo.checked ? 1 : 0,
        };

        // Validaciones mínimas frontend
        if (!payload.empresa_id || !payload.rut || !payload.nombre_completo) {
            alert('Debe completar al menos Empresa, RUT y Nombre del empleado.');
            return;
        }

        const esEdicion = !!empleadoEnEdicionId;
        const url = esEdicion
            ? `${API_BASE_URL}/api/empleados/${empleadoEnEdicionId}`
            : `${API_BASE_URL}/api/empleados`;

        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al guardar empleado:', data);
                alert(data?.message || 'No fue posible guardar el empleado.');
                return;
            }

            alert(esEdicion ? 'Empleado actualizado correctamente.' : 'Empleado registrado correctamente.');
            limpiarFormulario();
            await cargarEmpleados();
        } catch (error) {
            console.error('Error de red al guardar empleado:', error);
            alert('Error de conexión al guardar el empleado.');
        }
    }

    if (empleadoForm) {
        empleadoForm.addEventListener('submit', guardarEmpleado);
    }

    // ==================== ACCIONES DE TABLA (EDITAR / ELIMINAR) ====================

    if (empleadosBody) {
        empleadosBody.addEventListener('click', async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (!action || !id) return;

            if (action === 'edit') {
                await cargarEmpleadoEnFormulario(id);
            }

            if (action === 'delete') {
                const confirmar = confirm('¿Desea marcar este empleado como inactivo?');
                if (!confirmar) return;

                await eliminarEmpleado(id);
            }
        });
    }

    async function cargarEmpleadoEnFormulario(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/empleados/${id}`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al obtener empleado:', data);
                alert('No se pudo cargar la información del empleado.');
                return;
            }

            const emp = data.data;

            empleadoEnEdicionId = emp.id;

            if (empresaEmpleado) empresaEmpleado.value = emp.empresa_id ?? '';
            if (rutEmpleado) rutEmpleado.value = emp.rut ?? '';
            if (nombreEmpleado) nombreEmpleado.value = emp.nombre_completo ?? '';
            if (cargoEmpleado) cargoEmpleado.value = emp.cargo ?? '';
            if (estadoCivilEmpleado) estadoCivilEmpleado.value = emp.estado_civil_id ?? '';
            if (comunaEmpleado) comunaEmpleado.value = emp.comuna_id ?? '';
            if (correoEmpleado) correoEmpleado.value = emp.email ?? '';
            if (empleadoActivo) empleadoActivo.checked = emp.activo === 1 || emp.activo === true;
        } catch (error) {
            console.error('Error de red al obtener empleado:', error);
            alert('Error de conexión al obtener los datos del empleado.');
        }
    }

    async function eliminarEmpleado(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/empleados/${id}`, {
                method: 'DELETE',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al eliminar empleado:', data);
                alert(data?.message || 'No se pudo eliminar (desactivar) el empleado.');
                return;
            }

            alert('Empleado marcado como inactivo correctamente.');
            await cargarEmpleados();
        } catch (error) {
            console.error('Error de red al eliminar empleado:', error);
            alert('Error de conexión al intentar eliminar el empleado.');
        }
    }

    // ==================== BOTÓN FILTRAR ====================

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', async () => {
            await cargarEmpleados();
        });
    }

    // ==================== INICIALIZACIÓN ====================

    (async () => {
        await cargarCatalogos();
        await cargarEmpleados();
    })();
});
