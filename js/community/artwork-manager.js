// js/community/artwork-manager.js
class ArtworkManager {
    async submitArtwork(challengeId, artworkData) {
        // Handle image uploads and store in Firestore
    }

    async getUserArtwork(userId) {
        // Get user's submitted artwork
    }

    async getChallengeSubmissions(challengeId) {
        // Get all submissions for a challenge
    }
}

// Artwork Manager - Handles uploads and artwork data
class ArtworkManager {
    constructor() {
        this.storage = firebase.storage();
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUpload = null;
    }

    // Upload artwork to Firebase Storage and Firestore
    async uploadArtwork(artworkData) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to upload artwork');
            }

            const { file, title, description, category, software, tags, challenge, isNSFW, nsfwCategory } = artworkData;

            // Validate required fields
            if (!file || !title) {
                throw new Error('Please provide both artwork file and title');
            }

            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                throw new Error('Please upload an image file (PNG, JPG, WebP)');
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB
                throw new Error('File size must be less than 10MB');
            }

            // If NSFW is checked, validate user is 18+
            if (isNSFW) {
                const isAdult = await this.checkUserAdult(user.uid);
                if (!isAdult) {
                    throw new Error('You must be 18+ to upload mature content. Please verify your age in your profile.');
                }
                if (!nsfwCategory) {
                    throw new Error('Please select an NSFW category');
                }
            }

            // Create unique filename
            const fileExtension = file.name.split('.').pop();
            const fileName = `artworks/${user.uid}/${Date.now()}.${fileExtension}`;

            // Upload to Firebase Storage
            const storageRef = this.storage.ref(fileName);
            const uploadTask = storageRef.put(file);

            // Return upload task for progress tracking
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Progress tracking can be handled here
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload progress: ${progress}%`);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        reject(new Error('Upload failed. Please try again.'));
                    },
                    async () => {
                        try {
                            // Get download URL
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                            // Create artwork document in Firestore
                            const artworkDoc = {
                                title: title,
                                description: description || '',
                                imageUrl: downloadURL,
                                category: category || '',
                                software: software || '',
                                tags: tags || [],
                                challenge: challenge || null,
                                artistId: user.uid,
                                artistName: user.displayName || user.email.split('@')[0],
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                likes: 0,
                                comments: 0,
                                views: 0,
                                status: 'published',
                                // NSFW Fields
                                isNSFW: isNSFW || false,
                                nsfwCategory: isNSFW ? nsfwCategory : null,
                                nsfwReported: false,
                                nsfwWarnings: 0,
                                nsfwVerified: isNSFW ? false : true // Mark as needing verification if NSFW
                            };

                            const docRef = await this.db.collection('artworks').add(artworkDoc);

                            // Update user's artwork count
                            await this.updateUserArtworkCount(user.uid);

                            // If submitted to challenge, update challenge submissions
                            if (challenge) {
                                await this.updateChallengeSubmissions(challenge, docRef.id);
                            }

                            // If NSFW, notify moderators for review
                            if (isNSFW) {
                                await this.notifyModerators(docRef.id, artworkDoc);
                            }

                            console.log('Artwork uploaded successfully:', docRef.id);
                            resolve({
                                success: true,
                                artworkId: docRef.id,
                                artwork: artworkDoc,
                                isNSFW: isNSFW
                            });
                        } catch (error) {
                            console.error('Error saving artwork data:', error);
                            reject(new Error('Failed to save artwork details.'));
                        }
                    }
                );
            });

        } catch (error) {
            console.error('Upload artwork error:', error);
            throw error;
        }
    }

    // Check if user is 18+
    async checkUserAdult(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                return data.isAdult === true;
            }
            return false;
        } catch (error) {
            console.error('Error checking user age:', error);
            return false;
        }
    }

    // Notify moderators about NSFW upload
    async notifyModerators(artworkId, artwork) {
        try {
            // Get admin users
            const adminsSnapshot = await this.db
                .collection('users')
                .where('role', 'in', ['admin', 'moderator'])
                .get();

            const notifications = [];
            adminsSnapshot.forEach(doc => {
                notifications.push({
                    userId: doc.id,
                    type: 'nsfw_upload',
                    title: 'New NSFW Artwork',
                    message: `New NSFW artwork uploaded: "${artwork.title}" by ${artwork.artistName}`,
                    artworkId: artworkId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false,
                    priority: 'high'
                });
            });

            // Send notifications in batch
            if (notifications.length > 0) {
                const batch = this.db.batch();
                notifications.forEach(notification => {
                    const ref = this.db.collection('notifications').doc();
                    batch.set(ref, notification);
                });
                await batch.commit();
                console.log(`Notified ${notifications.length} moderators about NSFW upload`);
            }
        } catch (error) {
            console.error('Error notifying moderators:', error);
            // Non-critical, don't fail the upload
        }
    }

    // Update user's artwork count
    async updateUserArtworkCount(userId, increment = 1) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            await userRef.update({
                'stats.artworks': firebase.firestore.FieldValue.increment(increment)
            });
        } catch (error) {
            console.error('Error updating user artwork count:', error);
        }
    }

    // Update challenge submissions
    async updateChallengeSubmissions(challengeId, artworkId) {
        try {
            const challengeRef = this.db.collection('challenges').doc(challengeId);
            await challengeRef.update({
                submissions: firebase.firestore.FieldValue.arrayUnion(artworkId),
                'stats.submissionCount': firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error updating challenge submissions:', error);
        }
    }

    // Get user's artworks (with NSFW filtering)
    async getUserArtworks(userId, currentUserId = null, limit = 20) {
        try {
            // Check if viewer is adult
            let isAdult = false;
            if (currentUserId) {
                const userDoc = await this.db.collection('users').doc(currentUserId).get();
                if (userDoc.exists) {
                    isAdult = userDoc.data().isAdult || false;
                }
            }

            let query = this.db
                .collection('artworks')
                .where('artistId', '==', userId)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit);

            const snapshot = await query.get();

            const artworks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter NSFW content for non-adult users
            if (!isAdult) {
                return artworks.filter(art => !art.isNSFW);
            }

            return artworks;
        } catch (error) {
            console.error('Error getting user artworks:', error);
            throw error;
        }
    }

    // Get artworks for a specific challenge (with NSFW filtering)
    async getChallengeArtworks(challengeId, currentUserId = null, limit = 50) {
        try {
            // Check if viewer is adult
            let isAdult = false;
            if (currentUserId) {
                const userDoc = await this.db.collection('users').doc(currentUserId).get();
                if (userDoc.exists) {
                    isAdult = userDoc.data().isAdult || false;
                }
            }

            let query = this.db
                .collection('artworks')
                .where('challenge', '==', challengeId)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit);

            const snapshot = await query.get();

            const artworks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter NSFW content for non-adult users
            if (!isAdult) {
                return artworks.filter(art => !art.isNSFW);
            }

            return artworks;
        } catch (error) {
            console.error('Error getting challenge artworks:', error);
            throw error;
        }
    }

    // Get recent artworks from community (with NSFW filtering)
    async getRecentArtworks(currentUserId = null, limit = 20) {
        try {
            // Check if viewer is adult
            let isAdult = false;
            if (currentUserId) {
                const userDoc = await this.db.collection('users').doc(currentUserId).get();
                if (userDoc.exists) {
                    isAdult = userDoc.data().isAdult || false;
                }
            }

            let query = this.db
                .collection('artworks')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit);

            const snapshot = await query.get();

            const artworks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter NSFW content for non-adult users
            if (!isAdult) {
                return artworks.filter(art => !art.isNSFW);
            }

            return artworks;
        } catch (error) {
            console.error('Error getting recent artworks:', error);
            throw error;
        }
    }

    // Get single artwork by ID (with NSFW check)
    async getArtwork(artworkId, currentUserId = null) {
        try {
            const doc = await this.db.collection('artworks').doc(artworkId).get();

            if (!doc.exists) {
                throw new Error('Artwork not found');
            }

            const artwork = { id: doc.id, ...doc.data() };

            // Check if artwork is NSFW and user can view it
            if (artwork.isNSFW && currentUserId) {
                const userDoc = await this.db.collection('users').doc(currentUserId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const isAdult = userData.isAdult || false;

                    if (!isAdult) {
                        throw new Error('This artwork contains mature content and requires age verification');
                    }
                } else {
                    throw new Error('Please login to view this content');
                }
            }

            // Increment view count
            await doc.ref.update({
                views: firebase.firestore.FieldValue.increment(1)
            });

            return artwork;
        } catch (error) {
            console.error('Error getting artwork:', error);
            throw error;
        }
    }

    // Like an artwork
    async likeArtwork(artworkId, userId) {
        try {
            const artworkRef = this.db.collection('artworks').doc(artworkId);
            const likeRef = this.db.collection('likes').doc(`${artworkId}_${userId}`);

            // Check if already liked
            const likeDoc = await likeRef.get();

            if (likeDoc.exists) {
                // Unlike
                await likeRef.delete();
                await artworkRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
                return { liked: false };
            } else {
                // Like
                await likeRef.set({
                    artworkId: artworkId,
                    userId: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await artworkRef.update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
                return { liked: true };
            }
        } catch (error) {
            console.error('Error liking artwork:', error);
            throw error;
        }
    }

    // Check if user liked an artwork
    async checkUserLike(artworkId, userId) {
        try {
            const likeRef = this.db.collection('likes').doc(`${artworkId}_${userId}`);
            const likeDoc = await likeRef.get();
            return likeDoc.exists;
        } catch (error) {
            console.error('Error checking user like:', error);
            return false;
        }
    }

    // Add comment to artwork
    async addComment(artworkId, userId, comment) {
        try {
            const commentRef = this.db.collection('comments').doc();
            await commentRef.set({
                artworkId: artworkId,
                userId: userId,
                comment: comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update artwork comment count
            const artworkRef = this.db.collection('artworks').doc(artworkId);
            await artworkRef.update({
                comments: firebase.firestore.FieldValue.increment(1)
            });

            return { success: true, commentId: commentRef.id };
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    // Get comments for artwork
    async getArtworkComments(artworkId, limit = 50) {
        try {
            const snapshot = await this.db
                .collection('comments')
                .where('artworkId', '==', artworkId)
                .orderBy('createdAt', 'asc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting comments:', error);
            throw error;
        }
    }

    // Delete artwork (only by owner)
    async deleteArtwork(artworkId, userId) {
        try {
            const artworkRef = this.db.collection('artworks').doc(artworkId);
            const artworkDoc = await artworkRef.get();

            if (!artworkDoc.exists) {
                throw new Error('Artwork not found');
            }

            const artwork = artworkDoc.data();

            if (artwork.artistId !== userId) {
                throw new Error('You can only delete your own artwork');
            }

            // Delete from storage
            if (artwork.imageUrl) {
                const storageRef = this.storage.refFromURL(artwork.imageUrl);
                await storageRef.delete();
            }

            // Delete from Firestore
            await artworkRef.delete();

            // Update user artwork count
            await this.updateUserArtworkCount(userId, -1);

            // If it was NSFW, remove from moderation queue
            if (artwork.isNSFW) {
                await this.removeFromModerationQueue(artworkId);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting artwork:', error);
            throw error;
        }
    }

    // Remove artwork from moderation queue
    async removeFromModerationQueue(artworkId) {
        try {
            const queueRef = this.db.collection('moderationQueue');
            const snapshot = await queueRef
                .where('artworkId', '==', artworkId)
                .get();

            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('Error removing from moderation queue:', error);
        }
    }

    // Update user artwork count (helper method) - Fixed duplicate
    async updateUserArtworkCount(userId, increment = 1) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            await userRef.update({
                'stats.artworks': firebase.firestore.FieldValue.increment(increment)
            });
        } catch (error) {
            console.error('Error updating user artwork count:', error);
        }
    }

    // Get NSFW artworks (moderator only)
    async getNSFWArtworks(limit = 50) {
        try {
            const snapshot = await this.db
                .collection('artworks')
                .where('isNSFW', '==', true)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting NSFW artworks:', error);
            throw error;
        }
    }

    // Moderate NSFW artwork (approve/reject)
    async moderateNSFWArtwork(artworkId, action, moderatorId) {
        try {
            const artworkRef = this.db.collection('artworks').doc(artworkId);
            const artworkDoc = await artworkRef.get();

            if (!artworkDoc.exists) {
                throw new Error('Artwork not found');
            }

            const updates = {
                'nsfwModeratedAt': firebase.firestore.FieldValue.serverTimestamp(),
                'nsfwModeratorId': moderatorId
            };

            if (action === 'approve') {
                updates.nsfwVerified = true;
                updates.nsfwStatus = 'approved';
            } else if (action === 'reject') {
                updates.status = 'rejected';
                updates.nsfwStatus = 'rejected';
                updates.nsfwRejectReason = 'Content violates NSFW guidelines';
            } else if (action === 'flag') {
                updates.nsfwReported = true;
                updates.nsfwWarnings = firebase.firestore.FieldValue.increment(1);
                updates.nsfwStatus = 'flagged';
            }

            await artworkRef.update(updates);

            // Notify artist
            const artwork = artworkDoc.data();
            await this.notifyArtist(artwork.artistId, action, artwork.title);

            return { success: true, action: action };
        } catch (error) {
            console.error('Error moderating NSFW artwork:', error);
            throw error;
        }
    }

    // Notify artist about moderation action
    async notifyArtist(artistId, action, artworkTitle) {
        try {
            let message = '';
            let type = '';

            if (action === 'approve') {
                message = `✅ Your artwork "${artworkTitle}" has been approved for the NSFW gallery.`;
                type = 'nsfw_approved';
            } else if (action === 'reject') {
                message = `❌ Your artwork "${artworkTitle}" was rejected from the NSFW gallery. Please review our guidelines.`;
                type = 'nsfw_rejected';
            } else if (action === 'flag') {
                message = `⚠️ Your artwork "${artworkTitle}" has been flagged for review. Please ensure content follows guidelines.`;
                type = 'nsfw_flagged';
            }

            const notification = {
                userId: artistId,
                type: type,
                message: message,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: false,
                priority: 'high'
            };

            await this.db.collection('notifications').add(notification);
        } catch (error) {
            console.error('Error notifying artist:', error);
        }
    }
}

// Create global instance
const artworkManager = new ArtworkManager();
