// /api/verification-callback.js
// For Netlify Functions or Vercel Serverless

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // You'll need to add your service account JSON to environment variables
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the webhook payload from Sumsub
    const payload = JSON.parse(event.body);
    console.log('Received webhook:', payload);

    // Extract verification data
    const { userId, status, reviewResult, applicantId } = payload;

    // Sumsub statuses: 'approved', 'declined', 'pending'
    if (status === 'approved' && reviewResult === 'APPROVED') {
      // User is verified!
      await handleVerificationSuccess(userId, applicantId, payload);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Verification approved' })
      };
    }
    else if (status === 'declined' || reviewResult === 'DECLINED') {
      // User failed verification
      await handleVerificationFailure(userId, payload);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Verification declined' })
      };
    }
    else {
      // Pending or other status
      await handleVerificationPending(userId, payload);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Verification pending' })
      };
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Handle successful verification
 */
async function handleVerificationSuccess(userId, applicantId, payload) {
  try {
    // Update user document
    await db.collection('users').doc(userId).update({
      isAdult: true,
      ageVerified: true,
      ageVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationMethod: 'sumsub',
      verificationId: applicantId,
      verificationData: {
        status: 'approved',
        completedAt: new Date().toISOString(),
        applicantId: applicantId
      },
      nsfwPreferences: {
        enabled: true,
        showBlurred: false
      },
      nsfwContent: {
        canView: true,
        canCreate: true
      }
    });

    // Store verification record
    await db.collection('users').doc(userId).collection('verification').add({
      status: 'approved',
      applicantId: applicantId,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: payload,
      method: 'sumsub'
    });

    // Remove pending verification token
    const pendingSnapshot = await db.collection('users')
      .doc(userId)
      .collection('verification')
      .where('status', '==', 'pending')
      .get();

    const batch = db.batch();
    pendingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`✅ User ${userId} verified successfully!`);

    // Send notification to user
    await createNotification(userId, 'verification_completed', {
      message: '✅ Your age verification was approved! You now have access to mature content.'
    });

  } catch (error) {
    console.error('Error handling verification success:', error);
    throw error;
  }
}

/**
 * Handle verification failure
 */
async function handleVerificationFailure(userId, payload) {
  try {
    // Store failed attempt
    await db.collection('users').doc(userId).collection('verification').add({
      status: 'declined',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: payload,
      method: 'sumsub'
    });

    // Increment failed attempts
    await db.collection('users').doc(userId).update({
      verificationAttempts: admin.firestore.FieldValue.increment(1),
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to user
    await createNotification(userId, 'verification_failed', {
      message: '❌ Age verification failed. Please try again with a valid ID.'
    });

    console.log(`❌ User ${userId} verification failed`);

  } catch (error) {
    console.error('Error handling verification failure:', error);
    throw error;
  }
}

/**
 * Handle pending verification
 */
async function handleVerificationPending(userId, payload) {
  try {
    // Update pending status
    await db.collection('users').doc(userId).update({
      verificationStatus: 'pending',
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`⏳ User ${userId} verification pending`);

  } catch (error) {
    console.error('Error handling pending verification:', error);
    throw error;
  }
}

/**
 * Create notification for user
 */
async function createNotification(userId, type, data) {
  try {
    await db.collection('users').doc(userId).collection('notifications').add({
      type: type,
      data: data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update unread count
    const unreadSnapshot = await db.collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false)
      .get();

    await db.collection('users').doc(userId).update({
      unreadNotifications: unreadSnapshot.size
    });

  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
