/**
 * Age Verification for Existing Users
 * Allows users to verify they are 18+ for NSFW content
 */

class AgeVerification {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.init();
  }

  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserData();
        this.checkAgeVerification();
      }
    });
  }

  async loadUserData() {
    try {
      const doc = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .get();

      if (doc.exists) {
        this.userData = doc.data();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  checkAgeVerification() {
    // Check if user already has age set
    if (this.userData?.age !== undefined) {
      // User already has age
      return;
    }

    // Show age verification modal
    this.showAgeVerificationModal();
  }

  showAgeVerificationModal() {
    // Check if modal already exists
    if (document.getElementById("ageVerificationModal")) {
      return;
    }

    const modalHTML = `
      <div class="modal-overlay active" id="ageVerificationModal" style="z-index: 10000;">
        <div class="modal-container" style="max-width: 450px; padding: 2rem;">
          <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
            <h3 style="text-align: center; width: 100%;">🔞 Age Verification Required</h3>
          </div>
          <div class="modal-body" style="text-align: center; padding: 1rem 0;">
            <p style="margin-bottom: 1.5rem; color: #6b7280;">
              To access mature content on Art Mecca, please confirm your age.
            </p>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Date of Birth</label>
              <input type="date" id="ageVerifyDob" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 1rem;" />
              <small style="display: block; margin-top: 0.25rem; color: #6b7280;">You must be 18+ to view NSFW content.</small>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
              <button id="ageVerifySubmit" class="btn btn-primary" style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
                Verify Age
              </button>
              <button id="ageVerifySkip" class="btn btn-outline" style="padding: 0.75rem 2rem; background: transparent; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
                Skip
              </button>
            </div>
            <p style="margin-top: 1rem; font-size: 0.8rem; color: #9ca3af;">
              You can verify your age later in settings.
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Set max date (18 years ago)
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    const dobInput = document.getElementById("ageVerifyDob");
    if (dobInput) {
      dobInput.max = maxDate.toISOString().split("T")[0];
    }

    // Submit handler
    document
      .getElementById("ageVerifySubmit")
      .addEventListener("click", async () => {
        await this.submitAgeVerification();
      });

    // Skip handler
    document.getElementById("ageVerifySkip").addEventListener("click", () => {
      this.skipAgeVerification();
    });
  }

  async submitAgeVerification() {
    const dobInput = document.getElementById("ageVerifyDob");
    const dateOfBirth = dobInput?.value;

    if (!dateOfBirth) {
      alert("Please enter your date of birth.");
      return;
    }

    // Calculate age
    const birthDate = new Date(dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const monthDiff = new Date().getMonth() - birthDate.getMonth();
    const finalAge =
      monthDiff < 0 ||
      (monthDiff === 0 && new Date().getDate() < birthDate.getDate())
        ? age - 1
        : age;

    if (finalAge < 13) {
      alert("You must be at least 13 years old to use Art Mecca.");
      return;
    }

    const isAdult = finalAge >= 18;

    try {
      // Update user document with age
      await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .update({
          dateOfBirth: dateOfBirth,
          age: finalAge,
          isAdult: isAdult,
          nsfwContent: {
            canView: isAdult,
            canCreate: isAdult,
          },
          nsfwPreferences: {
            enabled: isAdult,
            showBlurred: true,
          },
        });

      // Remove modal
      const modal = document.getElementById("ageVerificationModal");
      if (modal) modal.remove();

      // Reload user data
      await this.loadUserData();

      // Show success message
      if (isAdult) {
        alert("✅ Age verified! You now have access to mature content.");
        // Reload page to show NSFW content
        window.location.reload();
      } else {
        alert("You are under 18. NSFW content will be hidden.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error saving age:", error);
      alert("Error saving age. Please try again.");
    }
  }

  skipAgeVerification() {
    const modal = document.getElementById("ageVerificationModal");
    if (modal) modal.remove();

    // Set a flag so we don't show again immediately
    sessionStorage.setItem("age_verification_skipped", "true");

    // Show toast message
    this.showToast("You can verify your age later in settings.");
  }

  showToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10001;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Static method to trigger age verification from any page
  static triggerVerification() {
    // Check if already verified
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().age !== undefined) {
          alert("✅ You are already verified. Age: " + doc.data().age);
          return;
        }
        // Show verification modal
        new AgeVerification();
      });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in and not already verified
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Check if verification was skipped in this session
      const skipped = sessionStorage.getItem("age_verification_skipped");
      if (skipped === "true") {
        // Don't show again this session
        return;
      }

      // Check if user already has age set
      firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists && doc.data().age === undefined) {
            // User doesn't have age set, show verification
            setTimeout(() => {
              new AgeVerification();
            }, 1000);
          }
        })
        .catch((error) => console.error("Error checking user age:", error));
    }
  });
});

// Make AgeVerification globally available
window.AgeVerification = AgeVerification;
