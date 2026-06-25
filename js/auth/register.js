// Register functionality - FIXED
document.addEventListener('DOMContentLoaded', function() {
    // FIXED: Use the correct form ID from HTML
    const registerForm = document.getElementById('registerForm');
    const authBtn = document.querySelector('.btn-submit'); // FIXED: Use the correct button class
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const dateOfBirth = document.getElementById('dateOfBirth');
    const terms = document.getElementById('terms');
    const passwordToggle = document.getElementById('passwordToggle');

    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.querySelector('i').className =
                type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // Set max date for DOB (13 years ago)
    const today = new Date();
    const maxDate = new Date(
        today.getFullYear() - 13,
        today.getMonth(),
        today.getDate()
    );
    if (dateOfBirth) {
        dateOfBirth.max = maxDate.toISOString().split('T')[0];
    }

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updateStrengthBar(strength);
        });
    }

    // Form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            const terms = document.getElementById('terms').checked;

            // Validation
            if (!terms) {
                showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }

            if (!fullname) {
                showMessage('Please enter your full name', 'error');
                return;
            }

            if (!email) {
                showMessage('Please enter your email address', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage('Password must be at least 6 characters', 'error');
                return;
            }

            // Validate DOB
            if (!dateOfBirth) {
                showMessage('Please enter your date of birth.', 'error');
                return;
            }

            // Validate age (at least 13)
            const dob = new Date(dateOfBirth);
            const age = new Date().getFullYear() - dob.getFullYear();
            const monthDiff = new Date().getMonth() - dob.getMonth();
            const finalAge = monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < dob.getDate())
                ? age - 1
                : age;

            if (finalAge < 13) {
                showMessage('You must be at least 13 years old to join Art Mecca.', 'error');
                return;
            }

            // Show loading state
            if (authBtn) {
                authBtn.disabled = true;
                authBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            }

            try {
                const result = await authManager.register(
                    email,
                    password,
                    fullname,
                    dateOfBirth
                );

                if (result.success) {
                    showMessage('Account created! Please check your email to verify your account.', 'success');
                    setTimeout(() => {
                        window.location.href = '/pages/auth/login.html';
                    }, 3000);
                } else {
                    showMessage(result.error || 'Registration failed. Please try again.', 'error');
                    if (authBtn) {
                        authBtn.disabled = false;
                        authBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage(error.message || 'Registration failed. Please try again.', 'error');
                if (authBtn) {
                    authBtn.disabled = false;
                    authBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                }
            }
        });
    } else {
        console.error('Register form not found!');
    }

    // Password strength calculation
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25; // Special characters
        return Math.min(strength, 100);
    }

    function updateStrengthBar(strength) {
        const strengthBar = document.querySelector('.strength-bar');
        if (!strengthBar) return;

        strengthBar.style.width = strength + '%';
        strengthBar.style.background =
            strength < 40 ? '#ef4444' :
            strength < 70 ? '#f59e0b' :
            '#10b981';
    }

    function showMessage(message, type) {
        // Remove existing message
        const existingMessage = document.getElementById('auth-message');
        if (existingMessage) existingMessage.remove();

        const messageEl = document.createElement('div');
        messageEl.id = 'auth-message';
        messageEl.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
            font-weight: 500;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            animation: fadeIn 0.3s ease;
        `;
        messageEl.textContent = message;

        const form = document.getElementById('registerForm');
        if (form) {
            form.insertBefore(messageEl, form.firstChild);
        }

        // Hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.opacity = '0';
                messageEl.style.transition = 'opacity 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
