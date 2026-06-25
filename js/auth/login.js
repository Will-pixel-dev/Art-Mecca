// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const authBtn = document.querySelector('.auth-btn');

    if (!loginForm) {
        console.error("Login form not found!");
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }

        const originalText = authBtn.innerHTML;
        authBtn.disabled = true;
        authBtn.innerHTML = 'Signing In...';

        try {
            if (!authManager) {
                throw new Error('Auth manager not loaded');
            }

            const result = await authManager.login(email, password);

            if (result.success) {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect') || '/index.html';
                    window.location.href = redirect;
                }, 1000);
            } else {
                showMessage(result.error || 'Login failed', 'error');
                authBtn.disabled = false;
                authBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An unexpected error occurred: ' + error.message, 'error');
            authBtn.disabled = false;
            authBtn.innerHTML = originalText;
        }
    });

    function showMessage(message, type) {
        let messageEl = document.getElementById('auth-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'auth-message';
            messageEl.style.cssText = `
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 16px;
                text-align: center;
                font-weight: 500;
            `;
            loginForm.parentNode.insertBefore(messageEl, loginForm);
        }

        messageEl.textContent = message;
        messageEl.style.display = 'block';
        messageEl.style.background = type === 'success' ? '#10b981' : '#ef4444';
        messageEl.style.color = 'white';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
});
