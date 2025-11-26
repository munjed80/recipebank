/**
 * RecipeBank - AI Assistant Module
 * Smart chat interface for cooking questions and recipe guidance
 */

const AIAssistant = {
  // State management
  allRecipes: [],
  currentRecipe: null,
  conversationHistory: [],
  isLoading: false,

  /**
   * Initialize the AI Assistant
   */
  async init() {
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    if (!chatContainer || !chatInput) {
      console.error('AI Assistant: Missing required elements');
      return;
    }

    // Load recipes
    this.allRecipes = await RecipeBank.fetchRecipes();
    
    if (this.allRecipes.length === 0) {
      this.addMessage('system', 'Unable to load recipes. Please refresh the page and try again.');
      return;
    }

    // Set up event listeners
    sendButton?.addEventListener('click', () => this.handleSend());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Show welcome message
    this.showWelcome();
  },

  /**
   * Show welcome message
   */
  showWelcome() {
    const welcomeMessage = `## 👋 Welcome to RecipeBank AI Chef!

I'm your personal cooking assistant with access to **${this.allRecipes.length} recipes** from around the world. Here's what I can help you with:

### What I Can Do:
• **🔍 Find Recipes** - Search by country, ingredient, meal type, or dietary preference
• **📝 Step-by-Step Instructions** - Get detailed cooking guidance with numbered steps
• **🥗 Nutrition Info** - Learn about calories, protein, and health benefits
• **🔄 Ingredient Substitutions** - Find alternatives when you're missing something
• **💡 Cooking Tips** - Get pro tips to improve your dishes
• **❤️ Your Favorites** - Ask about your saved recipes

### Try These Examples:
→ "What Italian recipes do you have?"
→ "How do I make butter chicken?"
→ "Show me vegetarian dinner ideas"
→ "What can I substitute for butter?"
→ "What are my favorite recipes?"

**Just type your question below and I'll help you cook something amazing!**`;

    this.addMessage('assistant', welcomeMessage);
  },

  /**
   * Handle send button click
   */
  handleSend() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || this.isLoading) return;

    // Add user message
    this.addMessage('user', message);
    chatInput.value = '';

    // Show loading
    this.showLoading();

    // Process with slight delay for natural feel
    setTimeout(() => {
      this.processMessage(message);
    }, 500 + Math.random() * 500);
  },

  /**
   * Process user message and generate response
   * @param {string} message - User's message
   */
  processMessage(message) {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Store in conversation history
    this.conversationHistory.push({ role: 'user', content: message });

    // Check for different intents - order matters!
    // Specific intents (meal type, dietary) must be checked before general recipe search
    // to properly handle queries like "show me breakfast recipes" without falling through
    // to the general search which would match the word "breakfast" less precisely.
    if (this.isGreeting(lowerMessage)) {
      response = this.handleGreeting();
    } else if (this.isAskingHowToMake(lowerMessage)) {
      response = this.handleHowToMake(lowerMessage);
    } else if (this.isAskingAboutIngredients(lowerMessage)) {
      response = this.handleIngredientQuestion(lowerMessage);
    } else if (this.isAskingAboutDietaryInfo(lowerMessage)) {
      response = this.handleDietaryInfoQuestion(lowerMessage);
    } else if (this.isAskingAboutNutrition(lowerMessage)) {
      response = this.handleNutritionQuestion(lowerMessage);
    } else if (this.isAskingAboutTime(lowerMessage)) {
      response = this.handleTimeQuestion(lowerMessage);
    } else if (this.isAskingForTips(lowerMessage)) {
      response = this.handleTipsQuestion(lowerMessage);
    } else if (this.isFollowUp(lowerMessage)) {
      response = this.handleFollowUp(lowerMessage);
    } else if (this.isAskingAboutSubstitutions(lowerMessage)) {
      response = this.handleSubstitutionQuestion(lowerMessage);
    } else if (this.isAskingAboutMealType(lowerMessage)) {
      response = this.handleMealTypeQuestion(lowerMessage);
    } else if (this.isAskingAboutDietary(lowerMessage)) {
      response = this.handleDietaryQuestion(lowerMessage);
    } else if (this.isAskingAboutFavorites(lowerMessage)) {
      response = this.handleFavoritesQuestion(lowerMessage);
    } else if (this.isRecipeSearch(lowerMessage)) {
      response = this.handleRecipeSearch(lowerMessage);
    } else {
      response = this.handleUnknown(message);
    }

    // Store response in history
    this.conversationHistory.push({ role: 'assistant', content: response });

    // Hide loading and show response
    this.hideLoading();
    this.addMessage('assistant', response);
  },

  // Intent detection methods
  isGreeting(msg) {
    return /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)/i.test(msg);
  },

  isRecipeSearch(msg) {
    return /(what|which|show|find|search|looking for|have|got).*(recipe|dish|food|meal)/i.test(msg) ||
           /recipe.*(from|for|with)/i.test(msg) ||
           /(from|recipes from)\s*(italy|india|japan|mexico|syria)/i.test(msg);
  },

  isAskingHowToMake(msg) {
    return /(how\s*(do|can|to|should)\s*(i|we|you)?\s*(make|cook|prepare|create))/i.test(msg) ||
           /(give|show|tell)\s*(me)?\s*(the)?\s*(steps|instructions|recipe)/i.test(msg) ||
           /(steps|instructions)\s*(for|to)/i.test(msg);
  },

  isAskingAboutIngredients(msg) {
    return /(what|which).*(ingredients?|need|require)/i.test(msg) ||
           /(ingredients?|what.*(need|use|require))/i.test(msg);
  },

  isAskingAboutNutrition(msg) {
    return /(nutrition|calories|protein|carbs|fat|health|healthy|benefits|kcal|how many calories)/i.test(msg);
  },

  isAskingAboutDietaryInfo(msg) {
    // Asking if a specific recipe is gluten-free, vegan, etc.
    return /(is (this|it|the)?.*(gluten.free|vegan|vegetarian|dairy.free|healthy))|(how many calories)/i.test(msg);
  },

  isAskingAboutTime(msg) {
    return /(how\s*long|time|minutes|hours|duration)/i.test(msg);
  },

  isAskingForTips(msg) {
    return /(tips?|tricks?|advice|suggestions?|secrets?|better)/i.test(msg);
  },

  isFollowUp(msg) {
    return /^(and|also|what about|how about|can i|can you|it|this|that)/i.test(msg) && 
           this.currentRecipe !== null;
  },

  isAskingAboutSubstitutions(msg) {
    return /(substitute|replacement|replace|alternative|instead of|don't have|without)/i.test(msg);
  },

  isAskingAboutDietary(msg) {
    return /(vegan|vegetarian|gluten.free|dairy.free|keto|low.carb|halal|kosher|high.protein)/i.test(msg);
  },

  isAskingAboutMealType(msg) {
    return /(breakfast|lunch|dinner|appetizer|dessert|drink|snack)/i.test(msg);
  },

  isAskingAboutFavorites(msg) {
    return /(favorite|saved|my recipes|bookmarked)/i.test(msg);
  },

  // Response handlers
  handleGreeting() {
    const greetings = [
      "Hello! 👋 What recipe would you like help with today?",
      "Hi there! I'm ready to help you cook something delicious. What would you like to make?",
      "Hey! Looking for a recipe or cooking tips? Just ask!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  },

  /**
   * Generate recipe link URL
   */
  getRecipeLink(slug) {
    return `${RecipeBank.CONFIG.basePath}/public/recipes/recipe.html?slug=${slug}`;
  },

  handleRecipeSearch(msg) {
    // Check for country-specific search
    const countryMatch = msg.match(/(italy|italian|india|indian|japan|japanese|mexico|mexican|syria|syrian|france|french|thailand|thai|morocco|moroccan|lebanon|lebanese|china|chinese|greece|greek|spain|spanish|turkey|turkish|korea|korean|vietnam|vietnamese|brazil|brazilian|ethiopia|ethiopian|peru|peruvian|indonesia|indonesian|egypt|egyptian)/i);
    
    let searchResults;
    if (countryMatch) {
      const countryMap = {
        'italy': 'italy', 'italian': 'italy',
        'india': 'india', 'indian': 'india',
        'japan': 'japan', 'japanese': 'japan',
        'mexico': 'mexico', 'mexican': 'mexico',
        'syria': 'syria', 'syrian': 'syria',
        'france': 'france', 'french': 'france',
        'thailand': 'thailand', 'thai': 'thailand',
        'morocco': 'morocco', 'moroccan': 'morocco',
        'lebanon': 'lebanon', 'lebanese': 'lebanon',
        'china': 'china', 'chinese': 'china',
        'greece': 'greece', 'greek': 'greece',
        'spain': 'spain', 'spanish': 'spain',
        'turkey': 'turkey', 'turkish': 'turkey',
        'korea': 'korea', 'korean': 'korea',
        'vietnam': 'vietnam', 'vietnamese': 'vietnam',
        'brazil': 'brazil', 'brazilian': 'brazil',
        'ethiopia': 'ethiopia', 'ethiopian': 'ethiopia',
        'peru': 'peru', 'peruvian': 'peru',
        'indonesia': 'indonesia', 'indonesian': 'indonesia',
        'egypt': 'egypt', 'egyptian': 'egypt'
      };
      const country = countryMap[countryMatch[1].toLowerCase()];
      searchResults = RecipeSearch.getByCountry(this.allRecipes, country);
    } else {
      // General search using the query
      searchResults = RecipeSearch.search(this.allRecipes, msg);
    }

    if (searchResults.length === 0) {
      return "I couldn't find any recipes matching that. Try searching by country (Italy, France, India, Japan, Mexico, etc.) or by ingredients like 'chicken', 'pasta', or 'vegetarian'.";
    }

    let response = `I found ${searchResults.length} recipe${searchResults.length > 1 ? 's' : ''} for you:\n\n`;
    
    searchResults.slice(0, 5).forEach((recipe, index) => {
      const isFav = Favorites.isFavorite(recipe.slug);
      const favIcon = isFav ? ' ❤️' : '';
      const dietary = recipe.dietaryStyle && recipe.dietaryStyle !== 'None' ? ` • ${recipe.dietaryStyle}` : '';
      const link = this.getRecipeLink(recipe.slug);
      response += `[RECIPE_CARD:${recipe.slug}:${recipe.name_en}${favIcon}:${recipe.country}:${recipe.mealType}${dietary}:${(recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0)} min]\n`;
    });

    response += '\nClick on any recipe to view the full instructions, or ask "How do I make [recipe name]?"';
    
    return response;
  },

  handleHowToMake(msg) {
    // Try to extract recipe name from message
    let recipeName = msg.replace(/(how\s*(do|can|to|should)\s*(i|we|you)?\s*(make|cook|prepare|create)|give|show|tell|me|the|steps|instructions|for|to|recipe|\?)/gi, '').trim();
    
    // Try to find the recipe
    let recipe = RecipeSearch.findByName(this.allRecipes, recipeName);
    
    // If not found, try current context
    if (!recipe && this.currentRecipe) {
      recipe = this.currentRecipe;
    }

    if (!recipe) {
      // Try fuzzy search
      const results = RecipeSearch.search(this.allRecipes, recipeName);
      if (results.length > 0) {
        recipe = results[0];
      }
    }

    if (!recipe) {
      return `I couldn't find a recipe for "${recipeName}". Try asking about one of our recipes like Butter Chicken, Margherita Pizza, or Teriyaki Salmon.`;
    }

    // Set current recipe for follow-up questions
    this.currentRecipe = recipe;
    
    const recipeLink = this.getRecipeLink(recipe.slug);
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);

    let response = `## ${recipe.name_en}\n\n`;
    response += `**${recipe.short_description}**\n\n`;
    
    // Recipe quick info badges
    response += `🌍 ${recipe.country} • ⏱️ Prep: ${recipe.prep_time_minutes} min • 🔥 Cook: ${recipe.cooking_time_minutes} min • ⏰ Total: ${totalTime} min • 🍽️ ${recipe.servings} servings\n\n`;
    
    response += `### Ingredients:\n`;
    recipe.ingredients.forEach(ing => {
      response += `• ${ing.amount} ${ing.unit} ${ing.name}\n`;
    });
    
    response += `\n### Step-by-Step Instructions:\n`;
    recipe.steps.forEach((step, index) => {
      // Format each step as a numbered item with the full text
      response += `**${index + 1}.** ${step}\n\n`;
    });

    // Add nutritional breakdown
    if (recipe.nutrition) {
      response += `### Nutritional Breakdown (per serving):\n`;
      response += `• 🔥 ${recipe.nutrition.per_serving_kcal} calories\n`;
      response += `• 🥩 ${recipe.nutrition.protein_g}g protein\n`;
      response += `• 🍞 ${recipe.nutrition.carbs_g}g carbs\n`;
      response += `• 🧈 ${recipe.nutrition.fat_g}g fat\n`;
    }

    if (Favorites.isFavorite(recipe.slug)) {
      response += `\n❤️ *This recipe is in your favorites!*`;
    }

    response += `\n\n[RECIPE_LINK:${recipe.slug}:View full recipe page →]`;
    response += `\n\nWant cooking tips or more details? Just ask!`;
    
    return response;
  },

  /**
   * Extract a short title from a step instruction
   * Returns a preview of the step for the numbered header
   */
  getStepTitle(step) {
    if (!step || step.length <= 40) return step;
    
    // Extract first few words as preview
    const words = step.split(/\s+/).slice(0, 4);
    return words.join(' ') + '...';
  },

  handleIngredientQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg);
    
    if (!recipe) {
      if (this.currentRecipe) {
        return this.formatIngredients(this.currentRecipe);
      }
      return "Which recipe would you like the ingredients for? Try asking 'What ingredients do I need for butter chicken?'";
    }

    this.currentRecipe = recipe;
    return this.formatIngredients(recipe);
  },

  formatIngredients(recipe) {
    let response = `### Ingredients for ${recipe.name_en} (${recipe.servings} servings):\n\n`;
    recipe.ingredients.forEach(ing => {
      response += `• ${ing.amount} ${ing.unit} ${ing.name}\n`;
    });
    return response;
  },

  handleNutritionQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    
    if (!recipe) {
      return "Which recipe would you like nutrition info for? Try asking about a specific dish.";
    }

    this.currentRecipe = recipe;
    
    let response = `### Nutrition & Benefits - ${recipe.name_en}\n\n`;
    response += `**Per Serving:**\n`;
    response += `• 🔥 Calories: ${recipe.nutrition.per_serving_kcal} kcal\n`;
    response += `• 🥩 Protein: ${recipe.nutrition.protein_g}g\n`;
    response += `• 🧈 Fat: ${recipe.nutrition.fat_g}g\n`;
    response += `• 🍞 Carbs: ${recipe.nutrition.carbs_g}g\n\n`;
    response += `**Health Benefits:**\n${recipe.nutrition_benefits}`;
    
    return response;
  },

  handleDietaryInfoQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    
    if (!recipe) {
      return "Which recipe would you like dietary info for? Please specify the dish name.";
    }

    this.currentRecipe = recipe;
    
    let response = `### Dietary Information for ${recipe.name_en}\n\n`;
    
    // Check for gluten-free
    if (msg.includes('gluten')) {
      const isGlutenFree = recipe.dietaryStyle === 'Gluten Free';
      response += isGlutenFree 
        ? `✅ **Yes, ${recipe.name_en} is Gluten Free!**\n\n`
        : `❌ **${recipe.name_en} is not specifically Gluten Free.** It is classified as: ${recipe.dietaryStyle || 'None specified'}\n\n`;
    }
    
    // Check for vegan
    if (msg.includes('vegan')) {
      const isVegan = recipe.dietaryStyle === 'Vegan';
      response += isVegan 
        ? `✅ **Yes, ${recipe.name_en} is Vegan!**\n\n`
        : `❌ **${recipe.name_en} is not Vegan.** It is classified as: ${recipe.dietaryStyle || 'None specified'}\n\n`;
    }
    
    // Check for vegetarian
    if (msg.includes('vegetarian')) {
      const isVegetarian = recipe.dietaryStyle === 'Vegetarian' || recipe.dietaryStyle === 'Vegan';
      response += isVegetarian 
        ? `✅ **Yes, ${recipe.name_en} is Vegetarian!**\n\n`
        : `❌ **${recipe.name_en} is not Vegetarian.** It is classified as: ${recipe.dietaryStyle || 'None specified'}\n\n`;
    }
    
    // Check for dairy-free
    if (msg.includes('dairy')) {
      const isDairyFree = recipe.dietaryStyle === 'Dairy Free' || recipe.dietaryStyle === 'Vegan';
      response += isDairyFree 
        ? `✅ **Yes, ${recipe.name_en} is Dairy Free!**\n\n`
        : `❌ **${recipe.name_en} is not specifically Dairy Free.** It is classified as: ${recipe.dietaryStyle || 'None specified'}\n\n`;
    }
    
    // Add calories if asking about that
    if (msg.includes('calorie') || msg.includes('calories') || msg.includes('kcal')) {
      response += `🔥 **Calories:** ${recipe.nutrition.per_serving_kcal} kcal per serving\n\n`;
    }
    
    // Add general dietary info
    response += `**Classification:** ${recipe.mealType} • ${recipe.dietaryStyle}\n`;
    response += `**Per Serving:** ${recipe.nutrition.per_serving_kcal} kcal, ${recipe.nutrition.protein_g}g protein\n\n`;
    
    response += `[RECIPE_LINK:${recipe.slug}:View full recipe →]`;
    
    return response;
  },

  handleTimeQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    
    if (!recipe) {
      return "Which recipe would you like to know the time for?";
    }

    this.currentRecipe = recipe;
    const totalTime = recipe.prep_time_minutes + recipe.cooking_time_minutes;
    
    return `**${recipe.name_en}** timing:\n\n` +
           `• 🥣 Prep time: ${recipe.prep_time_minutes} minutes\n` +
           `• 🔥 Cook time: ${recipe.cooking_time_minutes} minutes\n` +
           `• ⏱️ Total time: ${totalTime} minutes\n\n` +
           `Difficulty: ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}`;
  },

  handleTipsQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    
    if (!recipe) {
      return "Which recipe would you like tips for?";
    }

    this.currentRecipe = recipe;
    
    if (!recipe.cooking_tips || recipe.cooking_tips.length === 0) {
      return `I don't have specific tips for ${recipe.name_en}, but feel free to ask about substitutions or technique!`;
    }

    let response = `### Cooking Tips for ${recipe.name_en}:\n\n`;
    recipe.cooking_tips.forEach((tip, index) => {
      response += `💡 ${tip}\n\n`;
    });
    
    return response;
  },

  handleFollowUp(msg) {
    if (!this.currentRecipe) {
      return "I'm not sure which recipe you're asking about. Could you specify the recipe name?";
    }

    // Re-route to appropriate handler based on follow-up content
    if (this.isAskingAboutIngredients(msg)) {
      return this.formatIngredients(this.currentRecipe);
    }
    if (this.isAskingAboutNutrition(msg)) {
      return this.handleNutritionQuestion(msg);
    }
    if (this.isAskingAboutTime(msg)) {
      return this.handleTimeQuestion(msg);
    }
    if (this.isAskingForTips(msg)) {
      return this.handleTipsQuestion(msg);
    }
    if (this.isAskingAboutSubstitutions(msg)) {
      return this.handleSubstitutionQuestion(msg);
    }
    if (this.isAskingAboutDietary(msg)) {
      return this.handleDietaryQuestion(msg);
    }

    return `I'm not sure what you mean. For ${this.currentRecipe.name_en}, you can ask about ingredients, nutrition, cooking tips, or time required.`;
  },

  handleSubstitutionQuestion(msg) {
    const recipe = this.findRecipeFromMessage(msg) || this.currentRecipe;
    
    // Common substitution suggestions
    const substitutions = {
      'butter': 'olive oil, coconut oil, or vegan butter',
      'cream': 'coconut cream, cashew cream, or Greek yogurt',
      'milk': 'almond milk, oat milk, or coconut milk',
      'eggs': 'flax eggs (1 tbsp flaxseed + 3 tbsp water per egg)',
      'cheese': 'nutritional yeast or vegan cheese',
      'meat': 'tofu, tempeh, seitan, or mushrooms',
      'chicken': 'tofu, chickpeas, or cauliflower',
      'beef': 'portobello mushrooms or lentils',
      'pork': 'jackfruit or extra-firm tofu',
      'fish': 'hearts of palm or marinated tofu',
      'flour': 'almond flour, coconut flour, or gluten-free flour blend',
      'soy sauce': 'tamari (gluten-free) or coconut aminos',
      'pasta': 'zucchini noodles, rice noodles, or gluten-free pasta'
    };

    let response = `### Common Ingredient Substitutions:\n\n`;
    
    // Check if asking about specific ingredient
    for (const [ingredient, subs] of Object.entries(substitutions)) {
      if (msg.toLowerCase().includes(ingredient)) {
        response = `**${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}** can be substituted with:\n\n`;
        response += `→ ${subs}\n\n`;
        if (recipe) {
          response += `For ${recipe.name_en}, this substitution should work well. Just note it may slightly change the final taste and texture.`;
        }
        return response;
      }
    }

    // General substitution info
    for (const [ingredient, subs] of Object.entries(substitutions)) {
      response += `• **${ingredient}** → ${subs}\n`;
    }
    
    response += `\nNeed a specific substitution? Just ask! Example: "What can I use instead of butter?"`;
    
    return response;
  },

  handleMealTypeQuestion(msg) {
    const mealTypes = {
      'breakfast': 'Breakfast',
      'brunch': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'supper': 'Dinner',
      'appetizer': 'Appetizer',
      'starter': 'Appetizer',
      'snack': 'Appetizer',
      'dessert': 'Dessert',
      'sweet': 'Dessert',
      'drink': 'Drink',
      'beverage': 'Drink'
    };

    let mealType = null;
    for (const [keyword, type] of Object.entries(mealTypes)) {
      if (msg.toLowerCase().includes(keyword)) {
        mealType = type;
        break;
      }
    }

    if (mealType) {
      const recipes = this.allRecipes.filter(r => r.mealType === mealType);
      if (recipes.length > 0) {
        let response = `Here are ${mealType.toLowerCase()} recipes:\n\n`;
        recipes.slice(0, 8).forEach((r) => {
          const isFav = Favorites.isFavorite(r.slug);
          const favIcon = isFav ? ' ❤️' : '';
          const dietary = r.dietaryStyle && r.dietaryStyle !== 'None' ? ` • ${r.dietaryStyle}` : '';
          const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
          response += `[RECIPE_CARD:${r.slug}:${r.name_en}${favIcon}:${r.country}:${mealType}${dietary}:${time} min]\n`;
        });
        if (recipes.length > 8) {
          response += `\n...and ${recipes.length - 8} more!\n`;
        }
        response += `\nClick any recipe for full details!`;
        return response;
      }
      return `I don't have any ${mealType.toLowerCase()} recipes at the moment.`;
    }

    return "I can help you find recipes for breakfast, lunch, dinner, appetizers, desserts, or drinks. What are you looking for?";
  },

  handleDietaryQuestion(msg) {
    const dietaryStyles = {
      'vegan': 'Vegan',
      'vegetarian': 'Vegetarian',
      'gluten-free': 'Gluten Free',
      'gluten free': 'Gluten Free',
      'dairy-free': 'Dairy Free',
      'dairy free': 'Dairy Free',
      'high-protein': 'High Protein',
      'high protein': 'High Protein',
      'low-carb': 'Low Carb',
      'low carb': 'Low Carb',
      'keto': 'Low Carb'
    };

    let dietaryStyle = null;
    for (const [keyword, style] of Object.entries(dietaryStyles)) {
      if (msg.toLowerCase().includes(keyword)) {
        dietaryStyle = style;
        break;
      }
    }

    if (dietaryStyle) {
      const recipes = this.allRecipes.filter(r => r.dietaryStyle === dietaryStyle);
      if (recipes.length > 0) {
        let response = `Here are ${dietaryStyle.toLowerCase()} recipes:\n\n`;
        recipes.slice(0, 8).forEach((r) => {
          const isFav = Favorites.isFavorite(r.slug);
          const favIcon = isFav ? ' ❤️' : '';
          const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
          response += `[RECIPE_CARD:${r.slug}:${r.name_en}${favIcon}:${r.country}:${r.mealType}:${time} min]\n`;
        });
        if (recipes.length > 8) {
          response += `\n...and ${recipes.length - 8} more!\n`;
        }
        response += `\nClick any recipe for full details!`;
        return response;
      }
      return `I don't have any ${dietaryStyle.toLowerCase()} recipes at the moment, but you can adapt many recipes with ingredient substitutions!`;
    }

    return "I can help you find Vegan, Vegetarian, Gluten Free, Dairy Free, High Protein, or Low Carb recipes. What dietary preference are you looking for?";
  },

  handleFavoritesQuestion(msg) {
    const favorites = Favorites.getAll();
    
    if (favorites.length === 0) {
      return "You don't have any saved recipes yet! Browse our recipes and click the ❤️ icon to save your favorites.";
    }

    const favoriteRecipes = this.allRecipes.filter(r => favorites.includes(r.slug));
    
    let response = `### Your Favorite Recipes (${favoriteRecipes.length}):\n\n`;
    favoriteRecipes.forEach((r) => {
      const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
      const dietary = r.dietaryStyle && r.dietaryStyle !== 'None' ? ` • ${r.dietaryStyle}` : '';
      response += `[RECIPE_CARD:${r.slug}:${r.name_en} ❤️:${r.country}:${r.mealType}${dietary}:${time} min]\n`;
    });
    
    response += `\nClick any recipe for full details!`;
    
    return response;
  },

  handleUnknown(msg) {
    // Try to find any matching recipe
    const results = RecipeSearch.search(this.allRecipes, msg);
    
    if (results.length > 0) {
      this.currentRecipe = results[0];
      const r = results[0];
      const time = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
      const dietary = r.dietaryStyle && r.dietaryStyle !== 'None' ? ` • ${r.dietaryStyle}` : '';
      return `I found a recipe that might be what you're looking for:\n\n` +
             `[RECIPE_CARD:${r.slug}:${r.name_en}:${r.country}:${r.mealType}${dietary}:${time} min]\n\n` +
             `Would you like the full instructions? Just ask "How do I make ${r.name_en}?"`;
    }

    // Provide a friendly clarification message
    return `### 🤔 I'm not quite sure what you're looking for!

No worries, I'm here to help! Here are some things you can ask me:

**🔍 Find Recipes:**
• "What recipes do you have from Italy?"
• "Show me Japanese dinner recipes"
• "Find me something with chicken"

**📝 Get Cooking Help:**
• "How do I make butter chicken?"
• "What are the ingredients for carbonara?"
• "Give me cooking tips for risotto"

**🥗 Nutrition & Dietary:**
• "What's the nutrition info for pad thai?"
• "Show me vegetarian recipes"
• "Find gluten-free options"

**🔄 Substitutions:**
• "What can I use instead of butter?"
• "Substitute for cream?"

Just rephrase your question and I'll do my best to help!`;
  },

  /**
   * Find recipe from message content
   */
  findRecipeFromMessage(msg) {
    // Try to find recipe name in message
    const results = RecipeSearch.search(this.allRecipes, msg);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Add a message to the chat
   * @param {string} role - 'user', 'assistant', or 'system'
   * @param {string} content - Message content (supports markdown-like formatting)
   */
  addMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = this.formatMessage(content);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  /**
   * Format message content (simple markdown-like)
   */
  formatMessage(content) {
    return content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/###\s*(.+)/g, '<h4>$1</h4>')
      // Parse recipe links [RECIPE_LINK:slug:text]
      .replace(/\[RECIPE_LINK:([^:]+):([^\]]+)\]/g, (match, slug, text) => {
        const link = `${RecipeBank.CONFIG.basePath}/public/recipes/recipe.html?slug=${slug}`;
        return `<a href="${link}" class="recipe-link">${text}</a>`;
      })
      // Parse recipe cards [RECIPE_CARD:slug:name:country:mealType:time]
      .replace(/\[RECIPE_CARD:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]/g, (match, slug, name, country, mealType, time) => {
        const link = `${RecipeBank.CONFIG.basePath}/public/recipes/recipe.html?slug=${slug}`;
        return `<a href="${link}" class="recipe-card-inline"><span class="recipe-name">${name}</span><div class="recipe-meta">🌍 ${country} • 🍽️ ${mealType} • ⏱️ ${time}</div></a>`;
      })
      .replace(/##\s*(.+)/g, '<h3>$1</h3>')
      .replace(/•\s*(.+)/g, '<span class="list-item">• $1</span>')
      .replace(/(\d+)\.\s+(.+)/g, '<span class="numbered-item">$1. $2</span>')
      .replace(/→\s*(.+)/g, '<span class="arrow-item">→ $1</span>')
      .replace(/💡\s*(.+)/g, '<span class="tip-item">💡 $1</span>')
      .replace(/\n/g, '<br>');
  },

  /**
   * Show loading indicator
   */
  showLoading() {
    this.isLoading = true;
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message assistant-message loading-message';
    loadingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-bubble">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.isLoading = false;
    const loadingMessage = document.querySelector('.loading-message');
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }
};

// Export for use in other modules
window.AIAssistant = AIAssistant;
