const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberInput = document.getElementById('rememberMe');
    const alertContainer = document.getElementById('alertContainer');

    const btnLogin = document.getElementById('btnLogin');
    const btnLoginText = document.getElementById('btnLoginText');
    const btnLoginLoader = document.getElementById('btnLoginLoader');

    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    const togglePassword = document.getElementById('togglePassword');

    // Mostrar / ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
        });
    }

    function resetErrors() {
        if (emailError) {
            emailError.textContent = '';
            emailError.classList.add('d-none');
        }
        if (passwordError) {
            passwordError.textContent = '';
            passwordError.classList.add('d-none');
        }
        if (emailInput) {
            emailInput.classList.remove('error');
        }
        if (passwordInput) {
            passwordInput.classList.remove('error');
        }
    }

    function setButtonLoading(isLoading) {
        if (!btnLogin || !btnLoginText || !btnLoginLoader) return;
        btnLogin.disabled = isLoading;
        if (isLoading) {
            btnLoginText.classList.add('d-none');
            btnLoginLoader.classList.remove('d-none');
        } else {
            btnLoginText.classList.remove('d-none');
            btnLoginLoader.classList.add('d-none');
        }
    }

    function showAlert(message, type = 'danger') {
        if (!alertContainer) return;
        alertContainer.className = `alert alert-${type}`;
        alertContainer.textContent = message;
    }

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        resetErrors();

        if (alertContainer) {
            alertContainer.classList.add('d-none');
            alertContainer.textContent = '';
            alertContainer.className = 'alert d-none';
        }

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        const rememberMe = !!(rememberInput && rememberInput.checked);

        let hasError = false;

        // Validación email
        if (!email) {
            if (emailError) {
                emailError.textContent = 'Debe ingresar un correo electrónico.';
                emailError.classList.remove('d-none');
            }
            if (emailInput) {
                emailInput.classList.add('error');
            }
            hasError = true;
        } else {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                if (emailError) {
                    emailError.textContent = 'El correo electrónico no tiene un formato válido.';
                    emailError.classList.remove('d-none');
                }
                if (emailInput) {
                    emailInput.classList.add('error');
                }
                hasError = true;
            }
        }

        // Validación password
        if (!password) {
            if (passwordError) {
                passwordError.textContent = 'Debe ingresar una contraseña.';
                passwordError.classList.remove('d-none');
            }
            if (passwordInput) {
                passwordInput.classList.add('error');
            }
            hasError = true;
        }

        if (hasError) {
            return;
        }

        try {
            setButtonLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data || data.ok === false) {
                const message =
                    (data && data.message) ||
                    'No fue posible iniciar sesión. Verifique sus credenciales.';
                showAlert(message, 'danger');
                if (alertContainer) {
                    alertContainer.classList.remove('d-none');
                }
                return;
            }

            // Login exitoso
            const { user, token } = data;

            // Guardar en localStorage
            localStorage.setItem('hta_user', JSON.stringify(user));
            localStorage.setItem('hta_token', token);
            localStorage.setItem('hta_remember', rememberMe ? '1' : '0');

            // Redirigir al dashboard (lo crearemos después)
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error en login:', error);
            showAlert('Error de conexión con el servidor. Intente nuevamente.', 'danger');
            if (alertContainer) {
                alertContainer.classList.remove('d-none');
            }
        } finally {
            setButtonLoading(false);
        }
    });
});
