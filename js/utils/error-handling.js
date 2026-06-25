/**
 * User-Friendly Error Handler
 * Converts technical errors into human-readable messages
 */

class ErrorHandler {
  // Error message mappings
  static errorMessages = {
    // Firebase Auth Errors
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered. Please login or use a different email.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network connection issue. Please check your internet and try again.',
    'auth/internal-error': 'Something went wrong. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/requires-recent-login': 'For security, please re-authenticate before making this change.',
    'auth/email-already-exists': 'This email is already in use by another account.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/credential-already-in-use': 'This account is already linked to another user.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-email-verified': 'Email verification failed. Please try again.',

    // Firestore Errors
    'firestore/permission-denied': "You don't have permission to perform this action.",
    'firestore/unavailable': 'The service is temporarily unavailable. Please try again later.',
    'firestore/not-found': 'The requested item could not be found.',
    'firestore/aborted': 'The operation was aborted. Please try again.',
    'firestore/failed-precondition': 'The operation failed due to a conflict. Please refresh and try again.',
    'firestore/out-of-range': 'The requested range is invalid.',
    'firestore/already-exists': 'This item already exists.',
    'firestore/resource-exhausted': 'Too many requests. Please slow down and try again.',
    'firestore/cancelled': 'The operation was cancelled.',
    'firestore/data-loss': 'Data loss occurred. Please contact support.',
    'firestore/unknown': 'An unknown error occurred. Please try again.',

    // Storage Errors
    'storage/unknown': 'An unknown error occurred while uploading.',
    'storage/object-not-found': 'The file could not be found.',
    'storage/bucket-not-found': 'Storage bucket not found.',
    'storage/project-not-found': 'Storage project not found.',
    'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
    'storage/unauthenticated': 'Please login to upload files.',
    'storage/unauthorized': "You don't have permission to upload files.",
    'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again later.',
    'storage/invalid-checksum': 'File upload failed due to a checksum error. Please try again.',
    'storage/canceled': 'Upload was cancelled.',
    'storage/invalid-event-name': 'Invalid event name.',
    'storage/invalid-url': 'Invalid file URL.',
    'storage/invalid-argument': 'Invalid file provided. Please try again.',
    'storage/no-default-bucket': 'No default storage bucket found.',
    'storage/cannot-slice-blob': 'Unable to slice file. Please try again with a different file.',
    'storage/server-file-wrong-size': 'Server file size mismatch. Please try again.',

    // Network Errors
    'network-offline': 'You appear to be offline. Please check your internet connection.',
    'network-timeout': 'Request timed out. Please check your connection and try again.',
    'network-aborted': 'Connection was interrupted. Please try again.',
    'network-error': 'Network error. Please check your connection.',

    // General Errors
    'file-too-large': 'This file is too large. Please select a smaller file (max 10MB).',
    'invalid-file-type': 'Invalid file type. Please upload a valid image (PNG, JPG, WebP).',
    'no-selection': 'Please select an option first.',
    'required-field': 'Please fill in all required fields.',
    'save-failed': 'Failed to save. Please try again.',
    'delete-failed': 'Failed to delete. Please try again.',
    'upload-failed': 'Upload failed. Please try again.'
  };

  /**
   * Get a user-friendly error message
   * @param {Error|string} error - The error object or error code
   * @param {string} fallback - Fallback message if no mapping found
   * @returns {string} User-friendly error message
   */
  static getMessage(error, fallback = 'Something went wrong. Please try again.') {
    // If error is a string, try to use it as a key
    if (typeof error === 'string') {
      return this.errorMessages[error] || fallback;
    }

    // If error has a code property
    if (error && error.code) {
      // Check for Firebase auth errors (format: auth/xxx)
      if (error.code.startsWith('auth/')) {
        return this.errorMessages[error.code] || fallback;
      }
      // Check for Firestore errors (format: firestore/xxx)
      if (error.code.startsWith('firestore/')) {
        return this.errorMessages[error.code] || fallback;
      }
      // Check for Storage errors (format: storage/xxx)
      if (error.code.startsWith('storage/')) {
        return this.errorMessages[error.code] || fallback;
      }
      // Return generic error if no mapping found
      return this.errorMessages[error.code] || fallback;
    }

    // If error has a message, try to extract the code from it
    if (error && error.message) {
      // Try to extract Firebase error code from message
      const match = error.message.match(/\(([a-z]+\/[a-z-]+)\)/);
      if (match && match[1]) {
        return this.errorMessages[match[1]] || fallback;
      }
      // Return the raw message if it's user-friendly
      if (error.message.length < 100 && !error.message.includes('[')) {
        return error.message;
      }
    }

    return fallback;
  }

  /**
   * Show a user-friendly error toast/notification
   * @param {Error|string} error - The error object or error code
   * @param {string} fallback - Fallback message if no mapping found
   * @param {Function} toastFn - Toast function to use (defaults to showToast)
   */
  static show(error, fallback = 'Something went wrong. Please try again.', toastFn = null) {
    const message = this.getMessage(error, fallback);

    // Log the actual error to console for debugging
    if (error && error.code) {
      console.error(`[${error.code}]`, error);
    } else if (error) {
      console.error('Error:', error);
    }

    // Use provided toast function or default
    if (typeof toastFn === 'function') {
      toastFn(message, 'error');
    } else if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
    } else {
      // Fallback alert
      alert(message);
    }

    return message;
  }

  /**
   * Handle form submission errors
   * @param {Error} error - The error object
   * @param {string} context - Context of the error (e.g., 'upload', 'save', 'delete')
   * @param {Function} toastFn - Toast function
   */
  static handleFormError(error, context = 'form', toastFn = null) {
    const contextMessages = {
      'upload': 'Failed to upload. Please try again.',
      'save': 'Failed to save changes. Please try again.',
      'delete': 'Failed to delete. Please try again.',
      'login': 'Login failed. Please check your credentials and try again.',
      'signup': 'Sign up failed. Please check your information and try again.',
      'comment': 'Failed to post comment. Please try again.',
      'like': 'Failed to like. Please try again.',
      'shadow': 'Failed to shadow. Please try again.',
      'image': 'Failed to upload image. Please try again with a different file.',
      'profile': 'Failed to update profile. Please try again.',
      'badge': 'Failed to update badge. Please try again.'
    };

    const fallback = contextMessages[context] || 'Something went wrong. Please try again.';
    return this.show(error, fallback, toastFn);
  }
}

// Make it available globally
window.ErrorHandler = ErrorHandler;

/**
 * Global showToast function that uses ErrorHandler
 * @param {string} message - The message to show
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification-custom');
  if (existingToast) {
    existingToast.remove();
  }

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

  const toast = document.createElement('div');
  toast.className = 'toast-notification-custom';
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: #1f2937;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    border-left: 4px solid ${colors[type] || colors.info};
  `;
  document.body.appendChild(toast);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 4000);
}

// Make showToast global
window.showToast = showToast;

// Add animation keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);
