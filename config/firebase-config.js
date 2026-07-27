// ================================================================
// FIREBASE-CONFIG.JS — COMPLETE FIXED VERSION
// ================================================================

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQzV4y2RSBE4RswMqnwAx7gaoYg-7GmyQ",
    authDomain: "truly-yours-artisan-hub.firebaseapp.com",
    projectId: "truly-yours-artisan-hub",
    storageBucket: "truly-yours-artisan-hub.firebasestorage.app",
    messagingSenderId: "484328460999",
    appId: "1:484328460999:web:2ab071c8577ccb85c064e2"
};

// ============================================================
// 1. INITIALIZE FIREBASE (ONCE)
// ============================================================
firebase.initializeApp(firebaseConfig);
console.log('✅ Firebase initialized successfully!');

// ============================================================
// 2. INITIALIZE SERVICES
// ============================================================
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ============================================================
// 3. SET AUTH PERSISTENCE (ONCE)
// ============================================================
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('✅ Auth persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('❌ Auth persistence error:', error);
    });

// ============================================================
// 4. SET FIRESTORE SETTINGS (ONCE, BEFORE ANY OTHER OPERATIONS)
// ============================================================
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// ============================================================
// 5. ENABLE OFFLINE PERSISTENCE (ONCE)
// ============================================================
db.enablePersistence({
    synchronizeTabs: true  // This allows multi-tab support
})
.then(() => {
    console.log('✅ Firestore persistence enabled');
})
.catch((error) => {
    console.error('❌ Firestore persistence error:', error);
    if (error.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence disabled in this tab');
    } else if (error.code === 'unimplemented') {
        console.warn('⚠️ Persistence not supported in this browser');
    }
});

// ============================================================
// 6. EXPORT FOR USE IN OTHER SCRIPTS
// ============================================================
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebaseApp = firebase.app();

console.log('✅ Firebase fully configured and ready');

// ============================================================
// 7. WEBHOOK CONFIGURATION (Optional - keep this)
// ============================================================
window.CONFIG = {
    ...window.CONFIG,
    WEBHOOK_URL: 'https://artmecca.com/api/verification-callback',
    REDIRECT_URL: 'https://artmecca.com/api/verification-callback.html',
    SUMSUB_API_URL: 'https://api.sumsub.com'
};
