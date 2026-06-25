// Universal auth check for all pages
(function() {
    // Function to update header when auth is ready
    function updateHeaderAuth() {
        if (typeof authManager !== 'undefined') {
            console.log('Auth check: Updating UI');
            authManager.updateUI();
            return true;
        }
        return false;
    }

    // Try immediately
    if (!updateHeaderAuth()) {
        // Retry a few times
        let retries = 0;
        const interval = setInterval(function() {
            retries++;
            if (updateHeaderAuth() || retries > 20) {
                clearInterval(interval);
            }
        }, 100);
    }

    // Listen for Firebase auth state changes
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(function(user) {
            console.log('Auth state changed on page:', user ? user.email : 'none');
            if (typeof authManager !== 'undefined') {
                authManager.currentUser = user;
                authManager.updateUI();
            }
        });
    }

    // Also listen for pageshow (back/forward navigation)
    window.addEventListener('pageshow', function() {
        if (typeof authManager !== 'undefined') {
            authManager.updateUI();
        }
    });
})();
