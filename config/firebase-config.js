// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQzV4y2RSBE4RswMqnwAx7gaoYg-7GmyQ",
    authDomain: "truly-yours-artisan-hub.firebaseapp.com",
    projectId: "truly-yours-artisan-hub",
    storageBucket: "truly-yours-artisan-hub.firebasestorage.app",
    messagingSenderId: "484328460999",
    appId: "1:484328460999:web:2ab071c8577ccb85c064e2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ CRITICAL FIX: Set persistence to LOCAL (stay logged in)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('✅ Auth persistence set to LOCAL - user will stay logged in');
    })
    .catch((error) => {
        console.error('❌ Error setting persistence:', error);
    });

console.log('Firebase initialized successfully!');

// Enable offline persistence for better performance
firebase.firestore().enablePersistence({
  synchronizeTabs: true
})
.then(() => {
  console.log('✅ Firestore persistence enabled');
})
.catch((err) => {
  console.warn('Firestore persistence error:', err);
});

// Configure settings for better performance
firebase.firestore().settings({
  merge: true,
  ignoreUndefinedProperties: true
});
// config/firebase-config.js - Add these at the bottom

// Webhook Configuration
window.CONFIG = {
    ...window.CONFIG,
    WEBHOOK_URL: 'https://artmecca.com/api/verification-callback',
    REDIRECT_URL: 'https://artmecca.com/api/verification-callback.html',
    SUMSUB_API_URL: 'https://api.sumsub.com'
};

