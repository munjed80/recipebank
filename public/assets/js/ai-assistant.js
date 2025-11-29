/**
 * ChefSense - Conversational cooking companion
 * Master Chef + Nutrition Expert + Voice-enabled guide
 */

// Configuration constants
const CHEFSENSE_CONFIG = {
  MAX_SWAPS_DISPLAYED: 3,
  MAX_PANTRY_SUGGESTIONS: 4
};

const ChefSense = {
  recipes: [],
  currentRecipe: null,
  conversationHistory: [],
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  lang: window.AppLang || 'en',
  speechSupported: 'speechSynthesis' in window,
  speechRecognitionSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  recognition: null,
  voices: [],
  chatContainer: null,
  elements: {},
  anchor: null,
  modal: null,
  overlay: null,
  lastAnalysis: null,

  async init() {
    await this.prepareChatContainer();
    this.cacheElements();
    await this.setupVoiceFeatures();
    this.setupSpeechRecognition();
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
          <div class="chat-header-icon">👨‍🍳</div>
          <div class="chat-header-info">
            <p class="chat-kicker">ChefSense</p>
            <h1>Your Personal Chef & Nutrition Expert</h1>
            <p>Ask me anything about cooking, recipes & healthy eating!</p>
          </div>
          <div class="chat-actions">
            <button type="button" class="voice-toggle" data-voice-output-toggle aria-label="Toggle speech output">🔈</button>
            <span class="voice-status" data-voice-status>Voice ready</span>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <input type="text" id="chat-input" placeholder="I have chicken, onions and rice - what can I cook?" autocomplete="off" aria-label="ChefSense chat input">
            <button type="button" id="mic-button" class="mic-button" aria-label="Voice input"><span>🎤</span></button>
            <button type="button" id="send-button" class="send-button" aria-label="Send message"><span>➤</span></button>
          </div>
          <p class="voice-fallback" data-voice-fallback aria-live="polite"></p>
          <div class="chat-suggestions" aria-label="Quick suggestions">
            <button type="button" class="suggestion-chip" data-suggestion="I only have chicken, onions and rice - what can I cook?">🍳 What can I cook?</button>
            <button type="button" class="suggestion-chip" data-suggestion="Show me healthy swaps for butter and cream">💡 Healthy swaps</button>
            <button type="button" class="suggestion-chip" data-suggestion="Find me a quick vegetarian dinner">🥗 Veggie dinner</button>
            <button type="button" class="suggestion-chip" data-suggestion="What are the nutrition facts for Pad Thai?">📊 Nutrition info</button>
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
    this.elements.micButton = document.getElementById('mic-button');
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

    this.elements.micButton?.addEventListener('click', () => this.toggleSpeechRecognition());

    this.chatContainer.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-suggestion');
        this.elements.input.value = query;
        this.handleSend();
      });
    });

    this.elements.messages?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-speak-text]');
      if (button) {
        const text = button.getAttribute('data-speak-text');
        const lang = button.getAttribute('data-lang') || this.lang;
        this.speakText(text, lang);
      }
    });
  },

  setupSpeechRecognition() {
    if (!this.speechRecognitionSupported) {
      // Hide mic button if speech recognition is not supported
      if (this.elements.micButton) {
        this.elements.micButton.style.display = 'none';
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.lang === 'ar' ? 'ar-SA' : this.lang === 'fr' ? 'fr-FR' : this.lang === 'nl' ? 'nl-NL' : 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.elements.micButton?.classList.add('listening');
      this.elements.micButton.innerHTML = '<span>🔴</span>';
      if (this.elements.voiceFallback) {
        this.elements.voiceFallback.textContent = 'Listening...';
      }
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        this.elements.input.value = transcript;
        // Auto-submit after speech recognition with brief delay for UI feedback
        const SPEECH_SUBMIT_DELAY_MS = 300;
        setTimeout(() => this.handleSend(), SPEECH_SUBMIT_DELAY_MS);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.elements.micButton?.classList.remove('listening');
      this.elements.micButton.innerHTML = '<span>🎤</span>';
      if (this.elements.voiceFallback) {
        // Provide specific error messages based on error type
        const errorMessages = {
          'not-allowed': 'Microphone access denied. Please allow microphone access.',
          'no-speech': 'No speech detected. Please try again.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Voice input cancelled.',
          'audio-capture': 'No microphone found. Please check your device.'
        };
        this.elements.voiceFallback.textContent = errorMessages[event.error] || 'Voice input error. Please try again.';
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.elements.micButton?.classList.remove('listening');
      this.elements.micButton.innerHTML = '<span>🎤</span>';
      if (this.elements.voiceFallback && this.elements.voiceFallback.textContent === 'Listening...') {
        this.elements.voiceFallback.textContent = '';
      }
    };
  },

  toggleSpeechRecognition() {
    if (!this.recognition) return;

    if (this.isListening) {
      this.recognition.stop();
    } else {
      // Update recognition language based on current detected language
      this.recognition.lang = this.lang === 'ar' ? 'ar-SA' : this.lang === 'fr' ? 'fr-FR' : this.lang === 'nl' ? 'nl-NL' : 'en-US';
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition might already be running
        if (this.elements.voiceFallback) {
          this.elements.voiceFallback.textContent = 'Voice input busy. Please wait and try again.';
        }
      }
    }
  },

  async setupVoiceFeatures() {
    if (!this.speechSupported) {
      this.elements.voiceToggle?.classList.add('is-hidden');
      this.elements.voiceStatus?.classList.add('is-hidden');
      if (this.elements.voiceFallback) {
        this.elements.voiceFallback.textContent = 'Voice playback is not supported in this browser.';
      }
      return;
    }

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
    };

    loadVoices();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    this.isSpeaking = true;
    this.elements.voiceToggle?.addEventListener('click', () => {
      this.isSpeaking = !this.isSpeaking;
      this.elements.voiceToggle.textContent = this.isSpeaking ? '🔊' : '🔈';
      this.elements.voiceToggle.setAttribute('aria-pressed', this.isSpeaking.toString());
      this.elements.voiceStatus.textContent = this.isSpeaking ? 'Voice replies on' : 'Voice replies muted';
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
    const welcome = `## 👨‍🍳 Hello! I'm ChefSense, your personal chef & nutrition expert!

Ready to cook something amazing? I know **${this.recipes.length} recipes** from around the world. Just tell me what you have!

**What I can do:**
• 🍳 "I only have chicken, onions and rice" → Get 2-4 smart recipe ideas with steps
• 🥗 Show calories, protein, fat, carbs & allergen info for any dish
• 💡 Suggest healthy swaps like olive oil for butter or quinoa for rice
• 📝 Walk you through any recipe step-by-step

**Try asking:** "What can I cook with pasta and tomatoes?" or "Show me a quick vegetarian dinner"`;
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
    if (message.toLowerCase().startsWith('/debug last')) {
      this.hideLoading();
      const debug = this.buildDebugSummary();
      this.addMessage('assistant', debug, 'en');
      this.conversationHistory.push({ role: 'assistant', content: debug, lang: 'en', debug: true });
      return;
    }

    this.lang = this.detectLanguage(message);
    window.AppLang = this.lang;
    if (window.I18N) {
      window.I18N.applyTranslations(this.lang);
    }

    this.conversationHistory.push({ role: 'user', content: message, lang: this.lang });

    const ingredientTokens = RecipeSearch.extractIngredientTokens ? RecipeSearch.extractIngredientTokens(message) : [];
    const pantryMode = this.isPantryQuery(message, ingredientTokens);

    const searchResults = pantryMode ? [] : RecipeSearch.search(this.recipes, message);

    let recipe = null;
    let response = '';
    let pantryMatches = [];

    if (pantryMode) {
      const pantryResult = this.buildPantryReply(ingredientTokens, message);
      response = pantryResult.text;
      pantryMatches = pantryResult.matches;
    } else {
      recipe = searchResults.length ? searchResults[0] : this.findRecipeFromMessage(message);
      this.currentRecipe = recipe || this.currentRecipe;
      response = this.buildStructuredReply(message, recipe, { searchResults });
    }

    this.conversationHistory.push({ role: 'assistant', content: response, lang: this.lang });
    this.hideLoading();
    this.addMessage('assistant', response, this.lang);

    this.lastAnalysis = {
      lastMessage: message,
      lang: this.lang,
      pantryMode,
      ingredientTokens,
      matchedCount: pantryMode ? pantryMatches.length : searchResults.length,
      matchedNames: pantryMode
        ? pantryMatches.map(m => m.name_en)
        : searchResults.slice(0, 5).map(r => r.name_en),
      lastRecipe: this.currentRecipe ? this.currentRecipe.name_en : null
    };
  },

  detectLanguage(text) {
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    const normalized = text.toLowerCase();
    const profiles = {
      fr: /(bonjour|merci|recette|cuisine|ingrédient|étape|bonsoir)/,
      nl: /(hallo|dank|recept|keuken|ingrediënt|stap|eten)/,
      en: /(hello|hi|please|recipe|cook|step|thanks)/
    };
    const detected = Object.entries(profiles).find(([, pattern]) => pattern.test(normalized));
    return detected ? detected[0] : 'en';
  },

  getLangPack(lang) {
    const packs = {
      en: {
        greeting: "👨‍🍳 Chef's tip coming right up!",
        stepsTitle: 'Let me walk you through it',
        nutritionTitle: 'Nutrition breakdown',
        swapsTitle: 'Healthy swaps I recommend',
        allergenTitle: 'Heads up on allergens',
        suggestionsTitle: 'More tasty ideas for you',
        calories: 'Calories',
        protein: 'Protein',
        carbs: 'Carbs',
        fat: 'Fat',
        fallbackNutrition: 'Roughly 520 kcal per serving with balanced macros.',
        noAllergens: 'Looks allergy-friendly! No common allergens spotted.',
        askClarify: 'What else can I help you cook today?',
        pantryIntro: 'Great ingredients! Here is what we can make',
        pantryMatchesTitle: 'My top picks for you',
        bestMatch: "Chef's choice",
        noMatches: 'Hmm, tricky combo! But let me suggest some flexible ideas.',
        nutritionSummaryLead: 'Quick nutrition facts'
      },
      fr: {
        greeting: "Voici un plan clair et professionnel :",
        stepsTitle: 'Instructions étape par étape',
        nutritionTitle: 'Notes nutrition & santé',
        swapsTitle: 'Substituts plus sains',
        allergenTitle: 'Allergènes à surveiller',
        suggestionsTitle: 'Recettes correspondantes',
        calories: 'Calories',
        protein: 'Protéines',
        carbs: 'Glucides',
        fat: 'Lipides',
        fallbackNutrition: 'Calories estimées : ~520 kcal avec un équilibre en macronutriments.',
        noAllergens: 'Aucun allergène majeur détecté parmi les ingrédients indiqués.',
        askClarify: 'Indiquez un ingrédient ou une cuisine et je préciserai davantage.',
        pantryIntro: 'Voici ce que vous pouvez cuisiner avec',
        pantryMatchesTitle: 'Sélections par ingrédients',
        bestMatch: 'Meilleure option',
        noMatches: "Je n'ai pas trouvé d'équivalent direct, voici des idées flexibles à essayer.",
        nutritionSummaryLead: 'Notes nutrition & santé'
      },
      nl: {
        greeting: 'Hier is een duidelijk plan:',
        stepsTitle: 'Stapsgewijze instructies',
        nutritionTitle: 'Voeding & gezondheidsnotities',
        swapsTitle: 'Gezonde vervangingen',
        allergenTitle: 'Allergeen waarschuwing',
        suggestionsTitle: 'Receptsuggesties',
        calories: 'Calorieën',
        protein: 'Eiwit',
        carbs: 'Koolhydraten',
        fat: 'Vet',
        fallbackNutrition: 'Geschatte calorieën: ~520 kcal met gebalanceerde macro’s.',
        noAllergens: 'Geen grote allergenen gevonden in de genoemde ingrediënten.',
        askClarify: 'Noem een belangrijk ingrediënt of keuken en ik verfijn het meteen.',
        pantryIntro: 'Dit kun je koken met',
        pantryMatchesTitle: 'Suggesties op basis van ingrediënten',
        bestMatch: 'Beste match',
        noMatches: 'Geen directe match gevonden; hier zijn toch een paar ideeën.',
        nutritionSummaryLead: 'Voeding & gezondheid'
      },
      ar: {
        greeting: 'إليك خطة واضحة واحترافية:',
        stepsTitle: 'خطوات مرقمة للتحضير',
        nutritionTitle: 'ملاحظات التغذية والصحة',
        swapsTitle: 'بدائل صحية للمكونات',
        allergenTitle: 'تحذير من مسببات الحساسية',
        suggestionsTitle: 'وصفات مقترحة',
        calories: 'سعرات حرارية',
        protein: 'بروتين',
        carbs: 'كربوهيدرات',
        fat: 'دهون',
        fallbackNutrition: 'تقدير السعرات: حوالي 520 سعرة مع توازن في العناصر الغذائية.',
        noAllergens: 'لا توجد مسببات حساسية بارزة بين المكونات المذكورة.',
        askClarify: 'شارك مكوناً أو مطبخاً مفضلاً لأخصص الإجابة أكثر.',
        pantryIntro: 'إليك ما يمكن طهيه باستخدام',
        pantryMatchesTitle: 'اقتراحات مبنية على المكونات',
        bestMatch: 'الخيار الأقرب',
        noMatches: 'لم أجد وصفة مطابقة تماماً، هذه أفكار مرنة لتجربتها.',
        nutritionSummaryLead: 'ملاحظات غذائية وصحية'
      }
    };

    return packs[lang] || packs.en;
  },

  isPantryQuery(message, tokens) {
    const normalized = message.toLowerCase();
    const hasList = message.includes(',') || tokens.length >= 3;
    const hasPrompt = /(i have|i've got|only have|what can i cook|cook with|use.*have|using)/.test(normalized);
    const mentionsCook = /cook|make|recipe|idea|suggest/.test(normalized);
    return (hasPrompt || hasList) && mentionsCook && tokens.length >= 2;
  },

  extractContextHints(message) {
    const normalized = message.toLowerCase();
    const context = { tags: [] };

    if (/vegan/.test(normalized)) context.diet = 'vegan';
    if (/vegetarian/.test(normalized)) context.diet = 'vegetarian';
    if (/gluten[-\s]?free/.test(normalized)) context.tags.push('gluten-free');
    if (/salad/.test(normalized)) context.tags.push('salad');
    if (/soup|stew|broth/.test(normalized)) context.mealType = 'soup';
    if (/dessert|sweet/.test(normalized)) context.mealType = 'dessert';

    return context;
  },

  buildStructuredReply(message, recipe, options = {}) {
    const pack = this.getLangPack(this.lang);
    const steps = recipe ? this.formatRecipeSteps(recipe) : this.buildGenericSteps(message);
    const nutrition = this.buildNutritionNotes(recipe, pack);
    const swaps = this.getHealthySwaps(recipe);
    const suggestions = this.buildRecipeSuggestions(message, recipe, pack, options.searchResults);

    let response = `${pack.greeting}\n\n`;

    if (recipe) {
      const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
      response += `### ${recipe.name_en}\n`;
      response += `🌍 ${recipe.country} • 🍽️ ${recipe.mealType} • ⏱️ ${totalTime} min • 📊 ${recipe.difficulty}`;
      if (recipe.dietaryStyle && recipe.dietaryStyle !== 'None') {
        response += ` • 🥗 ${recipe.dietaryStyle}`;
      }
      response += `\n\n`;
    }

    response += `### ${pack.stepsTitle}:\n`;
    steps.forEach((step, index) => { response += `${index + 1}. ${step}\n`; });

    response += `\n### ${pack.nutritionTitle}:\n${nutrition}\n`;

    if (swaps.length) {
      response += `\n### ${pack.swapsTitle}:\n`;
      swaps.slice(0, CHEFSENSE_CONFIG.MAX_SWAPS_DISPLAYED).forEach(s => { response += `${s}\n`; });
    }

    if (suggestions) {
      response += `\n### ${pack.suggestionsTitle}:\n${suggestions}`;
    }

    response += `\n\n${pack.askClarify}`;
    return response;
  },

  buildPantryReply(ingredientTokens, message) {
    const pack = this.getLangPack(this.lang);
    const context = this.extractContextHints(message);
    // Limit to 2-4 smart suggestions as per requirements
    const matches = RecipeSearch.findMatchesByIngredients(this.recipes, ingredientTokens, { context, limit: CHEFSENSE_CONFIG.MAX_PANTRY_SUGGESTIONS });

    if (!matches.length) {
      return { text: this.buildPantryFallback(ingredientTokens, pack), matches: [] };
    }

    const best = matches[0];
    this.currentRecipe = best;
    const steps = this.formatRecipeSteps(best);
    const swaps = this.getHealthySwaps(best);

    let response = `${pack.pantryIntro} **${ingredientTokens.join(', ')}**! 🎉\n\n`;

    // Show all matches (2-4) with quick info
    response += `### ${pack.pantryMatchesTitle}:\n`;
    matches.forEach((match, index) => {
      const bestLabel = index === 0 ? ` ⭐ ${pack.bestMatch}` : '';
      const time = (match.prep_time_minutes || 0) + (match.cooking_time_minutes || 0);
      const matchedIng = match.matchedIngredients?.length ? `Uses: ${match.matchedIngredients.join(', ')}` : '';
      
      response += `**${index + 1}. ${match.name_en}** (${match.country})${bestLabel}\n`;
      response += `   ⏱️ ${time} min • 📊 ${match.difficulty}`;
      if (match.nutrition) {
        response += ` • 🔥 ${match.nutrition.per_serving_kcal} kcal`;
      }
      response += `\n`;
      if (matchedIng) response += `   ${matchedIng}\n`;
      response += `   [RECIPE_LINK:${match.slug}:👉 View full recipe]\n\n`;
    });

    // Show steps for the best match
    response += `### ${pack.stepsTitle} for ${best.name_en}:\n`;
    steps.forEach((step, index) => { response += `${index + 1}. ${step}\n`; });

    response += `\n### ${pack.nutritionTitle}:\n${this.buildNutritionNotes(best, pack)}\n`;

    if (swaps.length) {
      response += `\n### ${pack.swapsTitle}:\n`;
      swaps.slice(0, CHEFSENSE_CONFIG.MAX_SWAPS_DISPLAYED).forEach(s => { response += `${s}\n`; });
    }

    response += `\n${pack.askClarify}`;
    return { text: response, matches };
  },

  buildPantryFallback(ingredientTokens, pack) {
    const baseList = ingredientTokens.join(', ');
    const genericIdea = [
      '1. Stir-fry aromatics, add your protein, then fold in grains or legumes.',
      '2. Season with spices you enjoy, add a splash of stock or water to bring it together.',
      '3. Finish with herbs, lemon, or yogurt for freshness.'
    ];

    let response = `${pack.pantryIntro} ${baseList}, but ${pack.noMatches}\n\n`;
    response += `### ${pack.stepsTitle}:\n${genericIdea.join('\n')}\n\n`;
    response += `### ${pack.nutritionTitle}:\n`;
    response += `${pack.nutritionSummaryLead}: ${this.getHealthAdvice()}\n`;
    response += `Allergen watch: if your list includes nuts, dairy, eggs, or wheat, keep substitutions handy.\n`;
    response += `${pack.askClarify}`;
    return response;
  },

  formatRecipeSteps(recipe) {
    if (!recipe || !recipe.steps) return this.buildGenericSteps('');
    return recipe.steps;
  },

  buildGenericSteps(message) {
    const focus = message ? message.split(/[.!?]/)[0] : 'your dish';
    return [
      `Gather the core ingredients for ${focus} and keep a clean station ready.`,
      'Preheat, chop, and season early so cooking stays smooth.',
      'Cook with gentle heat, taste often, and finish with fresh herbs or citrus.'
    ];
  },

  buildNutritionNotes(recipe, pack) {
    const lines = [];

    if (recipe?.nutrition) {
      lines.push(
        `• 🔥 ${pack.calories}: **${recipe.nutrition.per_serving_kcal} kcal** per serving`,
        `• 🥩 ${pack.protein}: **${recipe.nutrition.protein_g}g**`,
        `• 🍞 ${pack.carbs}: **${recipe.nutrition.carbs_g}g**`,
        `• 🧈 ${pack.fat}: **${recipe.nutrition.fat_g}g**`
      );
    } else {
      lines.push(`• ${pack.fallbackNutrition}`);
    }

    // Add allergens right after nutrition
    const allergens = recipe ? this.getAllergens(recipe) : [];
    if (allergens.length) {
      lines.push(`• ⚠️ Contains: **${allergens.join(', ')}**`);
    }

    lines.push(`• 💡 ${this.getHealthAdvice(recipe)}`);
    return lines.join('\n');
  },

  getHealthAdvice(recipe) {
    if (!recipe || !recipe.nutrition) {
      return 'Pro tip: Fill half your plate with veggies, add lean protein, and choose whole grains!';
    }

    const notes = [];
    const calories = recipe.nutrition.per_serving_kcal;
    if (calories >= 750) notes.push('Rich dish! Share or pair with a light salad.');
    else if (calories >= 450) notes.push('Good energy! Add some veggies on the side.');
    else notes.push('Light & fresh! Great for a starter or add protein.');

    const protein = recipe.nutrition.protein_g;
    if (protein >= 25) notes.push('Great for muscle recovery!');
    else if (protein < 12) notes.push('Tip: Add beans or eggs for more protein.');

    if (recipe.tags?.some(t => /vegetarian|vegan/i.test(t))) {
      notes.push('Plant-based goodness!');
    }

    return notes.join(' ');
  },

  buildRecipeSuggestions(message, recipe, pack, searchResults) {
    const results = searchResults && searchResults.length ? searchResults : RecipeSearch.search(this.recipes, message);
    if (results.length) {
      return results.slice(0, 4).map(r => {
        const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
        return `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${time} min]`;
      }).join('\n');
    }

    if (recipe && recipe.country_slug) {
      const alternates = this.recipes.filter(r => r.country_slug === recipe.country_slug && r.slug !== recipe.slug).slice(0, 3);
      if (alternates.length) {
        return alternates.map(r => {
          const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
          return `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${time} min]`;
        }).join('\n');
      }
    }

    const pantryIdeas = this.recipes.slice(0, 2).map(r => `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}:${(r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0)} min]`).join('\n');
    return pantryIdeas;
  },

  buildDebugSummary() {
    if (!this.lastAnalysis || !this.lastAnalysis.lastMessage) {
      return 'Debug summary: no prior user query captured yet.';
    }

    const info = this.lastAnalysis;
    const names = info.matchedNames && info.matchedNames.length ? info.matchedNames.join(', ') : 'none';
    const tokens = info.ingredientTokens && info.ingredientTokens.length ? info.ingredientTokens.join(', ') : 'none';

    return [
      'Debug summary (last request):',
      `• Message: "${info.lastMessage}"`,
      `• Detected language: ${info.lang}`,
      `• Path: ${info.pantryMode ? 'Pantry mode' : 'Standard recipe guidance'}`,
      `• Ingredient tokens: ${tokens}`,
      `• Matched recipes: ${info.matchedCount} (${names})`,
      `• Active recipe: ${info.lastRecipe || 'none'}`
    ].join('\n');
  },

  findRecipeFromMessage(msg) {
    const results = RecipeSearch.search(this.recipes, msg);
    return results.length ? results[0] : null;
  },

  getAllergens(recipe) {
    if (!recipe) return [];
    const allergens = [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    if (ingredients.some(i => /flour|wheat|bread|pasta|noodle/.test(i))) allergens.push('gluten');
    if (ingredients.some(i => /milk|butter|cheese|yogurt|cream|ghee/.test(i))) allergens.push('dairy');
    if (ingredients.some(i => /\beggs?\b/.test(i) && !/eggplant/.test(i))) allergens.push('eggs');
    if (ingredients.some(i => /peanut|almond|walnut|cashew|pistachio|nut/.test(i))) allergens.push('tree nuts');
    if (ingredients.some(i => /soy|tofu|tempeh/.test(i))) allergens.push('soy');
    if (ingredients.some(i => /shrimp|prawn|crab|lobster|shellfish/.test(i))) allergens.push('shellfish');
    if (ingredients.some(i => /fish|salmon|tuna|anchov/.test(i))) allergens.push('fish');
    if (ingredients.some(i => /sesame/.test(i))) allergens.push('sesame');
    return allergens;
  },

  getHealthySwaps(recipe) {
    const swaps = [];
    if (!recipe) {
      swaps.push('🧈→🫒 Butter → olive oil (heart-healthy fats)');
      swaps.push('🥛→🥣 Heavy cream → Greek yogurt (less fat, more protein)');
      swaps.push('🍚→🌾 White rice → quinoa or brown rice (more fiber)');
      swaps.push('🍝→🥒 Pasta → zucchini noodles (low-carb option)');
      return swaps;
    }

    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    if (ingredients.some(i => /butter/.test(i))) swaps.push('🧈→🫒 Butter → olive oil or avocado (healthier fats)');
    if (ingredients.some(i => /cream/.test(i))) swaps.push('🥛→🥣 Cream → coconut milk or cashew cream (dairy-free)');
    if (ingredients.some(i => /sugar/.test(i))) swaps.push('🍬→🍯 Sugar → honey, maple syrup, or dates (natural sweetness)');
    if (ingredients.some(i => /white rice/.test(i))) swaps.push('🍚→🌾 White rice → cauliflower rice (low-carb) or quinoa (more protein)');
    if (ingredients.some(i => /pasta/.test(i))) swaps.push('🍝→🌾 Regular pasta → whole wheat or chickpea pasta (gluten-free option)');
    if (ingredients.some(i => /flour/.test(i) && !/whole/.test(i))) swaps.push('🌾→🥥 White flour → almond flour or oat flour (gluten-free options)');
    if (ingredients.some(i => /beef|lamb/.test(i))) swaps.push('🥩→🍗 Red meat → chicken, turkey, or tofu (leaner protein)');
    if (ingredients.some(i => /salt/.test(i))) swaps.push('🧂→🌿 Salt → herbs & lemon zest (reduce sodium, boost flavor)');
    if (ingredients.some(i => /oil/.test(i) && /vegetable|canola/.test(i))) swaps.push('🛢️→🫒 Vegetable oil → extra virgin olive oil (better fats)');
    
    return swaps.length > 0 ? swaps : ['💡 This recipe looks pretty healthy! Minor tweaks: use less salt, add more veggies.'];
  },

  addMessage(role, content, lang = this.lang) {
    if (!this.elements.messages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🧑‍🍳';

    const messageBody = document.createElement('div');
    messageBody.className = 'message-body';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.setAttribute('lang', lang);
    if (lang === 'ar') {
      bubble.setAttribute('dir', 'rtl');
    }
    bubble.innerHTML = this.formatMessage(content);
    messageBody.appendChild(bubble);

    if (role === 'assistant' && this.speechSupported) {
      const speakBtn = document.createElement('button');
      speakBtn.className = 'speak-button';
      speakBtn.type = 'button';
      speakBtn.setAttribute('data-speak-text', bubble.textContent);
      speakBtn.setAttribute('data-lang', lang);
      speakBtn.setAttribute('aria-label', 'Play ChefSense reply');
      speakBtn.textContent = '🔊';
      messageBody.appendChild(speakBtn);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageBody);
    this.elements.messages.appendChild(messageDiv);
    
    // Smooth scroll to bottom of messages
    this.elements.messages.scrollTo({
      top: this.elements.messages.scrollHeight,
      behavior: 'smooth'
    });

    if (role === 'assistant' && this.isSpeaking && this.speechSupported) {
      this.speakText(bubble.textContent, lang);
    }
  },

  speakText(text, lang) {
    if (!this.speechSupported || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : lang === 'nl' ? 'nl-NL' : 'en-US';
    utterance.lang = langCode;
    const voiceMatch = this.voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode.split('-')[0]));
    if (voiceMatch) {
      utterance.voice = voiceMatch;
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
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
        <div class="typing-indicator" aria-live="polite">
          <span class="typing-label">Chef is preparing your answer</span>
          <span class="dots"><span></span><span></span><span></span></span>
        </div>
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
