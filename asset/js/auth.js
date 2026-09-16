(function () {
    'use strict';

    if (!window.LostLink) {
        return;
    }

    const {
        request,
        saveSession,
        clearSession,
        getStoredUser
    } = window.LostLink;

    function showMessage(element, message, isError = false) {
        if (!element) return;

        element.textContent = message;
        element.style.display = 'block';
        element.style.color = isError ? '#b42318' : '#16794b';
    }

    async function handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const message = document.getElementById('authMessage');

        try {
            const data = await request('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            saveSession(data.token, data.user);

            const next = new URLSearchParams(location.search).get('next');
            location.href = next || 'index.html';
        } catch (error) {
            showMessage(message, error.message, true);
        }
    }

    async function handleRegister(event) {
        event.preventDefault();

        const fullName = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const message = document.getElementById('authMessage');

        if (password !== confirmPassword) {
            showMessage(message, 'Mật khẩu nhập lại chưa khớp.', true);
            return;
        }

        try {
            const data = await request('/api/auth/register', {
                method: 'POST',
                body: { fullName, email, password }
            });

            saveSession(data.token, data.user);
            location.href = 'index.html';
        } catch (error) {
            showMessage(message, error.message, true);
        }
    }

    function setupLogoutButtons() {
        document.querySelectorAll('[data-user-logout]').forEach((button) => {
            button.addEventListener('click', () => {
                clearSession();
                location.href = 'index.html';
            });
        });
    }

    function renderCurrentUser() {
        const user = getStoredUser();

        document.querySelectorAll('[data-current-user]').forEach((element) => {
            element.textContent = user ? user.full_name : 'Khách';
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('userLoginForm')?.addEventListener('submit', handleLogin);
        document.getElementById('userRegisterForm')?.addEventListener('submit', handleRegister);

        setupLogoutButtons();
        renderCurrentUser();
    });
})();
