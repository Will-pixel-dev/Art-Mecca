/**
 * Software Recommendation Quiz
 * Helps users find the best digital art software for their needs
 */

// Quiz Questions Database
const quizQuestions = [
  {
    id: 1,
    text: "What's your primary artistic focus?",
    icon: "🎨",
    options: [
      { value: "illustration", text: "Digital Illustration & Painting", icon: "🖌️" },
      { value: "photo", text: "Photo Editing & Manipulation", icon: "📸" },
      { value: "manga", text: "Manga / Comics / Webtoons", icon: "📚" },
      { value: "mixed", text: "Mixed / Everything", icon: "🎭" }
    ]
  },
  {
    id: 2,
    text: "What's your budget preference?",
    icon: "💰",
    options: [
      { value: "free", text: "Free / Open Source", icon: "🆓" },
      { value: "budget", text: "One-time payment under $100", icon: "💵" },
      { value: "premium", text: "Premium (willing to pay monthly)", icon: "👑" },
      { value: "any", text: "No preference", icon: "🤷" }
    ]
  },
  {
    id: 3,
    text: "Which device do you primarily use?",
    icon: "💻",
    options: [
      { value: "windows", text: "Windows PC", icon: "🪟" },
      { value: "mac", text: "Mac", icon: "🍎" },
      { value: "ipad", text: "iPad / Tablet", icon: "📱" },
      { value: "multiple", text: "Multiple devices", icon: "🔄" }
    ]
  },
  {
    id: 4,
    text: "What's your experience level?",
    icon: "📈",
    options: [
      { value: "beginner", text: "Beginner - Just starting out", icon: "🌱" },
      { value: "intermediate", text: "Intermediate - Some experience", icon: "⭐" },
      { value: "advanced", text: "Advanced - Professional artist", icon: "🏆" },
      { value: "student", text: "Student / Learning", icon: "🎓" }
    ]
  },
  {
    id: 5,
    text: "Which features matter most to you?",
    icon: "✨",
    options: [
      { value: "brushes", text: "Amazing brush engine", icon: "🖌️" },
      { value: "vectors", text: "Vector tools & precision", icon: "📐" },
      { value: "animation", text: "Animation capabilities", icon: "🎬" },
      { value: "community", text: "Large community & tutorials", icon: "👥" }
    ]
  }
];

// Software Recommendations Database
const softwareRecommendations = {
  photoshop: {
    name: "Adobe Photoshop",
    icon: "🎨",
    tagline: "The Industry Standard",
    description: "Photoshop is the most versatile digital art software, perfect for illustrators, photographers, and designers who need professional-grade tools.",
    features: ["Industry-leading brush engine", "Advanced photo editing", "3D & animation tools", "Huge community & tutorials"],
    featuresPage: "https://www.adobe.com/products/photoshop/features.html",
    trialLink: "https://www.adobe.com/products/photoshop/free-trial-download.html",
    bestFor: ["photo", "mixed", "advanced", "premium"]
  },
  procreate: {
    name: "Procreate",
    icon: "🎨",
    tagline: "iPad Artist's Dream",
    description: "Procreate is the ultimate iPad illustration app, offering an intuitive interface and powerful features at an affordable one-time price.",
    features: ["Apple Pencil perfection", "Over 200 handmade brushes", "4K canvas support", "Animation assist"],
    featuresPage: "https://procreate.com/features",
    trialLink: "https://procreate.com/handbook",
    bestFor: ["illustration", "ipad", "beginner", "budget"]
  },
  clipstudio: {
    name: "Clip Studio Paint",
    icon: "📚",
    tagline: "Manga & Comic Master",
    description: "The go-to choice for manga artists, comic creators, and illustrators who need specialized tools for panel creation and inking.",
    features: ["Vector layers", "3D models support", "Frame border tools", "Screen tone library"],
    featuresPage: "https://www.clipstudio.net/en/features/",
    trialLink: "https://www.clipstudio.net/en/trial/",
    bestFor: ["manga", "illustration", "intermediate", "vectors"]
  },
  krita: {
    name: "Krita",
    icon: "🆓",
    tagline: "Free & Powerful",
    description: "A completely free, open-source painting software that rivals premium options. Perfect for artists on a budget who don't want to compromise on quality.",
    features: ["Brush stabilizers", "Pop-up palette", "Wrap-around mode", "Animation timeline"],
    featuresPage: "https://krita.org/en/features/highlights/",
    trialLink: "https://krita.org/en/download/",
    bestFor: ["free", "illustration", "beginner", "intermediate"]
  },
  affinity: {
    name: "Affinity Photo",
    icon: "📸",
    tagline: "Adobe Alternative",
    description: "A professional photo editing and design suite with a one-time purchase model. Perfect for photographers and designers seeking Adobe alternatives.",
    features: ["Live filters", "RAW editing", "Panorama stitching", "No subscription"],
    featuresPage: "https://affinity.serif.com/en-us/photo/features/",
    trialLink: "https://affinity.serif.com/en-us/photo/trial/",
    bestFor: ["photo", "budget", "advanced", "windows", "mac"]
  }
};

// Quiz State
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStarted = true;

// DOM Elements
const quizCard = document.getElementById('quiz-card');

// Initialize Quiz
function initQuiz() {
  renderQuestion();
}

// Render Current Question
function renderQuestion() {
  const question = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  const html = `
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="progress-text">Question ${currentQuestionIndex + 1} of ${quizQuestions.length}</div>
    </div>

    <div class="question-area">
      <div style="font-size: 2.5rem; text-align: center; margin-bottom: 1rem;">${question.icon}</div>
      <h2 class="question-text">${question.text}</h2>

      <div class="options-list">
        ${question.options.map(option => `
          <button class="option-btn" data-value="${option.value}">
            <span class="option-icon">${option.icon}</span>
            <span class="option-text">${option.text}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="quiz-navigation">
      <button class="nav-btn prev" ${currentQuestionIndex === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>
        <i class="fas fa-arrow-left"></i> Previous
      </button>
      <button class="nav-btn next" disabled>
        Next <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  `;

  quizCard.innerHTML = html;

  // Add event listeners to option buttons
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => selectOption(btn.dataset.value));
  });

  // Add navigation listeners
  const prevBtn = document.querySelector('.nav-btn.prev');
  const nextBtn = document.querySelector('.nav-btn.next');

  if (prevBtn && !prevBtn.disabled) {
    prevBtn.addEventListener('click', goToPrevious);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', goToNext);
  }
}

// Select an option
function selectOption(value) {
  // Store answer
  userAnswers[currentQuestionIndex] = value;

  // Enable next button
  const nextBtn = document.querySelector('.nav-btn.next');
  if (nextBtn) {
    nextBtn.disabled = false;
  }

  // Highlight selected option
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.value === value ? '#fe67ea' : '';
    btn.style.background = btn.dataset.value === value ? 'rgba(254, 103, 234, 0.1)' : '';
  });
}

// Go to next question
function goToNext() {
  if (currentQuestionIndex < quizQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    // Quiz complete - show results
    showResults();
  }
}

// Go to previous question
function goToPrevious() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();

    // Restore previous answer if exists
    if (userAnswers[currentQuestionIndex]) {
      const previousAnswer = userAnswers[currentQuestionIndex];
      setTimeout(() => {
        const btns = document.querySelectorAll('.option-btn');
        btns.forEach(btn => {
          if (btn.dataset.value === previousAnswer) {
            btn.style.borderColor = '#fe67ea';
            btn.style.background = 'rgba(254, 103, 234, 0.1)';
          }
        });
        const nextBtn = document.querySelector('.nav-btn.next');
        if (nextBtn) nextBtn.disabled = false;
      }, 50);
    }
  }
}

// Calculate best software match
function calculateBestMatch() {
  const scores = {};

  // Initialize scores for all software
  Object.keys(softwareRecommendations).forEach(software => {
    scores[software] = 0;
  });

  // Score each software based on user answers
  userAnswers.forEach(answer => {
    Object.entries(softwareRecommendations).forEach(([software, data]) => {
      if (data.bestFor.includes(answer)) {
        scores[software] += 1;
      }
    });
  });

  // Find software with highest score
  let bestSoftware = null;
  let highestScore = -1;

  Object.entries(scores).forEach(([software, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestSoftware = software;
    }
  });

  // If multiple have same score, prioritize based on first answer
  if (!bestSoftware) {
    bestSoftware = 'photoshop'; // Default
  }

  return softwareRecommendations[bestSoftware];
}

// Show results
function showResults() {
  const recommendation = calculateBestMatch();

  const html = `
    <div class="results-area">
      <div class="result-icon">${recommendation.icon}</div>
      <h2 class="result-title">${recommendation.name}</h2>
      <div style="color: #fe67ea; font-weight: 600; margin-bottom: 0.5rem;">${recommendation.tagline}</div>
      <p class="result-description">${recommendation.description}</p>

      <div class="result-features">
        <h4><i class="fas fa-star"></i> Why it's perfect for you:</h4>
        <ul>
          ${recommendation.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>

      <div class="result-links">
        <a href="${recommendation.featuresPage}" target="_blank" class="result-link primary">
          <i class="fas fa-list"></i> View Features
        </a>
        <a href="${recommendation.trialLink}" target="_blank" class="result-link secondary">
          <i class="fas fa-download"></i> Get ${recommendation.name}
        </a>
      </div>

      <button class="restart-btn" onclick="restartQuiz()">
        <i class="fas fa-redo"></i> Take Quiz Again
      </button>
    </div>
  `;

  quizCard.innerHTML = html;
}

// Restart quiz
function restartQuiz() {
  currentQuestionIndex = 0;
  userAnswers = [];
  initQuiz();
}

// Make restartQuiz available globally
window.restartQuiz = restartQuiz;

// Start the quiz when page loads
document.addEventListener('DOMContentLoaded', initQuiz);
