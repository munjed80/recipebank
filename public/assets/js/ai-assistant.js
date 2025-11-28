/**
 * ChefSense - Conversational cooking companion
 * Master Chef + Nutrition Expert + Voice-enabled guide
 */

const ChefSense = {
  recipes: [],
  currentRecipe: null,
  conversationHistory: [],
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  recognition: null,
  chatContainer: null,
  elements: {},
  anchor: null,
  modal: null,
  overlay: null,

  async init() {
    await this.prepareChatContainer();
    this.cacheElements();
    this.setupVoiceFeatures();
    this.bindEvents();

    this.recipes = await RecipeBank.fetchRecipes();
    if (this.recipes.length === 0) {
      this.addMessage('system', 'Unable to load recipes. Please refresh and try again.');
      return;
    }

    this.showWelcome();
  },

  async prepareChatContainer() {
    this.chatContainer = document.getElementById('chat-container');
    this.anchor = document.querySelector('[data-chefsense-anchor]');

    // If chat container doesn't exist (non-home pages), create a hidden anchor and container
    if (!this.chatContainer) {
      const anchor = document.createElement('div');
      anchor.setAttribute('data-chefsense-anchor', 'true');
      anchor.className = 'chefsense-anchor hidden-anchor';
      anchor.innerHTML = this.getChatTemplate();
      document.body.appendChild(anchor);
      this.anchor = anchor;
      this.chatContainer = anchor.querySelector('#chat-container');
    }

    // Build modal + floating button once
    this.buildModal();
  },

  getChatTemplate() {
    return `
      <div class="chat-card" id="chat-container">
        <div class="chat-header">
          <div class="chat-header-icon">🍳</div>
          <div class="chat-header-info">
            <p class="chat-kicker">ChefSense</p>
            <h1>Master Chef & Nutrition Expert</h1>
            <p>Voice-enabled cooking guidance, nutrition insight, and step-by-step help.</p>
          </div>
          <div class="chat-actions">
            <button type="button" class="voice-toggle" data-voice-output-toggle aria-label="Toggle speech output">🔈</button>
            <span class="voice-status" data-voice-status>Voice ready</span>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <input type="text" id="chat-input" placeholder="Ask for recipes, steps, or substitutions..." autocomplete="off" aria-label="ChefSense chat input">
            <button type="button" class="mic-button" data-voice-input aria-label="Start voice input">🎙️</button>
            <button type="button" id="send-button" class="send-button" aria-label="Send message"><span>➤</span></button>
          </div>
          <p class="voice-fallback" data-voice-fallback aria-live="polite"></p>
          <div class="chat-suggestions" aria-label="Quick suggestions">
            <button type="button" class="suggestion-chip" data-suggestion="What recipes match chicken and rice?">Pairing ideas</button>
            <button type="button" class="suggestion-chip" data-suggestion="Show gluten-free dinner options">Dietary picks</button>
            <button type="button" class="suggestion-chip" data-suggestion="Give me the steps for Pad Thai">Step-by-step help</button>
            <button type="button" class="suggestion-chip" data-suggestion="What healthy swaps can I use for butter?">Healthy swaps</button>
          </div>
        </div>
      </div>
    `;
  },

  buildModal() {
    if (document.querySelector('.chefsense-fab')) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'chefsense-overlay';

    this.modal = document.createElement('div');
    this.modal.className = 'chefsense-modal';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'chefsense-close';
    closeBtn.setAttribute('aria-label', 'Close ChefSense');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.appendChild(closeBtn);

    const fab = document.createElement('button');
    fab.className = 'chefsense-fab';
    fab.setAttribute('aria-label', 'Open ChefSense');
    fab.innerHTML = '🧑‍🍳 ChefSense';
    fab.addEventListener('click', () => this.openModal());

    document.body.appendChild(fab);
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);
  },

  cacheElements() {
    this.elements.messages = document.getElementById('chat-messages');
    this.elements.input = document.getElementById('chat-input');
    this.elements.sendButton = document.getElementById('send-button');
    this.elements.voiceInput = this.chatContainer.querySelector('[data-voice-input]');
    this.elements.voiceToggle = this.chatContainer.querySelector('[data-voice-output-toggle]');
    this.elements.voiceStatus = this.chatContainer.querySelector('[data-voice-status]');
    this.elements.voiceFallback = this.chatContainer.querySelector('[data-voice-fallback]');
  },

  bindEvents() {
    this.elements.sendButton?.addEventListener('click', () => this.handleSend());
    this.elements.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.chatContainer.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-suggestion');
        this.elements.input.value = query;
        this.handleSend();
      });
    });
  },

  setupVoiceFeatures() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.elements.input.value = transcript;
        this.isListening = false;
        this.elements.voiceInput?.classList.remove('listening');
        this.handleSend();
      };
      this.recognition.onstart = () => {
        this.isListening = true;
        this.elements.voiceInput?.classList.add('listening');
      };
      this.recognition.onend = () => {
        this.isListening = false;
        this.elements.voiceInput?.classList.remove('listening');
      };
    } else if (this.elements.voiceFallback) {
      this.elements.voiceFallback.textContent = 'Voice input not supported in this browser. You can still type to chat with ChefSense.';
      this.elements.voiceInput?.setAttribute('disabled', 'disabled');
    }

    this.elements.voiceInput?.addEventListener('click', () => {
      if (!this.recognition) return;
      if (this.isListening) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    });

    this.isSpeaking = false;
    this.elements.voiceToggle?.addEventListener('click', () => {
      this.isSpeaking = !this.isSpeaking;
      this.elements.voiceToggle.textContent = this.isSpeaking ? '🔊' : '🔈';
      this.elements.voiceToggle.setAttribute('aria-pressed', this.isSpeaking.toString());
      this.elements.voiceStatus.textContent = this.isSpeaking ? 'Voice replies on' : 'Voice replies off';
    });
  },

  openModal() {
    if (!this.modal || !this.overlay || !this.chatContainer) return;
    this.overlay.classList.add('active');
    this.modal.classList.add('active');
    this.modal.appendChild(this.chatContainer);
    this.chatContainer.classList.add('in-modal');
  },

  closeModal() {
    if (!this.modal || !this.overlay || !this.anchor || !this.chatContainer) return;
    this.overlay.classList.remove('active');
    this.modal.classList.remove('active');
    this.anchor.appendChild(this.chatContainer);
    this.chatContainer.classList.remove('in-modal');
  },

  showWelcome() {
    const welcome = `## 👋 Welcome to ChefSense

I blend master chef expertise with nutrition insight for **${this.recipes.length} real recipes**. Ask me to:
• 🔍 Match recipes by country, ingredients, or tags
• 📝 Give numbered, step-by-step cooking instructions
• 🥗 Summarize nutrition and suggest healthier swaps
• ⚠️ Spot common allergens or dietary flags when I can
• 📌 Suggest clickable recipe cards to open right away

Try: "Find Lebanese vegetarian dinners" or "Give me healthy swaps for butter".`;
    this.addMessage('assistant', welcome);
  },

  handleSend() {
    const message = this.elements.input.value.trim();
    if (!message || this.isLoading) return;

    this.addMessage('user', message);
    this.elements.input.value = '';
    this.showLoading();

    setTimeout(() => this.processMessage(message), 450);
  },

  processMessage(message) {
    const lower = message.toLowerCase();
    this.conversationHistory.push({ role: 'user', content: message });

    let response = '';

    if (this.isGreeting(lower)) {
      response = this.handleGreeting();
    } else if (this.isAskingHowToMake(lower)) {
      response = this.handleHowToMake(lower);
    } else if (this.isAskingAboutIngredients(lower)) {
      response = this.handleIngredientQuestion(lower);
    } else if (this.isAskingAboutNutrition(lower)) {
      response = this.handleNutritionQuestion(lower);
    } else if (this.isAskingAboutDietaryInfo(lower) || this.isAskingAboutDietary(lower)) {
      response = this.handleDietaryInfoQuestion(lower);
    } else if (this.isAskingAboutSubstitutions(lower)) {
      response = this.handleSubstitutionQuestion(lower);
    } else if (this.isAskingAboutMealType(lower)) {
      response = this.handleMealTypeQuestion(lower);
    } else if (this.isAskingAboutTime(lower)) {
      response = this.handleTimeQuestion(lower);
    } else if (this.isAskingForTips(lower)) {
      response = this.handleTipsQuestion(lower);
    } else if (this.isAskingAboutFavorites(lower)) {
      response = this.handleFavoritesQuestion(lower);
    } else if (this.isRecipeSearch(lower)) {
      response = this.handleRecipeSearch(lower);
    } else {
      response = this.handleUnknown(message);
    }

    this.conversationHistory.push({ role: 'assistant', content: response });
    this.hideLoading();
    this.addMessage('assistant', response);
  },

  // Intent helpers
  isGreeting(msg) { return /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)/i.test(msg); },
  isRecipeSearch(msg) { return /(what|which|show|find|search|looking for|have|got).*(recipe|dish|food|meal)/i.test(msg) || /recipe.*(from|for|with)/i.test(msg); },
  isAskingHowToMake(msg) { return /(how\s*(do|can|to|should).*(make|cook|prepare|create)|steps|instructions)/i.test(msg); },
  isAskingAboutIngredients(msg) { return /(ingredients?|what.*(need|use|require))/i.test(msg); },
  isAskingAboutNutrition(msg) { return /(nutrition|calories|protein|carbs|fat|healthy|benefits)/i.test(msg); },
  isAskingAboutDietaryInfo(msg) { return /(gluten\.free|vegan|vegetarian|dairy\.free|allergen|allergy|dietary|halal|kosher)/i.test(msg); },
  isAskingAboutDietary(msg) { return /(vegan|vegetarian|gluten\.free|dairy\.free|keto|low\.carb|halal|kosher|high\.protein)/i.test(msg); },
  isAskingAboutTime(msg) { return /(how\s*long|time|minutes|hours|duration)/i.test(msg); },
  isAskingForTips(msg) { return /(tips?|tricks?|advice|suggestions?|secrets?|better)/i.test(msg); },
  isAskingAboutSubstitutions(msg) { return /(substitute|replacement|replace|alternative|instead of|without)/i.test(msg); },
  isAskingAboutMealType(msg) { return /(breakfast|lunch|dinner|appetizer|dessert|drink|snack)/i.test(msg); },
  isAskingAboutFavorites(msg) { return /(favorite|saved|my recipes|bookmarked)/i.test(msg); },

  handleGreeting() {
    const responses = [
      "Hello! I'm ChefSense. Want me to find a recipe or walk you through steps?",
      "Hi! I can match recipes, read them out, and suggest healthy swaps. What sounds good?",
      "Hey there! Tell me an ingredient, country, or dish you love and I'll cook up ideas."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  handleRecipeSearch(msg) {
    const results = RecipeSearch.search(this.recipes, msg);
    if (results.length === 0) {
      return "I couldn't find a match. Could you share a key ingredient, cuisine, or recipe name so I can guide you?";
    }

    let response = `Here are recipes I can serve up (${results.length} found):\n`;
    results.slice(0, 5).forEach(recipe => {
      const dietary = recipe.dietaryStyle && recipe.dietaryStyle !== 'None' ? ` • ${recipe.dietaryStyle}` : '';
      const time = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
      response += `\n[RECIPE_CARD:${recipe.slug}:${recipe.name_en}:${recipe.country}:${recipe.mealType}${dietary}:${time} min]`;
    });
    response += `\n\nWant steps for one of these? Just ask "How do I make [recipe name]?"`;
    return response;
  },

  handleHowToMake(msg) {
    let recipeName = msg.replace(/(how\s*(do|can|to|should).*(make|cook|prepare|create)|give|show|tell|steps|instructions|recipe|\?)/gi, '').trim();
    let recipe = RecipeSearch.findByName(this.recipes, recipeName) || this.findRecipeFromMessage(msg);
    if (!recipe) {
      return `I couldn't find that dish yet. Which recipe should I walk through?`;
    }

    this.currentRecipe = recipe;
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
    const allergens = this.getAllergens(recipe);

    let response = `## ${recipe.name_en}\n\n`;
    response += `🌍 ${recipe.country} • 🍽️ ${recipe.mealType} • ⏱️ ${totalTime} min\n`;
    response += recipe.dietaryStyle && recipe.dietaryStyle !== 'None' ? `• Dietary: ${recipe.dietaryStyle}\n` : '';
    if (allergens.length) {
      response += `• Allergens to watch: ${allergens.join(', ')}\n`;
    }

    response += `\n### Ingredients:\n`;
    recipe.ingredients.forEach(ing => { response += `• ${ing.amount} ${ing.unit} ${ing.name}\n`; });

    response += `\n### Step-by-Step Instructions:\n`;
    recipe.steps.forEach((step, index) => { response += `${index + 1}. ${step}\n`; });

    if (recipe.nutrition) {
      response += `\n### Nutrition per serving:\n`;
      response += `• 🔥 ${recipe.nutrition.per_serving_kcal} kcal\n`;
      response += `• 🥩 ${recipe.nutrition.protein_g}g protein\n`;
      response += `• 🍞 ${recipe.nutrition.carbs_g}g carbs\n`;
      response += `• 🧈 ${recipe.nutrition.fat_g}g fat\n`;
    }

    response += `\n[RECIPE_LINK:${recipe.slug}:Open the full recipe →]`;
    return response;
  },

  handleIngredientQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    if (!recipe) return "Which recipe do you want the ingredient list for?";

    this.currentRecipe = recipe;
    let response = `### Ingredients for ${recipe.name_en} (${recipe.servings} servings):\n`;
    recipe.ingredients.forEach(ing => { response += `• ${ing.amount} ${ing.unit} ${ing.name}\n`; });
    return response;
  },

  handleNutritionQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    if (!recipe || !recipe.nutrition) return "Tell me the recipe name and I'll share the nutrition details.";

    this.currentRecipe = recipe;
    let response = `### Nutrition & Wellness - ${recipe.name_en}\n\n`;
    response += `• 🔥 Calories: ${recipe.nutrition.per_serving_kcal} kcal\n`;
    response += `• 🥩 Protein: ${recipe.nutrition.protein_g}g\n`;
    response += `• 🧈 Fat: ${recipe.nutrition.fat_g}g\n`;
    response += `• 🍞 Carbs: ${recipe.nutrition.carbs_g}g\n`;
    response += recipe.nutrition_benefits ? `\n${recipe.nutrition_benefits}\n` : '';

    const swaps = this.getHealthySwaps(recipe);
    if (swaps.length) {
      response += `\nHealthy substitutions: ${swaps.join('; ')}`;
    }
    return response;
  },

  handleDietaryInfoQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    if (!recipe) return "Could you mention the recipe so I can check dietary flags?";

    this.currentRecipe = recipe;
    const allergens = this.getAllergens(recipe);
    let response = `### Dietary notes for ${recipe.name_en}\n`;
    response += `• Style: ${recipe.mealType} • ${recipe.dietaryStyle || 'No specific tag'}\n`;
    if (allergens.length) {
      response += `• Possible allergens: ${allergens.join(', ')}\n`;
    }
    response += `• Calories per serving: ${recipe.nutrition?.per_serving_kcal || 'N/A'} kcal\n`;
    response += `[RECIPE_LINK:${recipe.slug}:View recipe details]`;
    return response;
  },

  handleSubstitutionQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    const swaps = this.getHealthySwaps(recipe);
    if (swaps.length) {
      return `Here are smart swaps${recipe ? ` for ${recipe.name_en}` : ''}: ${swaps.join('; ')}`;
    }
    return "Tell me the ingredient you're missing and I'll suggest a substitution.";
  },

  handleMealTypeQuestion(msg) {
    const results = RecipeSearch.search(this.recipes, msg).filter(r => new RegExp(msg.split(' ').join('|'), 'i').test(r.mealType));
    if (results.length === 0) return "I didn't find a match. Try asking for dinner, dessert, or breakfast recipes.";

    let response = `Here are some ideas:\n`;
    results.slice(0, 4).forEach(r => {
      const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
      response += `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${time} min]\n`;
    });
    return response;
  },

  handleTimeQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    if (!recipe) return "Which recipe should I time?";

    const total = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
    return `⏱️ ${recipe.name_en}: Prep ${recipe.prep_time_minutes} min • Cook ${recipe.cooking_time_minutes} min • Total ${total} min`;
  },

  handleTipsQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    if (!recipe) return "Which recipe do you want tips for?";

    if (!recipe.cooking_tips || recipe.cooking_tips.length === 0) return `I don't have specific tips for ${recipe.name_en}, but I can suggest substitutions or timing adjustments.`;

    let response = `### Pro tips for ${recipe.name_en}:\n`;
    recipe.cooking_tips.forEach(tip => { response += `💡 ${tip}\n`; });
    return response;
  },

  handleFavoritesQuestion() {
    const favs = Favorites.getAll();
    if (!favs.length) return 'No favorites saved yet. Tap the heart on any recipe card to store it.';

    const recipes = this.recipes.filter(r => favs.includes(r.slug));
    let response = `Your favorites:\n`;
    recipes.slice(0, 5).forEach(r => {
      const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
      response += `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${time} min]\n`;
    });
    return response;
  },

  handleUnknown(msg) {
    const results = RecipeSearch.search(this.recipes, msg);
    if (results.length > 0) {
      const r = results[0];
      const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
      return `I found something close: [RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${time} min]\nIs that what you meant?`;
    }
    return "I'm here to help! Tell me a recipe name, key ingredient, or cuisine so I can guide you.";
  },

  findRecipeFromMessage(msg) {
    const results = RecipeSearch.search(this.recipes, msg);
    return results.length ? results[0] : null;
  },

  getAllergens(recipe) {
    if (!recipe) return [];
    const allergens = [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    if (ingredients.some(i => /flour|wheat|bread|pasta/.test(i))) allergens.push('gluten');
    if (ingredients.some(i => /milk|butter|cheese|yogurt|cream/.test(i))) allergens.push('dairy');
    if (ingredients.some(i => /egg/.test(i))) allergens.push('egg');
    if (ingredients.some(i => /peanut|almond|walnut|cashew|nut/.test(i))) allergens.push('nuts');
    if (ingredients.some(i => /soy/.test(i))) allergens.push('soy');
    if (ingredients.some(i => /shrimp|prawn|crab|lobster/.test(i))) allergens.push('shellfish');
    return allergens;
  },

  getHealthySwaps(recipe) {
    const swaps = [];
    if (!recipe) {
      swaps.push('Swap butter → olive oil for heart-healthy fats');
      swaps.push('Use Greek yogurt instead of heavy cream for creaminess');
      swaps.push('Try whole-grain pasta or rice for extra fiber');
      return swaps;
    }

    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    if (ingredients.some(i => /butter|cream/.test(i))) swaps.push('Use olive oil or Greek yogurt to lighten rich dairy');
    if (ingredients.some(i => /sugar/.test(i))) swaps.push('Reduce sugar or use honey in moderation');
    if (ingredients.some(i => /white rice|pasta|flour/.test(i))) swaps.push('Use whole-grain versions for more fiber');
    return swaps;
  },

  addMessage(role, content) {
    if (!this.elements.messages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🧑‍🍳';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = this.formatMessage(content);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    this.elements.messages.appendChild(messageDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

    if (role === 'assistant' && this.isSpeaking && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(bubble.textContent);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  },

  formatMessage(content) {
    return content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/###\s*(.+)/g, '<h4>$1</h4>')
      .replace(/\[RECIPE_LINK:([^:]+):([^\]]+)\]/g, (m, slug, text) => `<a href="${RecipeBank.CONFIG.basePath}/public/recipes/recipe.html?slug=${slug}" class="recipe-link">${text}</a>`)
      .replace(/\[RECIPE_CARD:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/g, (m, slug, name, country, meal, time) => `<a href="${RecipeBank.CONFIG.basePath}/public/recipes/recipe.html?slug=${slug}" class="recipe-card-inline"><span class="recipe-name">${name}</span><div class="recipe-meta">🌍 ${country} • 🍽️ ${meal} • ⏱️ ${time}</div></a>`)
      .replace(/##\s*(.+)/g, '<h3>$1</h3>')
      .replace(/•\s*(.+)/g, '<span class="list-item">• $1</span>')
      .replace(/(\d+)\.\s+(.+)/g, '<span class="numbered-item">$1. $2</span>')
      .replace(/→\s*(.+)/g, '<span class="arrow-item">→ $1</span>')
      .replace(/💡\s*(.+)/g, '<span class="tip-item">💡 $1</span>')
      .replace(/\n/g, '<br>');
  },

  showLoading() {
    this.isLoading = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message assistant-message loading-message';
    loadingDiv.innerHTML = `
      <div class="message-avatar">🧑‍🍳</div>
      <div class="message-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>`;
    loadingDiv.id = 'chefsense-loading';
    this.elements.messages.appendChild(loadingDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  },

  hideLoading() {
    this.isLoading = false;
    const loading = document.getElementById('chefsense-loading');
    if (loading) loading.remove();
  }
};

// Initialize after DOM is ready
(function initChefSenseWhenReady() {
  const start = () => {
    if (window.ChefSenseInitialized) return;
    window.ChefSenseInitialized = true;
    ChefSense.init();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(start, 0);
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();

// Export
window.ChefSense = ChefSense;
