/**
 * NSFW Moderation System
 * Auto-detects and handles untagged NSFW content
 */

class NSFWModeration {
  constructor() {
    this.warningThreshold = 2; // Delete after 2 warnings
    this.init();
  }

  init() {
    // Check for NSFW content without tags
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        await this.checkUntaggedNSFW(user.uid);
      }
    });
  }

  /**
   * Check if a user has untagged NSFW content
   * @param {string} userId - User ID to check
   */
  async checkUntaggedNSFW(userId) {
    try {
      const snapshot = await firebase.firestore()
        .collection('artworks')
        .where('artistId', '==', userId)
        .where('status', '==', 'published')
        .get();

      const untaggedNSFW = [];

      for (const doc of snapshot.docs) {
        const artwork = doc.data();
        // Check if artwork has NSFW content but isn't tagged
        // This would need AI moderation or user reporting in production
        // For now, we check if it was reported
        if (artwork.nsfwReported && !artwork.isNSFW) {
          untaggedNSFW.push({ id: doc.id, ...artwork });
        }
      }

      if (untaggedNSFW.length > 0) {
        await this.handleUntaggedContent(userId, untaggedNSFW);
      }

    } catch (error) {
      console.error('Error checking untagged NSFW:', error);
    }
  }

  /**
   * Handle untagged NSFW content with warning system
   * @param {string} userId - User ID
   * @param {Array} untaggedItems - Array of untagged NSFW items
   */
  async handleUntaggedContent(userId, untaggedItems) {
    const userRef = firebase.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const currentWarnings = userData.nsfwWarnings || 0;
    const newWarnings = currentWarnings + untaggedItems.length;

    // Send warning notification
    await this.sendWarningNotification(userId, untaggedItems.length, newWarnings);

    // Update user warnings
    await userRef.update({
      nsfwWarnings: newWarnings,
      nsfwLastWarning: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Check if threshold exceeded
    if (newWarnings >= this.warningThreshold) {
      await this.deleteUntaggedContent(userId, untaggedItems);
    } else {
      // Flag items for review
      await this.flagForReview(userId, untaggedItems);
    }
  }

  /**
   * Send warning notification to user
   */
  async sendWarningNotification(userId, count, totalWarnings) {
    const remaining = this.warningThreshold - totalWarnings;

    let message = `⚠️ ${count} of your artworks have been flagged for untagged mature content.`;
    if (remaining > 0) {
      message += ` You have ${remaining} warning${remaining === 1 ? '' : 's'} before content is removed.`;
    } else {
      message += ` Your untagged mature content has been removed. Please review our community guidelines.`;
    }

    // Create notification
    if (authManager) {
      await authManager.createNotification(userId, 'warning', {
        message: message,
        type: 'nsfw_warning',
        count: count,
        totalWarnings: totalWarnings
      });
    }
  }

  /**
   * Flag items for review (first offense)
   */
  async flagForReview(userId, untaggedItems) {
    const batch = firebase.firestore().batch();

    untaggedItems.forEach(item => {
      const ref = firebase.firestore().collection('artworks').doc(item.id);
      batch.update(ref, {
        nsfwStatus: 'flagged',
        nsfwFlaggedAt: firebase.firestore.FieldValue.serverTimestamp(),
        nsfwWarningCount: 1
      });
    });

    await batch.commit();
    console.log(`📋 Flagged ${untaggedItems.length} items for review`);
  }

  /**
   * Delete untagged NSFW content (second offense)
   */
  async deleteUntaggedContent(userId, untaggedItems) {
    const batch = firebase.firestore().batch();

    untaggedItems.forEach(item => {
      const ref = firebase.firestore().collection('artworks').doc(item.id);
      batch.update(ref, {
        status: 'deleted',
        deletedReason: 'Untagged NSFW content - multiple warnings',
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    // Notify user of deletion
    if (authManager) {
      await authManager.createNotification(userId, 'warning', {
        message: '🚫 Your untagged mature content has been removed after multiple warnings. Please review our community guidelines.',
        type: 'nsfw_deletion'
      });
    }

    console.log(`🗑️ Deleted ${untaggedItems.length} untagged NSFW items for user ${userId}`);
  }

  /**
   * Report NSFW content (user reporting)
   * @param {string} artworkId - Artwork ID to report
   * @param {string} userId - Reporting user ID
   * @param {string} reason - Reason for reporting
   */
  async reportNSFWContent(artworkId, userId, reason) {
    try {
      const artworkRef = firebase.firestore().collection('artworks').doc(artworkId);
      const artwork = await artworkRef.get();

      if (!artwork.exists) {
        throw new Error('Artwork not found');
      }

      const data = artwork.data();
      const reportCount = (data.nsfwReports || 0) + 1;

      // Add report to the artwork
      await artworkRef.update({
        nsfwReports: reportCount,
        nsfwReported: true,
        nsfwReportReason: reason,
        nsfwReportedAt: firebase.firestore.FieldValue.serverTimestamp(),
        [`nsfwReports_${userId}`]: {
          reason: reason,
          reportedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      });

      // If more than 3 reports, flag for review
      if (reportCount >= 3) {
        await artworkRef.update({
          nsfwStatus: 'flagged',
          nsfwFlaggedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Notify admin/moderator (for now, just log)
        console.log(`🚨 Artwork ${artworkId} flagged for review after ${reportCount} reports`);

        // Check if artist has previous warnings
        const artistId = data.artistId;
        const userRef = firebase.firestore().collection('users').doc(artistId);
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};
        const warnings = (userData.nsfwWarnings || 0) + 1;

        await userRef.update({
          nsfwWarnings: warnings,
          nsfwLastReport: firebase.firestore.FieldValue.serverTimestamp()
        });

        // If warnings exceed threshold, trigger auto-delete
        if (warnings >= this.warningThreshold) {
          await this.deleteUntaggedContent(artistId, [{ id: artworkId, ...data }]);
        }
      }

      // Notify the reporting user
      await authManager.createNotification(userId, 'info', {
        message: 'Thank you for reporting this content. Our moderation team will review it.',
        type: 'report_acknowledged'
      });

      return { success: true, message: 'Content reported successfully' };

    } catch (error) {
      console.error('Error reporting NSFW content:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if user is logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      window.nsfwModeration = new NSFWModeration();
    }
  });
});

// Make report function globally available
window.reportNSFWContent = async function(artworkId, reason) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please login to report content');
    return;
  }

  if (!window.nsfwModeration) {
    console.error('NSFW Moderation not initialized');
    return;
  }

  return await window.nsfwModeration.reportNSFWContent(artworkId, user.uid, reason);
};
