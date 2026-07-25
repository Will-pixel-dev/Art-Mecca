document.addEventListener('DOMContentLoaded', function() {

    function initLogin() {
        if (typeof authManager === 'undefined') {
            console.log('Waiting for authManager...');
            setTimeout(initLogin, 200);
            return;
        }

        console.log('Setting up login...');

        const form = document.getElementById('login-form');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const submitBtn = document.getElementById('loginBtn');

        if (!form || !email || !password || !submitBtn) {
            console.error('Login elements not found!');
            return;
        }

        console.log('✅ All login elements found');

        form.setAttribute('novalidate', 'true');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Login form submitted');

            const emailVal = email.value.trim();
            const passwordVal = password.value.trim();

            if (!emailVal) {
                showMessage('Please enter your email.', 'error');
                email.focus();
                return;
            }
            if (!emailVal.includes('@')) {
                showMessage('Please enter a valid email.', 'error');
                email.focus();
                return;
            }
            if (!passwordVal) {
                showMessage('Please enter your password.', 'error');
                password.focus();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

            try {
                const result = await authManager.login(emailVal, passwordVal);
                console.log('Login result:', result);

                if (result.success) {
                    showMessage('✅ Login successful! Redirecting...', 'success');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';

                    setTimeout(() => {
                        const redirect = sessionStorage.getItem('redirectAfterLogin') || '/';
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirect;
                    }, 1500);
                } else {
                    showMessage(result.error || 'Login failed.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('Error: ' + (error.message || 'Login failed'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        });
    }

    function showMessage(message, type) {
        const existing = document.getElementById('auth-message');
        if (existing) existing.remove();

        const msg = document.createElement('div');
        msg.id = 'auth-message';
        msg.className = type;
        msg.textContent = message;

        const form = document.getElementById('login-form');
        if (form) {
            form.insertBefore(msg, form.firstChild);
        }

        setTimeout(() => {
            if (msg.parentNode) {
                msg.style.opacity = '0';
                msg.style.transition = 'opacity 0.3s ease';
                setTimeout(() => { if (msg.parentNode) msg.remove(); }, 300);
            }
        }, 5000);
    }

    initLogin();
});
