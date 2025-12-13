// frontend/js/empresas.js
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

document.addEventListener('DOMContentLoaded', () => {
    const session = requireAuth();
    if (!session) return;

    const { user, token } = session;

    // ======== Referencias al DOM ========
    const userNameSpan = document.getElementById('userName');
    const btnLogout = document.getElementById('btnLogout');

    // Filtros listado
    const filtroTexto = document.getElementById('filtroTexto');        // input buscar
    const filtroEstado = document.getElementById('filtroEstado');      // select activas / todas
    const btnActualizar = document.getElementById('btnActualizarLista');

    // Tabla
    const tbody = document.getElementById('empresasBody');

    // Formulario
    const empresaForm = document.getElementById('empresaForm');
    const empresaIdHidden = document.getElementById('empresaId');
    const empresaNombre = document.getElementById('empresaNombre');
    const empresaRut = document.getElementById('empresaRut');
    const empresaGiro = document.getElementById('empresaGiro');
    const empresaComuna = document.getElementById('empresaComuna');
    const empresaDireccion = document.getElementById('empresaDireccion');
    const empresaTelefono = document.getElementById('empresaTelefono');
    const empresaCorreo = document.getElementById('empresaCorreo');
    const empresaActiva = document.getElementById('empresaActiva');
    const btnNuevaEmpresa = document.getElementById('btnNuevaEmpresa');
    const empresaFormAlert = document.getElementById('empresaFormAlert');

    let empresaEnEdicionId = null;

    // ======== Navbar: usuario + logout ========
    if (userNameSpan && user?.nombre_completo) {
        userNameSpan.textContent = `Usuario: ${user.nombre_completo}`;
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            window.location.href = 'index.html';
        });
    }

    // ==================== CARGA DE COMUNAS ====================
    async function cargarComunas() {
        if (!empresaComuna) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/catalogos/comunas`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al cargar comunas:', data);
                return;
            }

            const comunas = data.data || [];

            empresaComuna.innerHTML = '';

            const optDefault = document.createElement('option');
            optDefault.value = '';
            optDefault.textContent = 'Seleccione comuna';
            empresaComuna.appendChild(optDefault);

            comunas.forEach((c) => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre;
                empresaComuna.appendChild(opt);
            });
        } catch (error) {
            console.error('Error de red al cargar comunas:', error);
        }
    }

    // ==================== CARGA DE EMPRESAS ====================
    async function cargarEmpresas() {
        if (!tbody) return;

        const params = new URLSearchParams();
        const texto = filtroTexto?.value.trim();
        const estado = filtroEstado?.value; // 'activas' | 'todas'

        if (texto) params.append('busqueda', texto);
        // Por defecto el backend devuelve solo activas.
        // Si el usuario elige "Todas", incluimos también inactivas.
        if (estado === 'todas') {
            params.append('incluirInactivas', 'true');
        }

        const url = `${API_BASE_URL}/api/empresas${params.toString() ? `?${params}` : ''}`;

        try {
            const res = await fetch(url, { headers: authHeaders(token) });
            const data = await res.json();

            if (!res.ok || !data || data.ok === false) {
                console.error('Error al listar empresas:', data);
                tbody.innerHTML = '<tr><td colspan="7">No se pudieron cargar las empresas.</td></tr>';
                return;
            }

            const empresas = data.data || [];

            if (empresas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No hay empresas con los filtros actuales.</td></tr>';
                return;
            }

            tbody.innerHTML = '';

            empresas.forEach((emp) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${emp.nombre}</td>
          <td>${emp.rut}</td>
          <td>${emp.comuna_nombre || ''}</td>
          <td>${emp.telefono || ''}</td>
          <td>${emp.correo_contacto || ''}</td>
          <td>${emp.activo ? 'Activa' : 'Inactiva'}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${emp.id}">Editar</button>
            <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${emp.id}">Eliminar</button>
          </td>
        `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error('Error de red al listar empresas:', err);
            tbody.innerHTML = '<tr><td colspan="7">Error de conexión al cargar empresas.</td></tr>';
        }
    }

    // ==================== GUARDAR / EDITAR EMPRESA ====================
    async function guardarEmpresa(event) {
        event.preventDefault();
        if (!empresaForm) return;

        // Validaciones mínimas
        if (!empresaNombre.value.trim() || !empresaRut.value.trim()) {
            mostrarMensajeFormulario('Debe indicar al menos Nombre y RUT de la empresa.', 'error');
            return;
        }

        const payload = {
            nombre: empresaNombre.value.trim(),
            rut: empresaRut.value.trim(),
            giro: empresaGiro.value.trim() || null,
            comuna_id: empresaComuna.value ? Number(empresaComuna.value) : null,
            direccion: empresaDireccion.value.trim() || null,
            telefono: empresaTelefono.value.trim() || null,
            correo_contacto: empresaCorreo.value.trim() || null,
            activo: empresaActiva.checked ? 1 : 0,
        };

        const esEdicion = !!empresaEnEdicionId;
        const url = esEdicion
            ? `${API_BASE_URL}/api/empresas/${empresaEnEdicionId}`
            : `${API_BASE_URL}/api/empresas`;
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al guardar empresa:', data);
                alert(data?.message || 'No fue posible guardar la empresa.');
                return;
            }

            alert(esEdicion ? 'Empresa actualizada correctamente.' : 'Empresa registrada correctamente.');
            limpiarFormulario();
            await cargarEmpresas();
        } catch (error) {
            console.error('Error de red al guardar empresa:', error);
            alert('Error de conexión al guardar la empresa.');
        }
    }

    // ==================== LIMPIAR FORMULARIO ====================
    function limpiarFormulario() {
        empresaEnEdicionId = null;
        if (empresaIdHidden) empresaIdHidden.value = '';
        if (empresaForm) empresaForm.reset();
        if (empresaActiva) empresaActiva.checked = true;
        if (empresaFormAlert) empresaFormAlert.textContent = '';
    }

    function mostrarMensajeFormulario(mensaje, tipo = 'info') {
        if (!empresaFormAlert) return;
        empresaFormAlert.textContent = mensaje;
        empresaFormAlert.className = `form-alert form-alert--${tipo}`;
    }

    // ==================== EDITAR / ELIMINAR EMPRESA ====================
    if (tbody) {
        tbody.addEventListener('click', async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (!action || !id) return;

            if (action === 'edit') {
                await cargarEmpresaEnFormulario(id);
            }

            if (action === 'delete') {
                const confirmar = confirm('¿Desea eliminar esta empresa?');
                if (!confirmar) return;

                await eliminarEmpresa(id);
            }
        });
    }

    async function cargarEmpresaEnFormulario(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/empresas/${id}`, {
                method: 'GET',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al obtener empresa:', data);
                alert('No se pudo cargar la información de la empresa.');
                return;
            }

            const empresa = data.data;

            empresaEnEdicionId = empresa.id;
            if (empresaIdHidden) empresaIdHidden.value = empresa.id;

            empresaNombre.value = empresa.nombre || '';
            empresaRut.value = empresa.rut || '';
            empresaGiro.value = empresa.giro || '';
            empresaComuna.value = empresa.comuna_id != null ? String(empresa.comuna_id) : '';
            empresaDireccion.value = empresa.direccion || '';
            empresaTelefono.value = empresa.telefono || '';
            empresaCorreo.value = empresa.correo_contacto || '';
            empresaActiva.checked = empresa.activo === 1;
        } catch (error) {
            console.error('Error de red al obtener empresa:', error);
            alert('Error de conexión al obtener los datos de la empresa.');
        }
    }

    async function eliminarEmpresa(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/empresas/${id}`, {
                method: 'DELETE',
                headers: authHeaders(token),
            });

            const data = await response.json();

            if (!response.ok || !data || data.ok === false) {
                console.error('Error al eliminar empresa:', data);
                alert(data?.message || 'No se pudo eliminar la empresa.');
                return;
            }

            alert('Empresa eliminada correctamente.');
            await cargarEmpresas();
        } catch (error) {
            console.error('Error de red al eliminar empresa:', error);
            alert('Error de conexión al intentar eliminar la empresa.');
        }
    }

    // ==================== EVENTOS ====================
    if (empresaForm) {
        empresaForm.addEventListener('submit', guardarEmpresa);
    }

    if (btnNuevaEmpresa) {
        btnNuevaEmpresa.addEventListener('click', limpiarFormulario);
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', () => {
            cargarEmpresas();
        });
    }

    if (filtroTexto) {
        filtroTexto.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                cargarEmpresas();
            }
        });
    }

    // ==================== INICIALIZACIÓN ====================
    (async () => {
        await cargarComunas();   // rellena el combo de comunas
        await cargarEmpresas();  // carga la tabla inicial
    })();
});
