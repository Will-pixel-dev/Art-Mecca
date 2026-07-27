// ================================================================
// LOGIN.JS — COMPLETE FIXED VERSION
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login page loaded');

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');
    const googleBtn = document.getElementById('googleLoginBtn');
    const authMessage = document.getElementById('auth-message');

    // ============================================================
    // WAIT FOR FIREBASE
    // ============================================================
    function waitForFirebase() {
        return new Promise((resolve) => {
            // Check if Firebase is already available
            if (typeof firebase !== 'undefined' && firebase.app) {
                console.log('✅ Firebase already available');
                resolve();
                return;
            }

            console.log('⏳ Waiting for Firebase...');
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max

            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.app) {
                    clearInterval(checkInterval);
                    console.log('✅ Firebase is now available');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('❌ Firebase failed to load after 5 seconds');
                    resolve(); // Resolve anyway to show error message
                }
            }, 100);
        });
    }

    // ============================================================
    // SHOW MESSAGE
    // ============================================================
    function showMessage(text, type = 'error') {
        if (authMessage) {
            authMessage.textContent = text;
            authMessage.className = type;
            authMessage.style.display = 'block';
            setTimeout(() => {
                authMessage.style.display = 'none';
            }, 5000);
        } else {
            alert(text);
        }
    }

    // ============================================================
    // EMAIL/PASSWORD LOGIN
    // ============================================================
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Login form submitted');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validation
            if (!email) {
                showMessage('Please enter your email address.', 'error');
                emailInput.focus();
                return;
            }

            if (!password) {
                showMessage('Please enter your password.', 'error');
                passwordInput.focus();
                return;
            }

            // Disable button
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

            try {
                // Wait for Firebase to be ready
                await waitForFirebase();

                // Check if Firebase is available
                if (typeof firebase === 'undefined' || !firebase.app) {
                    showMessage('Firebase failed to load. Please refresh the page.', 'error');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                    return;
                }

                console.log('🔑 Attempting login for:', email);

                // Attempt login
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

                console.log('✅ Login successful:', userCredential.user.email);

                // Show success message
                showMessage('Login successful! Redirecting...', 'success');

                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);

            } catch (error) {
                console.error('❌ Login error:', error);

                // Get user-friendly error message
                let errorMessage = 'Login failed. Please try again.';

                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email. Please sign up.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Please enter a valid email address.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled. Please contact support.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                    default:
                        errorMessage = error.message || 'Login failed. Please try again.';
                }

                showMessage(errorMessage, 'error');

                // Re-enable button
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        });
    }

    // ============================================================
    // GOOGLE LOGIN
    // ============================================================
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            console.log('🔑 Google login clicked');

            // Disable button
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            try {
                // Wait for Firebase to be ready
                await waitForFirebase();

                // Check if Firebase is available
                if (typeof firebase === 'undefined' || !firebase.app) {
                    showMessage('Firebase failed to load. Please refresh the page.', 'error');
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = 'Continue with Google';
                    return;
                }

                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });

                const result = await firebase.auth().signInWithPopup(provider);

                console.log('✅ Google login successful:', result.user.email);

                showMessage('Google login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = '/';
                }, 500);

            } catch (error) {
                console.error('❌ Google login error:', error);

                if (error.code === 'auth/popup-closed-by-user') {
                    // User closed the popup, no need to show error
                    console.log('Google popup closed by user');
                } else if (error.code === 'auth/popup-blocked') {
                    showMessage('Popup was blocked. Please allow popups for this site.', 'error');
                } else {
                    let errorMessage = 'Google login failed. Please try again.';
                    if (error.message) errorMessage = error.message;
                    showMessage(errorMessage, 'error');
                }

                // Re-enable button
                googleBtn.disabled = false;
                googleBtn.innerHTML = 'Continue with Google';
            }
        });
    }

    // ============================================================
    // PASSWORD TOGGLE
    // ============================================================
    const passwordToggle = document.getElementById('passwordToggle');
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }

    // ============================================================
    // REMEMBER ME (save email to localStorage)
    // ============================================================
    if (rememberCheckbox && emailInput) {
        // Check if email was saved
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }

        rememberCheckbox.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('rememberedEmail', emailInput.value.trim());
            } else {
                localStorage.removeItem('rememberedEmail');
            }
        });
    }

    // Save email on input change if remember is checked
    if (emailInput && rememberCheckbox) {
        emailInput.addEventListener('change', function() {
            if (rememberCheckbox.checked) {
                localStorage.setItem('rememberedEmail', this.value.trim());
            }
        });
    }

    console.log('✅ Login page initialized');
});
