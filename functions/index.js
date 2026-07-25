const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');

admin.initializeApp();

// Content Moderation using Google Cloud Natural Language API
exports.moderateComment = functions.firestore
  .document('artworks/{artworkId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const commentId = context.params.commentId;
    const artworkId = context.params.artworkId;

    // Skip if already marked as spam or deleted
    if (comment.status === 'spam' || comment.status === 'deleted') {
      return;
    }

    try {
      // Check for spam links
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      if (urlPattern.test(comment.text)) {
        await snap.ref.update({
          status: 'spam',
          moderationFlag: 'Contains link'
        });
        console.log(`Comment ${commentId} flagged as spam (contains link)`);
        return;
      }

      // Check for excessive caps (spam indicator)
      const capsCount = (comment.text.match(/[A-Z]/g) || []).length;
      const capsPercentage = capsCount / comment.text.length;
      if (capsPercentage > 0.7 && comment.text.length > 20) {
        await snap.ref.update({
          status: 'flagged',
          moderationFlag: 'Excessive capitalization'
        });
        console.log(`Comment ${commentId} flagged for excessive caps`);
        return;
      }

      // Optional: Use Google Cloud Natural Language API
      // Requires enabling the API and setting up credentials
      /*
      const auth = new GoogleAuth({
        keyFilename: 'path/to/service-account-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-language'],
      });

      const client = await auth.getClient();
      const response = await client.request({
        url: 'https://language.googleapis.com/v1/documents:analyzeSentiment',
        method: 'POST',
        data: {
          document: {
            content: comment.text,
            type: 'PLAIN_TEXT',
          },
        },
      });

      const score = response.data.documentSentiment.score;
      if (score < -0.5) {
        await snap.ref.update({
          status: 'flagged',
          moderationFlag: 'Negative sentiment detected'
        });
      }
      */

    } catch (error) {
      console.error('Error moderating comment:', error);
    }
  });

// Delete spam comments older than 7 days (cleanup)
exports.cleanupSpamComments = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const snapshot = await admin.firestore()
      .collectionGroup('comments')
      .where('status', '==', 'spam')
      .where('createdAt', '<', sevenDaysAgo)
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} spam comments`);
  });
