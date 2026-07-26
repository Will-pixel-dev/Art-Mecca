// /js/community/challenge-voting.js

class ChallengeVoting {
  constructor() {
    this.db = firebase.firestore();
    this.currentUser = null;
    this.init();
  }

  async init() {
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  // Vote on a challenge submission
  async vote(submissionId, voteType) {
    if (!this.currentUser) {
      window.location.href = "pages/auth/login.html";
      return { success: false, error: "Please login to vote" };
    }

    try {
      const submissionRef = this.db
        .collection("challengeSubmissions")
        .doc(submissionId);

      // Check if user already voted
      const voteQuery = await this.db
        .collection("votes")
        .where("submissionId", "==", submissionId)
        .where("userId", "==", this.currentUser.uid)
        .get();

      if (!voteQuery.empty) {
        const existing = voteQuery.docs[0];
        const oldVote = existing.data().voteType;

        if (oldVote === voteType) {
          // Remove vote (toggle off)
          await existing.ref.delete();
          await submissionRef.update({
            votes: firebase.firestore.FieldValue.increment(
              voteType === "up" ? -1 : -1,
            ),
          });
          return { success: true, action: "removed" };
        } else {
          // Change vote
          await existing.ref.update({ voteType });
          await submissionRef.update({
            votes: firebase.firestore.FieldValue.increment(
              voteType === "up" ? 2 : -2,
            ),
          });
          return { success: true, action: "changed" };
        }
      } else {
        // New vote
        await this.db.collection("votes").add({
          submissionId,
          userId: this.currentUser.uid,
          voteType,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await submissionRef.update({
          votes: firebase.firestore.FieldValue.increment(
            voteType === "up" ? 1 : -1,
          ),
        });
        return { success: true, action: "added" };
      }
    } catch (error) {
      console.error("Error voting:", error);
      return { success: false, error: error.message };
    }
  }

  // Get submissions for a challenge
  async getChallengeSubmissions(challengeId) {
    try {
      const snapshot = await this.db
        .collection("challengeSubmissions")
        .where("challengeId", "==", challengeId)
        .orderBy("votes", "desc")
        .get();

      const submissions = [];
      snapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
      });
      return submissions;
    } catch (error) {
      console.error("Error getting submissions:", error);
      return [];
    }
  }

  // Get user's vote on a submission
  async getUserVote(submissionId) {
    if (!this.currentUser) return null;

    try {
      const snapshot = await this.db
        .collection("votes")
        .where("submissionId", "==", submissionId)
        .where("userId", "==", this.currentUser.uid)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data().voteType;
    } catch (error) {
      console.error("Error getting user vote:", error);
      return null;
    }
  }

  // Get all challenge winners
  async getChallengeWinners(limit = 20) {
    try {
      const snapshot = await this.db
        .collection("challengeWinners")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const winners = [];
      snapshot.forEach((doc) => {
        winners.push({ id: doc.id, ...doc.data() });
      });
      return winners;
    } catch (error) {
      console.error("Error getting winners:", error);
      return [];
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.challengeVoting = new ChallengeVoting();
});
