// ================================================================
// COMMENT SYSTEM — Complete with @ Mentions & Autocomplete
// ================================================================

class CommentSystem {
  constructor(artworkId, currentUser, isOwner, artworkArtistId) {
    this.artworkId = artworkId;
    this.currentUser = currentUser;
    this.isOwner = isOwner;
    this.artworkArtistId = artworkArtistId;
    this.comments = [];
    this.filter = 'newest';
    this.page = 0;
    this.limit = 10;
    this.hasMore = true;
    this.loading = false;
    this.replyTo = null;
    this.editingCommentId = null;
    this.reportingCommentId = null;
    this.lastCommentTime = 0;
    this.commentCooldown = 60000;
    this.userCache = {};
    this.allUsers = [];
    this.activeSuggestionIndex = -1;
    this.suggestionDropdown = null;
    this.toastTimeout = null;

    // Add to constructor
this.commentCooldown = 60000; // 60 seconds between comments
this.lastCommentTime = 0;
this.maxCommentsPerMinute = 5;
this.commentCountThisMinute = 0;
this.minuteResetTimer = null;

    // DOM refs
    this.commentsList = document.getElementById('commentsList');
    this.commentInput = document.getElementById('commentInput');
    this.submitBtn = document.getElementById('submitCommentBtn');
    this.charCount = document.getElementById('charCount');
    this.commentCount = document.getElementById('commentCount');
    this.filterSelect = document.getElementById('commentFilter');
    this.loadMoreBtn = document.getElementById('loadMoreComments');
    this.loadMoreContainer = document.getElementById('commentsLoadMore');
    this.emojiPicker = document.getElementById('emojiPicker');
    this.emojiBtn = document.getElementById('emojiBtn');
    this.mentionBtn = document.getElementById('mentionBtn');

    // Check if required elements exist
    if (!this.commentsList) {
      console.error('Comment system: commentsList not found');
      return;
    }

    if (!this.commentInput || !this.submitBtn) {
      console.error('Comment system: input or submit button not found');
      return;
    }

    // Bad words list
    this.badWords = [
      'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fuck', 'motherfucker',
      'nigger', 'pussy', 'shit', 'slut', 'whore', 'damn', 'hell', 'crap',
      'bullshit', 'fucking', 'shitty', 'ass', 'cock', 'prick', 'twat',
      'wanker', 'fag', 'faggot', 'retard', 'retarded', 'cocksucker'
    ];

    console.log('✅ Comment system initialized');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupInputValidation();
    this.setupMentionAutocomplete();
    this.loadComments();
    this.loadUsersForMentions();
  }

  // ============================================
  // LOAD USERS FOR @ MENTIONS
  // ============================================

  async loadUsersForMentions() {
    try {
      const snapshot = await firebase.firestore()
        .collection('users')
        .get();

      this.allUsers = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.username && !data.displayName && !data.fullname) {
          return;
        }
        this.allUsers.push({
          uid: doc.id,
          username: data.username || data.displayName || data.fullname || 'User',
          displayName: data.displayName || data.fullname || data.username || 'User'
        });
      });

      console.log(`✅ Loaded ${this.allUsers.length} users for @ mentions`);
    } catch (error) {
      console.error('Error loading users for mentions:', error);
    }
  }

  // ============================================
// RATE LIMITING — CLIENT-SIDE
// ============================================

checkRateLimit() {
  const now = Date.now();

  // Reset counter every minute
  if (!this.minuteResetTimer) {
    this.minuteResetTimer = setTimeout(() => {
      this.commentCountThisMinute = 0;
      this.minuteResetTimer = null;
    }, 60000);
  }

  // Check if user has exceeded rate limit
  if (this.commentCountThisMinute >= this.maxCommentsPerMinute) {
    this.showToast(`Please wait a moment before posting more comments (${this.maxCommentsPerMinute} per minute)`, 'warning');
    return false;
  }

  // Check individual cooldown
  if (now - this.lastCommentTime < this.commentCooldown) {
    const waitTime = Math.ceil((this.commentCooldown - (now - this.lastCommentTime)) / 1000);
    this.showToast(`Please wait ${waitTime} seconds before commenting again`, 'warning');
    return false;
  }

  return true;
}

incrementCommentCount() {
  this.commentCountThisMinute++;
  this.lastCommentTime = Date.now();
}

  // ============================================
  // @ MENTION AUTOCOMPLETE
  // ============================================

  setupMentionAutocomplete() {
    let mentionTimeout;

    // Create dropdown for suggestions
    this.suggestionDropdown = document.createElement('div');
    this.suggestionDropdown.id = 'mentionSuggestions';
    this.suggestionDropdown.style.cssText = `
      position: absolute;
      bottom: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--bg-card, rgba(10, 5, 8, 0.95));
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color, rgba(138, 25, 225, 0.15));
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.645);
      max-height: 150px;
      overflow-y: auto;
      z-index: 200;
      display: none;
      padding: 4px 0;
    `;
    this.commentInput.parentNode.appendChild(this.suggestionDropdown);

    // Close dropdown on click outside - FIXED to not interfere with notifications
    document.addEventListener('click', (e) => {
      // Don't close if clicking on notification elements
      if (e.target.closest('.notification-container') ||
          e.target.closest('#notificationDropdown') ||
          e.target.closest('#notificationBtn')) {
        return;
      }

      if (this.suggestionDropdown &&
          !this.suggestionDropdown.contains(e.target) &&
          e.target !== this.commentInput) {
        this.suggestionDropdown.style.display = 'none';
        this.activeSuggestionIndex = -1;
      }
    });

    // Listen for input changes
    this.commentInput.addEventListener('input', (e) => {
      const value = this.commentInput.value;
      const cursorPos = this.commentInput.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);

      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const searchTerm = mentionMatch[1].toLowerCase();

        clearTimeout(mentionTimeout);
        mentionTimeout = setTimeout(() => {
          this.showMentionSuggestions(searchTerm);
        }, 200);
      } else {
        if (this.suggestionDropdown) {
          this.suggestionDropdown.style.display = 'none';
        }
        this.activeSuggestionIndex = -1;
      }
    });

    // Keyboard navigation
    this.commentInput.addEventListener('keydown', (e) => {
      if (!this.suggestionDropdown) return;
      const items = this.suggestionDropdown.querySelectorAll('.mention-suggestion-item');

      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.activeSuggestionIndex = Math.min(this.activeSuggestionIndex + 1, items.length - 1);
        this.updateActiveSuggestion(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.activeSuggestionIndex = Math.max(this.activeSuggestionIndex - 1, -1);
        this.updateActiveSuggestion(items);
      } else if (e.key === 'Enter') {
        if (this.activeSuggestionIndex >= 0 && items[this.activeSuggestionIndex]) {
          e.preventDefault();
          items[this.activeSuggestionIndex].click();
        }
      } else if (e.key === 'Escape') {
        if (this.suggestionDropdown) {
          this.suggestionDropdown.style.display = 'none';
        }
        this.activeSuggestionIndex = -1;
      }
    });
  }

  showMentionSuggestions(searchTerm) {
    if (!searchTerm || searchTerm.length === 0 || this.allUsers.length === 0) {
      if (this.suggestionDropdown) {
        this.suggestionDropdown.style.display = 'none';
      }
      return;
    }

    const suggestions = this.allUsers
      .filter(user => {
        const username = (user.username || '').toLowerCase();
        const displayName = (user.displayName || '').toLowerCase();
        return username.includes(searchTerm) || displayName.includes(searchTerm);
      })
      .slice(0, 5);

    if (suggestions.length === 0) {
      if (this.suggestionDropdown) {
        this.suggestionDropdown.style.display = 'none';
      }
      return;
    }

    if (!this.suggestionDropdown) return;

    this.suggestionDropdown.innerHTML = suggestions.map(user => `
      <div class="mention-suggestion-item" data-uid="${user.uid}" data-username="${user.username}" style="
        padding: 6px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s ease;
        color: var(--text-secondary, #b8a0d0);
        font-size: 0.85rem;
        font-family: var(--font-body, 'Inter', sans-serif);
      ">
        <span style="color: var(--neon-purple, #8a19e1); font-weight: 600;">@</span>
        <span>${this.escapeHtml(user.username)}</span>
        <span style="color: var(--text-muted, #5a3a6a); font-size: 0.7rem;">${this.escapeHtml(user.displayName)}</span>
      </div>
    `).join('');

    this.suggestionDropdown.style.display = 'block';
    this.activeSuggestionIndex = -1;

    // Add click handlers
    this.suggestionDropdown.querySelectorAll('.mention-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const username = item.dataset.username;
        this.insertMention(username);
        if (this.suggestionDropdown) {
          this.suggestionDropdown.style.display = 'none';
        }
      });

      item.addEventListener('mouseenter', () => {
        const allItems = this.suggestionDropdown.querySelectorAll('.mention-suggestion-item');
        const index = Array.from(allItems).indexOf(item);
        this.activeSuggestionIndex = index;
        this.updateActiveSuggestion(allItems);
      });
    });
  }

  updateActiveSuggestion(items) {
    items.forEach((el, i) => {
      if (i === this.activeSuggestionIndex) {
        el.style.background = 'rgba(138, 25, 225, 0.08)';
        el.style.color = 'var(--text-primary, #f5eaff)';
      } else {
        el.style.background = 'transparent';
        el.style.color = 'var(--text-secondary, #b8a0d0)';
      }
    });
  }

  insertMention(username) {
    const input = this.commentInput;
    const value = input.value;
    const cursorPos = input.selectionStart;

    let mentionStart = cursorPos - 1;
    while (mentionStart >= 0 && value[mentionStart] !== '@') {
      mentionStart--;
    }

    if (mentionStart < 0) return;

    const before = value.substring(0, mentionStart);
    const after = value.substring(cursorPos);
    const newValue = before + `@${username} ` + after;

    input.value = newValue;
    input.focus();
    const newCursorPos = before.length + username.length + 2;
    input.setSelectionRange(newCursorPos, newCursorPos);
    input.dispatchEvent(new Event('input'));
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    // Submit comment
    this.submitBtn.addEventListener('click', () => this.submitComment());

    // Enter key (Shift+Enter for new line)
    this.commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitComment();
      }
    });

    // Character count
    this.commentInput.addEventListener('input', () => {
      const length = this.commentInput.value.length;
      if (this.charCount) {
        this.charCount.textContent = length;
      }
      this.submitBtn.disabled = length === 0 || length > 2000;
      if (this.charCount) {
        this.charCount.className = 'char-count' +
          (length > 1800 ? ' warning' : '') +
          (length > 1950 ? ' danger' : '');
      }
    });

    // Filter change
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', () => {
        this.filter = this.filterSelect.value;
        this.page = 0;
        this.hasMore = true;
        this.comments = [];
        this.loadComments();
      });
    }

    // Load more
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadComments());
    }

    // Emoji picker setup
    this.setupEmojiPicker();

    // @ Mention button
    if (this.mentionBtn) {
      this.mentionBtn.addEventListener('click', () => {
        this.commentInput.value += '@';
        this.commentInput.focus();
        setTimeout(() => {
          this.commentInput.dispatchEvent(new Event('input'));
        }, 50);
        this.showToast('Type a username after @ to mention them', 'info');
      });
    }

    // Report modal
    this.setupReportModal();

    // Edit comment modal
    this.setupEditModal();
  }

  // ============================================
  // EMOJI PICKER — FIXED to not interfere with notifications
  // ============================================

  setupEmojiPicker() {
    if (!this.emojiBtn || !this.emojiPicker) {
      console.warn('⚠️ Emoji picker elements not found');
      return;
    }

    console.log('✅ Setting up emoji picker');

    // Toggle emoji picker on button click
    this.emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.emojiPicker.classList.toggle('visible');
      console.log('Emoji picker visible:', this.emojiPicker.classList.contains('visible'));
    });

    // Get all emoji options
    const emojiOptions = this.emojiPicker.querySelectorAll('.emoji-option');

    if (emojiOptions.length === 0) {
      console.warn('⚠️ No emoji options found in the picker');
      return;
    }

    console.log(`✅ Found ${emojiOptions.length} emoji options`);

    // Add click handlers to each emoji
    emojiOptions.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = el.textContent.trim();

        const cursorPos = this.commentInput.selectionStart;
        const text = this.commentInput.value;
        const newText = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);

        this.commentInput.value = newText;
        this.commentInput.focus();

        const newCursorPos = cursorPos + emoji.length;
        this.commentInput.selectionStart = newCursorPos;
        this.commentInput.selectionEnd = newCursorPos;

        this.commentInput.dispatchEvent(new Event('input'));
        this.emojiPicker.classList.remove('visible');
      });
    });

    // Close emoji picker when clicking outside - FIXED to not interfere with notifications
    document.addEventListener('click', (e) => {
      // Don't close if clicking on notification elements
      if (e.target.closest('.notification-container') ||
          e.target.closest('#notificationDropdown') ||
          e.target.closest('#notificationBtn')) {
        return;
      }

      if (this.emojiPicker &&
          this.emojiBtn &&
          !this.emojiPicker.contains(e.target) &&
          !this.emojiBtn.contains(e.target)) {
        this.emojiPicker.classList.remove('visible');
      }
    });

    // Close emoji picker on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.emojiPicker) {
        this.emojiPicker.classList.remove('visible');
      }
    });

    console.log('✅ Emoji picker setup complete');
  }

  setupReportModal() {
    const reportModal = document.getElementById('reportModal');
    if (!reportModal) return;

    const closeReportBtn = document.getElementById('closeReportModal');
    const cancelReportBtn = document.getElementById('cancelReportBtn');

    if (closeReportBtn) closeReportBtn.addEventListener('click', () => this.closeReportModal());
    if (cancelReportBtn) cancelReportBtn.addEventListener('click', () => this.closeReportModal());

    document.querySelectorAll('input[name="reportReason"]').forEach(el => {
      el.addEventListener('change', () => {
        const otherReason = document.getElementById('reportOtherReason');
        if (otherReason) {
          otherReason.style.display = el.value === 'other' ? 'block' : 'none';
        }
      });
    });

    const submitReportBtn = document.getElementById('submitReportBtn');
    if (submitReportBtn) {
      submitReportBtn.addEventListener('click', () => this.submitReport());
    }

    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) {
        this.closeReportModal();
      }
    });
  }

  setupEditModal() {
    const editModal = document.getElementById('editCommentModal');
    if (!editModal) return;

    const closeEditBtn = document.getElementById('closeEditCommentModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (closeEditBtn) closeEditBtn.addEventListener('click', () => this.closeEditModal());
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => this.closeEditModal());

    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', () => this.saveEdit());
    }

    const editInput = document.getElementById('editCommentInput');
    if (editInput) {
      editInput.addEventListener('input', () => {
        const countEl = document.getElementById('editCharCount');
        if (countEl) countEl.textContent = editInput.value.length;
      });
    }

    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        this.closeEditModal();
      }
    });
  }

  // ============================================
  // INPUT VALIDATION
  // ============================================

  setupInputValidation() {
    this.commentInput.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (this.commentInput.value.length + text.length > 2000) {
        e.preventDefault();
        this.showToast('Comment exceeds 2000 character limit', 'error');
      }
    });
  }

  // ============================================
  // LOAD COMMENTS
  // ============================================

  async loadComments() {
    if (this.loading) return;
    this.loading = true;

    try {
      let query = firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .where('status', '==', 'active');

      switch (this.filter) {
        case 'oldest':
          query = query.orderBy('createdAt', 'asc');
          break;
        case 'most-liked':
          query = query.orderBy('likes', 'desc');
          break;
        default:
          query = query.orderBy('createdAt', 'desc');
      }

      query = query.limit(this.limit);

      if (this.page > 0 && this.comments.length > 0) {
        const last = this.comments[this.comments.length - 1];
        if (last) {
          const lastRef = await firebase.firestore()
            .collection('artworks')
            .doc(this.artworkId)
            .collection('comments')
            .doc(last.id)
            .get();
          if (lastRef.exists) {
            query = query.startAfter(lastRef);
          }
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        this.hasMore = false;
        if (this.page === 0) {
          this.renderEmptyState();
        }
        this.loading = false;
        return;
      }

      const newComments = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const comment = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          replies: data.replies || []
        };

        const reportCount = data.reportCount || 0;
        comment.isReported = reportCount >= 3;

        if (comment.userId) {
          try {
            if (this.userCache[comment.userId]) {
              comment.userData = this.userCache[comment.userId];
            } else {
              const userDoc = await firebase.firestore()
                .collection('users')
                .doc(comment.userId)
                .get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                this.userCache[comment.userId] = userData;
                comment.userData = userData;
              }
            }
          } catch (e) {
            console.warn('Error loading user data:', e);
          }
        }

        newComments.push(comment);
      }

      this.comments = this.page === 0 ? newComments : [...this.comments, ...newComments];
      this.hasMore = newComments.length === this.limit;
      this.page++;

      this.renderComments();
      this.updateCommentCount();

      if (this.loadMoreContainer) {
        this.loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';
      }

    } catch (error) {
      console.error('Error loading comments:', error);
      this.showToast('Error loading comments', 'error');
    } finally {
      this.loading = false;
    }
  }

  // ============================================
  // SUBMIT COMMENT
  // ============================================

  async submitComment() {
    if (!this.currentUser) {
      this.showToast('Please login to comment', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    const text = this.commentInput.value.trim();
    if (!text) return;

    if (text.length > 2000) {
      this.showToast('Comment exceeds 2000 character limit', 'error');
      return;
    }

    const now = Date.now();
    if (now - this.lastCommentTime < this.commentCooldown) {
      const waitTime = Math.ceil((this.commentCooldown - (now - this.lastCommentTime)) / 1000);
      this.showToast(`Please wait ${waitTime} seconds before commenting again`, 'error');
      return;
    }

    const filteredText = this.filterProfanity(text);

    let userAvatar = null;
    let userDisplayName = this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'Anonymous';

    try {
      if (this.userCache[this.currentUser.uid]) {
        const cached = this.userCache[this.currentUser.uid];
        userAvatar = cached.profilePicture || cached.photoURL || cached.avatarUrl || null;
        userDisplayName = cached.displayName || cached.fullname || cached.username || userDisplayName;
      } else {
        const userDoc = await firebase.firestore()
          .collection('users')
          .doc(this.currentUser.uid)
          .get();
        if (userDoc.exists) {
          const data = userDoc.data();
          this.userCache[this.currentUser.uid] = data;
          userAvatar = data.profilePicture || data.photoURL || data.avatarUrl || null;
          userDisplayName = data.displayName || data.fullname || data.username || userDisplayName;
        }
      }
    } catch (e) {
      console.warn('Error loading user profile:', e);
    }

    try {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

      const commentData = {
        userId: this.currentUser.uid,
        userName: userDisplayName,
        userAvatar: userAvatar,
        text: filteredText,
        originalText: text !== filteredText ? text : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        reports: [],
        reportCount: 0,
        status: 'active',
        isFiltered: text !== filteredText,
        replyTo: this.replyTo || null
      };

      const docRef = await firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .add(commentData);

      const newComment = {
        id: docRef.id,
        ...commentData,
        createdAt: new Date()
      };

      if (this.filter === 'newest') {
        this.comments.unshift(newComment);
      } else {
        this.comments.push(newComment);
      }

      this.renderComments();
      this.updateCommentCount();

      this.commentInput.value = '';
      if (this.charCount) this.charCount.textContent = '0';
      this.submitBtn.disabled = true;
      this.lastCommentTime = now;
      this.replyTo = null;

      if (text !== filteredText) {
        this.showToast('Your comment was filtered for inappropriate language', 'warning');
      }

      this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
      this.submitBtn.disabled = false;

      // In submitComment method, after checking text and before submitting:

// Check rate limit
if (!this.checkRateLimit()) {
  return;
}
// After the comment is added to Firestore
this.incrementCommentCount();

      // Handle @ mentions
      await this.handleMentions(filteredText);

    } catch (error) {
      console.error('Error posting comment:', error);
      this.showToast('Error posting comment', 'error');
      this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
      this.submitBtn.disabled = false;
    }
  }

  // ============================================
// HANDLE @ MENTIONS — FIXED with proper user name and comment linking
// ============================================

async handleMentions(text) {
  const mentions = text.match(/@(\w+)/g) || [];

  if (mentions.length === 0) return;

  console.log(`🔔 Found ${mentions.length} mentions:`, mentions);

  // Get the current user's display name from Firestore
  let currentUserName = 'Someone';
  let currentUserAvatar = null;

  try {
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(this.currentUser.uid)
      .get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      currentUserName = userData.displayName || userData.fullname || userData.username || this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'Someone';
      currentUserAvatar = userData.profilePicture || userData.photoURL || userData.avatarUrl || null;
    }
  } catch (e) {
    console.warn('Error fetching current user data:', e);
    // Fallback to Firebase auth display name
    currentUserName = this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'Someone';
  }

  // Get artwork title
  let artworkTitle = 'Artwork';
  try {
    const artDoc = await firebase.firestore()
      .collection('artworks')
      .doc(this.artworkId)
      .get();
    if (artDoc.exists) {
      artworkTitle = artDoc.data().title || 'Artwork';
    }
  } catch (e) {
    console.warn('Error fetching artwork title:', e);
  }

  // Process each mention
  for (const mention of mentions) {
    const username = mention.substring(1);
    const mentionedUser = this.allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mentionedUser && mentionedUser.uid !== this.currentUser.uid) {
      try {
        console.log(`🔔 Creating notification for @${username} (${mentionedUser.uid})`);

        // Create the comment link with the comment ID
        // The comment ID is stored in this.lastCommentId or we need to get the latest comment
        let commentId = null;

        // Get the most recent comment from this user on this artwork
        const commentSnapshot = await firebase.firestore()
          .collection('artworks')
          .doc(this.artworkId)
          .collection('comments')
          .where('userId', '==', this.currentUser.uid)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!commentSnapshot.empty) {
          commentId = commentSnapshot.docs[0].id;
        }

        // Create notification
        await firebase.firestore()
          .collection('users')
          .doc(mentionedUser.uid)
          .collection('notifications')
          .add({
            type: 'mention',
            data: {
              fromUserId: this.currentUser.uid,
              fromUserName: currentUserName,
              fromUserAvatar: currentUserAvatar,
              artworkId: this.artworkId,
              artworkTitle: artworkTitle,
              commentId: commentId,
              commentPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
              username: username
            },
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

        // Update unread count
        await firebase.firestore()
          .collection('users')
          .doc(mentionedUser.uid)
          .set({
            unreadNotifications: firebase.firestore.FieldValue.increment(1)
          }, { merge: true });

        console.log(`✅ Notification created for @${username}`);

      } catch (error) {
        console.error(`❌ Error creating notification for @${username}:`, error);
      }
    }
  }
}

  // ============================================
  // REPLY TO COMMENT
  // ============================================

  replyToComment(commentId, userName) {
    if (!this.currentUser) {
      this.showToast('Please login to reply', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    this.replyTo = commentId;
    this.commentInput.focus();
    this.commentInput.value = `@${userName} `;
    this.commentInput.dispatchEvent(new Event('input'));
    this.commentInput.setSelectionRange(this.commentInput.value.length, this.commentInput.value.length);

    document.querySelectorAll('.comment-item').forEach(el => el.classList.remove('highlight'));
    const target = document.querySelector(`.comment-item[data-id="${commentId}"]`);
    if (target) target.classList.add('highlight');

    this.showToast(`Replying to @${userName}`, 'info');
  }

  // ============================================
  // LIKE COMMENT
  // ============================================

  async likeComment(commentId) {
    if (!this.currentUser) {
      this.showToast('Please login to like', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    const comment = this.findComment(commentId);
    if (!comment) return;

    try {
      const likeRef = firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .doc(commentId)
        .collection('likes')
        .doc(this.currentUser.uid);

      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        await likeRef.delete();
        comment.likes--;
      } else {
        await likeRef.set({
          userId: this.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        comment.likes++;
      }

      await firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .doc(commentId)
        .update({ likes: comment.likes });

      this.renderComments();

    } catch (error) {
      console.error('Error liking comment:', error);
      this.showToast('Error processing like', 'error');
    }
  }

  // ============================================
  // DELETE COMMENT
  // ============================================

  async deleteComment(commentId) {
    const comment = this.findComment(commentId);
    if (!comment) return;

    if (!this.currentUser || (comment.userId !== this.currentUser.uid && !this.isOwner)) {
      this.showToast('You are not authorized to delete this comment', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .doc(commentId)
        .update({
          status: 'deleted',
          deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
          deletedBy: this.currentUser.uid
        });

      comment.status = 'deleted';
      comment.text = '[Comment deleted]';
      this.renderComments();
      this.updateCommentCount();
      this.showToast('Comment deleted', 'success');

    } catch (error) {
      console.error('Error deleting comment:', error);
      this.showToast('Error deleting comment', 'error');
    }
  }

  // ============================================
  // EDIT COMMENT
  // ============================================

  openEditModal(commentId) {
    const comment = this.findComment(commentId);
    if (!comment) return;

    if (!this.currentUser || comment.userId !== this.currentUser.uid) {
      this.showToast('You can only edit your own comments', 'error');
      return;
    }

    const editWindow = 5 * 60 * 1000;
    const now = Date.now();
    const commentTime = comment.createdAt instanceof Date ? comment.createdAt.getTime() : new Date(comment.createdAt).getTime();
    if (now - commentTime > editWindow) {
      this.showToast('Comments can only be edited within 5 minutes of posting', 'error');
      return;
    }

    this.editingCommentId = commentId;
    const editInput = document.getElementById('editCommentInput');
    if (editInput) {
      editInput.value = comment.originalText || comment.text;
      const countEl = document.getElementById('editCharCount');
      if (countEl) countEl.textContent = editInput.value.length;
    }
    const modal = document.getElementById('editCommentModal');
    if (modal) modal.classList.add('active');
  }

  async saveEdit() {
    const editInput = document.getElementById('editCommentInput');
    if (!editInput) return;

    const text = editInput.value.trim();
    if (!text) {
      this.showToast('Comment cannot be empty', 'error');
      return;
    }

    const filteredText = this.filterProfanity(text);

    try {
      await firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .doc(this.editingCommentId)
        .update({
          text: filteredText,
          originalText: text !== filteredText ? text : null,
          isFiltered: text !== filteredText,
          editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      const comment = this.findComment(this.editingCommentId);
      if (comment) {
        comment.text = filteredText;
        comment.originalText = text !== filteredText ? text : null;
        comment.isFiltered = text !== filteredText;
        comment.editedAt = new Date();
      }

      this.renderComments();
      this.closeEditModal();
      this.showToast('Comment updated', 'success');

      if (text !== filteredText) {
        this.showToast('Your comment was filtered for inappropriate language', 'warning');
      }

    } catch (error) {
      console.error('Error editing comment:', error);
      this.showToast('Error saving changes', 'error');
    }
  }

  // ============================================
  // REPORT COMMENT
  // ============================================

  openReportModal(commentId) {
    if (!this.currentUser) {
      this.showToast('Please login to report', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    this.reportingCommentId = commentId;
    document.querySelectorAll('input[name="reportReason"]').forEach(el => el.checked = false);
    const otherReason = document.getElementById('reportOtherReason');
    if (otherReason) otherReason.style.display = 'none';
    const details = document.getElementById('reportDetails');
    if (details) details.value = '';
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.add('active');
  }

  async submitReport() {
    const reasonEl = document.querySelector('input[name="reportReason"]:checked');
    if (!reasonEl) {
      this.showToast('Please select a reason', 'error');
      return;
    }

    const reason = reasonEl.value;
    const details = document.getElementById('reportDetails');
    const detailsText = details ? details.value.trim() : '';

    try {
      await firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId)
        .collection('comments')
        .doc(this.reportingCommentId)
        .update({
          reportCount: firebase.firestore.FieldValue.increment(1),
          reports: firebase.firestore.FieldValue.arrayUnion({
            userId: this.currentUser.uid,
            reason: reason,
            details: detailsText,
            reportedAt: firebase.firestore.FieldValue.serverTimestamp()
          })
        });

      const comment = this.findComment(this.reportingCommentId);
      if (comment) {
        comment.reportCount = (comment.reportCount || 0) + 1;
        if (comment.reportCount >= 3) {
          comment.isReported = true;
        }
      }

      this.renderComments();
      this.closeReportModal();
      this.showToast('Report submitted. Our moderators will review it.', 'success');

    } catch (error) {
      console.error('Error submitting report:', error);
      this.showToast('Error submitting report', 'error');
    }
  }

  // ============================================
  // PROFANITY FILTER
  // ============================================

  filterProfanity(text) {
    let filtered = text;
    const words = text.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (this.badWords.includes(cleanWord)) {
        filtered = filtered.replace(new RegExp(word, 'gi'), '***');
      }
    }

    return filtered;
  }

  // ============================================
  // RENDER COMMENTS
  // ============================================

  renderComments() {
    if (!this.commentsList) return;

    const activeComments = this.comments.filter(c => c.status === 'active' || c.status === 'deleted');

    if (activeComments.length === 0 && this.page === 0) {
      this.renderEmptyState();
      return;
    }

    const sorted = [...activeComments];

    switch (this.filter) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'most-liked':
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    const topLevel = sorted.filter(c => !c.replyTo);

    let html = '';
    topLevel.forEach(comment => {
      html += this.renderCommentItem(comment);
      const replies = sorted.filter(c => c.replyTo === comment.id);
      if (replies.length > 0) {
        html += `<div class="replies-container">`;
        replies.forEach(reply => {
          html += this.renderCommentItem(reply, true);
        });
        html += `</div>`;
      }
    });

    this.commentsList.innerHTML = html;
    this.attachCommentEvents();
  }

  renderCommentItem(comment, isReply = false) {
    const userData = comment.userData || {};
    const avatarUrl = userData.profilePicture || userData.photoURL || userData.avatarUrl || null;
    const userName = userData.displayName || userData.fullname || userData.username || comment.userName || 'Anonymous';
    const avatarInitial = userName.charAt(0).toUpperCase();

    const isCommentAuthor = this.currentUser && comment.userId === this.currentUser.uid;
    const isArtworkOwner = this.artworkArtistId && comment.userId === this.artworkArtistId;
    const isDeleted = comment.status === 'deleted';
    const isReported = comment.isReported === true;

    const timeAgo = this.formatTimeAgo(comment.createdAt);
    const editedBadge = comment.editedAt ? `<span class="edited-badge">(edited)</span>` : '';
    const ownerBadge = isArtworkOwner ? `<span class="owner-badge">★ Owner</span>` : '';

    const deletedClass = isDeleted ? 'deleted' : '';
    const reportedClass = isReported ? 'reported' : '';

    const likeCount = comment.likes || 0;

    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="${userName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.textContent='${avatarInitial}'">`
      : avatarInitial;

    let bodyHtml = '';
    if (isDeleted) {
      bodyHtml = `<div class="comment-body"><em>Comment deleted by author</em></div>`;
    } else if (isReported) {
      bodyHtml = `<div class="comment-body"><em>⚠️ This comment has been reported and is pending review</em></div>`;
    } else {
      bodyHtml = `<div class="comment-body">${this.linkifyMentions(this.linkify(comment.text))}</div>`;
    }

    let actionsHtml = '';
    if (!isDeleted && !isReported) {
      actionsHtml = `
        <div class="comment-actions">
          <button class="like-btn" data-id="${comment.id}">
            <i class="fas fa-heart"></i>
            <span class="like-count">${likeCount}</span>
          </button>
          <button class="reply-btn" data-id="${comment.id}" data-name="${userName}">
            <i class="fas fa-reply"></i> Reply
          </button>
          ${isCommentAuthor ? `
            <button class="edit-btn" data-id="${comment.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
          ` : ''}
          ${isCommentAuthor || this.isOwner ? `
            <button class="delete-btn" data-id="${comment.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          ` : ''}
          ${!isCommentAuthor ? `
            <button class="report-btn" data-id="${comment.id}">
              <i class="fas fa-flag"></i> Report
            </button>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="comment-item ${deletedClass} ${reportedClass}" data-id="${comment.id}" data-user-id="${comment.userId || ''}">
        <div class="comment-header">
          <div class="comment-user">
            <div class="comment-avatar-small" data-user-id="${comment.userId || ''}" style="cursor:pointer;overflow:hidden;">${avatarHtml}</div>
            <span class="comment-username" data-user-id="${comment.userId || ''}" style="cursor:pointer;">${this.escapeHtml(userName)} ${ownerBadge}</span>
            <span class="comment-time">${timeAgo} ${editedBadge}</span>
          </div>
        </div>
        ${bodyHtml}
        ${actionsHtml}
      </div>
    `;
  }

  // ============================================
  // LINKIFY MENTIONS
  // ============================================

  linkifyMentions(text) {
    if (!text) return '';
    return text.replace(
      /@(\w+)/g,
      (match, username) => {
        const user = this.allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
          return `<a href="/pages/community/profiles.html?user=${user.uid}" class="comment-mention" style="color: var(--neon-purple, #8a19e1); font-weight: 600; text-decoration: none; transition: color 0.2s ease;" onmouseover="this.style.color='var(--neon-cyan, #58ebfe)'" onmouseout="this.style.color='var(--neon-purple, #8a19e1)'">@${this.escapeHtml(username)}</a>`;
        }
        return match;
      }
    );
  }

  attachCommentEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.likeComment(id);
      });
    });

    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        this.replyToComment(id, name);
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.openEditModal(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.deleteComment(id);
      });
    });

    document.querySelectorAll('.report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.openReportModal(id);
      });
    });

    document.querySelectorAll('.comment-avatar-small, .comment-username').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = el.dataset.userId;
        if (userId) {
          window.location.href = `/pages/community/profiles.html?user=${userId}`;
        }
      });
    });
  }

  // ============================================
  // UTILITY
  // ============================================

  renderEmptyState() {
    if (!this.commentsList) return;
    this.commentsList.innerHTML = `
      <div class="comments-empty">
        <i class="fas fa-comment-slash"></i>
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    `;
  }

  updateCommentCount() {
    if (this.commentCount) {
      const active = this.comments.filter(c => c.status === 'active');
      this.commentCount.textContent = active.length;
    }
  }

  findComment(commentId) {
    return this.comments.find(c => c.id === commentId);
  }

  formatTimeAgo(date) {
    if (!date) return 'Just now';
    const now = Date.now();
    const diff = now - (date instanceof Date ? date.getTime() : new Date(date).getTime());

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  linkify(text) {
    if (!text) return '';
    return text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.remove('active');
    this.reportingCommentId = null;
  }

  closeEditModal() {
    const modal = document.getElementById('editCommentModal');
    if (modal) modal.classList.remove('active');
    this.editingCommentId = null;
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('toastNotification');
    let toastMessage = document.getElementById('toastMessage');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      toast.innerHTML = `<i class="fas fa-check-circle"></i><span id="toastMessage"></span>`;
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--bg-card, rgba(10, 5, 8, 0.95));
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color, rgba(138, 25, 225, 0.15));
        border-radius: 6px;
        padding: 12px 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.645);
        color: var(--text-primary, #f5eaff);
        font-family: 'Rajdhani', 'Orbitron', sans-serif;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
        pointer-events: none;
        max-width: 90%;
        border-radius: 8px;
      `;
      document.body.appendChild(toast);
      toastMessage = document.getElementById('toastMessage');
    }

    if (toastMessage) {
      toastMessage.textContent = message;
    }

    if (type === 'error') {
      toast.style.borderColor = '#ef4444';
      const icon = toast.querySelector('i');
      if (icon) {
        icon.style.color = '#ef4444';
        icon.className = 'fas fa-exclamation-circle';
      }
    } else if (type === 'warning') {
      toast.style.borderColor = '#f59e0b';
      const icon = toast.querySelector('i');
      if (icon) {
        icon.style.color = '#f59e0b';
        icon.className = 'fas fa-exclamation-triangle';
      }
    } else {
      toast.style.borderColor = 'var(--border-color, rgba(138, 25, 225, 0.15))';
      const icon = toast.querySelector('i');
      if (icon) {
        icon.style.color = 'var(--neon-purple, #8a19e1)';
        icon.className = 'fas fa-check-circle';
      }
    }

    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.pointerEvents = 'auto';

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      toast.style.pointerEvents = 'none';
    }, 4000);
  }
}

// ============================================================
// EXPOSE FOR INITIALIZATION
// ============================================================

window.CommentSystem = CommentSystem;
console.log('✅ CommentSystem class loaded and ready');
