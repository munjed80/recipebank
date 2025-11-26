/**
 * RecipeBank - Recipe Detail Module
 * Handles rendering single recipe from JSON with modern UI
 */

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Recipe Rating System - localStorage based
 */
const RecipeRating = {
  storageKey: 'recipebank_ratings',

  getRatings() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch {
      return {};
    }
  },

  getRating(slug) {
    const ratings = this.getRatings();
    return ratings[slug] || 0;
  },

  setRating(slug, rating) {
    const ratings = this.getRatings();
    ratings[slug] = rating;
    localStorage.setItem(this.storageKey, JSON.stringify(ratings));
  }
};

/**
 * Detect allergens from ingredients
 */
function detectAllergens(ingredients) {
  const allergens = {
    gluten: false,
    dairy: false,
    eggs: false,
    nuts: false,
    shellfish: false,
    soy: false
  };

  const glutenKeywords = ['flour', 'wheat', 'bread', 'pasta', 'noodle', 'barley', 'rye', 'semolina', 'couscous'];
  const dairyKeywords = ['milk', 'cheese', 'cream', 'butter', 'yogurt', 'mozzarella', 'parmesan', 'pecorino', 'ricotta', 'ghee', 'paneer'];
  const eggKeywords = ['egg', 'yolk', 'whites'];
  const nutKeywords = ['almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'hazelnut', 'pine nut', 'nut'];
  const shellfishKeywords = ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'squid', 'shellfish'];
  const soyKeywords = ['soy', 'tofu', 'tempeh', 'miso', 'edamame'];

  ingredients.forEach(ing => {
    const name = ing.name.toLowerCase();
    if (glutenKeywords.some(kw => name.includes(kw))) allergens.gluten = true;
    if (dairyKeywords.some(kw => name.includes(kw))) allergens.dairy = true;
    if (eggKeywords.some(kw => name.includes(kw))) allergens.eggs = true;
    if (nutKeywords.some(kw => name.includes(kw))) allergens.nuts = true;
    if (shellfishKeywords.some(kw => name.includes(kw))) allergens.shellfish = true;
    if (soyKeywords.some(kw => name.includes(kw))) allergens.soy = true;
  });

  return allergens;
}

/**
 * Generate allergen badges HTML
 */
function generateAllergenBadges(ingredients, dietaryStyle) {
  const allergens = detectAllergens(ingredients);
  const badges = [];

  // Dietary badges
  if (dietaryStyle) {
    const style = dietaryStyle.toLowerCase();
    if (style.includes('vegan')) {
      badges.push('<span class="allergen-badge vegan">🌱 Vegan</span>');
    } else if (style.includes('vegetarian')) {
      badges.push('<span class="allergen-badge vegetarian">🥬 Vegetarian</span>');
    }
  }

  // Allergen badges
  if (!allergens.gluten) {
    badges.push('<span class="allergen-badge gluten-free">🌾 Gluten-Free</span>');
  } else {
    badges.push('<span class="allergen-badge contains-gluten">⚠️ Contains Gluten</span>');
  }

  if (allergens.dairy) {
    badges.push('<span class="allergen-badge contains-dairy">🥛 Contains Dairy</span>');
  }

  if (allergens.eggs) {
    badges.push('<span class="allergen-badge contains-eggs">🥚 Contains Eggs</span>');
  }

  if (allergens.nuts) {
    badges.push('<span class="allergen-badge contains-nuts">🥜 Contains Nuts</span>');
  }

  if (allergens.shellfish) {
    badges.push('<span class="allergen-badge contains-shellfish">🦐 Contains Shellfish</span>');
  }

  return badges.join('');
}

/**
 * Generate rating stars HTML
 */
function generateRatingStars(slug) {
  const currentRating = RecipeRating.getRating(slug);
  let starsHtml = '';
  
  for (let i = 1; i <= 5; i++) {
    const filled = i <= currentRating ? 'filled' : '';
    starsHtml += `<button class="star-btn ${filled}" data-rating="${i}" aria-label="Rate ${i} stars">★</button>`;
  }

  return `
    <div class="recipe-rating-interactive" data-slug="${escapeHtml(slug)}">
      <div class="rating-stars">${starsHtml}</div>
      <span class="rating-label">${currentRating > 0 ? `Your rating: ${currentRating}/5` : 'Rate this recipe'}</span>
    </div>
  `;
}

/**
 * Initialize rating system
 */
function initRatingSystem(slug) {
  const ratingContainer = document.querySelector('.recipe-rating-interactive');
  if (!ratingContainer) return;

  const stars = ratingContainer.querySelectorAll('.star-btn');
  const label = ratingContainer.querySelector('.rating-label');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      RecipeRating.setRating(slug, rating);
      
      // Update UI
      stars.forEach((s, index) => {
        s.classList.toggle('filled', index < rating);
      });
      label.textContent = `Your rating: ${rating}/5`;
    });

    // Hover effects
    star.addEventListener('mouseenter', () => {
      const rating = parseInt(star.dataset.rating);
      stars.forEach((s, index) => {
        s.classList.toggle('hover', index < rating);
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });
  });
}

/**
 * Initialize recipe detail page
 */
async function initRecipeDetail() {
  const container = document.getElementById('recipe-container');
  const slug = getRecipeSlugFromUrl();
  
  if (!container || !slug) {
    console.error('Missing container or recipe slug');
    return;
  }

  container.innerHTML = '<div class="loading">Loading recipe...</div>';

  try {
    const recipe = await RecipeBank.getRecipeBySlug(slug);
    
    if (!recipe) {
      container.innerHTML = `
        <div class="no-results">
          <p>Recipe not found.</p>
          <p><a href="${RecipeBank.CONFIG.basePath}/public/index.html">← Back to Home</a></p>
        </div>
      `;
      return;
    }

    renderRecipeModern(container, recipe);
    updatePageTitle(recipe.name_en);
    applyRecipeSEO(recipe);
    initFavoriteButton(recipe.slug);
    initPrintButton();
    initRatingSystem(recipe.slug);
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    container.innerHTML = `
      <div class="no-results">
        <p>Error loading recipe. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Get recipe identifier from URL query parameter
 * Supports both ?slug=xxx and ?id=xxx formats for backwards compatibility
 */
function getRecipeSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Support both 'slug' and 'id' parameters for backwards compatibility
  return params.get('slug') || params.get('id');
}

/**
 * Update page title and apply SEO
 */
function updatePageTitle(recipeName) {
  document.title = `${recipeName} | RecipeBank`;
}

/**
 * Apply SEO meta tags and structured data for the recipe
 */
function applyRecipeSEO(recipe) {
  if (window.SEO) {
    window.SEO.applyRecipeSEO(recipe);
  }
}

/**
 * Get difficulty class for styling
 */
function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case 'easy': return 'difficulty-easy';
    case 'medium': return 'difficulty-medium';
    case 'hard': return 'difficulty-hard';
    default: return '';
  }
}

/**
 * Calculate total time from prep and cooking time
 */
function getTotalTime(recipe) {
  const prepTime = recipe.prep_time_minutes || 0;
  const cookTime = recipe.cooking_time_minutes || 0;
  return prepTime + cookTime;
}

/**
 * Parse a step instruction to extract a bold title and explanation
 * If the step is a short phrase, use it as title only
 * If longer, extract a short title from the first few words
 */
function parseStepInstruction(step, index) {
  if (!step || step.length === 0) {
    return { title: `Step ${index + 1}`, explanation: '' };
  }
  
  // If step has a natural break (period, dash, colon in first part), split there
  const colonMatch = step.match(/^([^:]+):\s*(.+)$/);
  if (colonMatch) {
    return { title: colonMatch[1].trim(), explanation: colonMatch[2].trim() };
  }
  
  // If step is short (less than 40 chars), use whole thing as title
  if (step.length <= 40) {
    return { title: step, explanation: '' };
  }
  
  // For longer steps, create a short action title from first verb phrase
  // Extract first sentence or first 5-7 words as title
  const sentences = step.split(/\.\s+/);
  if (sentences.length > 1 && sentences[0].length <= 50) {
    return { title: sentences[0] + '.', explanation: sentences.slice(1).join('. ').trim() };
  }
  
  // Extract first few words as title (aim for action verb + object)
  const words = step.split(/\s+/);
  const titleWords = words.slice(0, Math.min(5, words.length));
  const title = titleWords.join(' ');
  const explanation = words.slice(titleWords.length).join(' ');
  
  // Add ellipsis if we split the sentence
  return { 
    title: title + (explanation ? '...' : ''), 
    explanation: explanation 
  };
}

/**
 * Render modern recipe layout
 */
function renderRecipeModern(container, recipe) {
  // Generate allergen badges
  const allergenBadgesHtml = generateAllergenBadges(recipe.ingredients, recipe.dietaryStyle);

  // Generate ingredients checklist HTML
  const ingredientsHtml = recipe.ingredients.map((ing, index) => `
    <li class="ingredient-item">
      <input type="checkbox" class="ingredient-checkbox" id="ing-${index}">
      <label class="ingredient-name" for="ing-${index}">${escapeHtml(ing.name)}</label>
      <span class="ingredient-amount">${escapeHtml(String(ing.amount))} ${escapeHtml(ing.unit)}</span>
    </li>
  `).join('');

  // Categorize steps into prep and cooking actions
  const prepKeywords = ['chop', 'dice', 'slice', 'mince', 'peel', 'wash', 'rinse', 'soak', 'marinate', 'mix', 'combine', 'whisk', 'beat', 'prepare', 'season', 'coat'];
  const cookKeywords = ['cook', 'fry', 'bake', 'roast', 'grill', 'boil', 'simmer', 'sauté', 'saute', 'steam', 'braise', 'broil', 'heat', 'preheat'];

  // Generate steps cards HTML with icons and action type
  const stepsHtml = recipe.steps.map((step, index) => {
    const { title, explanation } = parseStepInstruction(step, index);
    const stepLower = step.toLowerCase();
    
    let actionType = 'general';
    let actionIcon = '📋';
    
    if (prepKeywords.some(kw => stepLower.includes(kw))) {
      actionType = 'prep';
      actionIcon = '🔪';
    } else if (cookKeywords.some(kw => stepLower.includes(kw))) {
      actionType = 'cook';
      actionIcon = '🔥';
    }
    
    return `
      <li class="step-card step-${actionType}">
        <div class="step-number">
          <span class="step-action-icon">${actionIcon}</span>
          ${index + 1}
        </div>
        <div class="step-content">
          <span class="step-type-badge ${actionType}">${actionType === 'prep' ? 'Preparation' : actionType === 'cook' ? 'Cooking' : 'Action'}</span>
          <strong class="step-title">${escapeHtml(title)}</strong>
          ${explanation ? `<span class="step-explanation">${escapeHtml(explanation)}</span>` : ''}
        </div>
      </li>
    `;
  }).join('');

  // Generate tag pills HTML
  const tagsHtml = recipe.tags.map(tag => 
    `<a href="#" class="tag-pill" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</a>`
  ).join('');

  // Generate cooking tips HTML if available
  const cookingTipsHtml = recipe.cooking_tips && recipe.cooking_tips.length > 0 ? `
    <section class="cooking-tips-section">
      <h3 class="section-title-modern">
        <span class="icon">💡</span>
        Cooking Tips
      </h3>
      <ul class="cooking-tips-list">
        ${recipe.cooking_tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
      </ul>
    </section>
  ` : '';

  // Generate enhanced nutrition section with fiber and sugar (estimated if not available)
  const fiber = recipe.nutrition?.fiber_g || Math.round((recipe.nutrition?.carbs_g || 0) * 0.1);
  const sugar = recipe.nutrition?.sugar_g || Math.round((recipe.nutrition?.carbs_g || 0) * 0.15);

  const nutritionBenefitsHtml = recipe.nutrition ? `
    <section class="nutrition-section nutritional-breakdown">
      <h3 class="nutrition-title">
        <span class="icon">📊</span>
        Nutritional Information
        <span class="section-subtitle">(per serving)</span>
      </h3>
      <div class="nutrition-grid-enhanced">
        <div class="nutrition-item-modern calories-item highlight">
          <div class="nutrition-icon">🔥</div>
          <div class="nutrition-value-modern">${recipe.nutrition.per_serving_kcal}</div>
          <div class="nutrition-label-modern">Calories</div>
        </div>
        <div class="nutrition-item-modern protein-item">
          <div class="nutrition-icon">🥩</div>
          <div class="nutrition-value-modern">${recipe.nutrition.protein_g}g</div>
          <div class="nutrition-label-modern">Protein</div>
        </div>
        <div class="nutrition-item-modern carbs-item">
          <div class="nutrition-icon">🍞</div>
          <div class="nutrition-value-modern">${recipe.nutrition.carbs_g}g</div>
          <div class="nutrition-label-modern">Carbs</div>
        </div>
        <div class="nutrition-item-modern fat-item">
          <div class="nutrition-icon">🧈</div>
          <div class="nutrition-value-modern">${recipe.nutrition.fat_g}g</div>
          <div class="nutrition-label-modern">Fats</div>
        </div>
        <div class="nutrition-item-modern fiber-item">
          <div class="nutrition-icon">🌾</div>
          <div class="nutrition-value-modern">${fiber}g</div>
          <div class="nutrition-label-modern">Fiber</div>
        </div>
        <div class="nutrition-item-modern sugar-item">
          <div class="nutrition-icon">🍯</div>
          <div class="nutrition-value-modern">${sugar}g</div>
          <div class="nutrition-label-modern">Sugar</div>
        </div>
      </div>
      ${recipe.nutrition_benefits ? `
        <div class="nutrition-benefits">
          <h4 class="benefits-title">
            <span class="icon">🌿</span>
            Health Benefits Summary
          </h4>
          <p class="benefits-text">${escapeHtml(recipe.nutrition_benefits)}</p>
        </div>
      ` : ''}
    </section>
  ` : '';

  // Calculate times
  const prepTime = recipe.prep_time_minutes || 0;
  const cookTime = recipe.cooking_time_minutes || 0;
  const totalTime = getTotalTime(recipe);
  const servings = recipe.servings || 4;

  // Generate rating stars
  const ratingHtml = generateRatingStars(recipe.slug);

  container.classList.add('recipe-page');
  container.innerHTML = `
    <!-- Action Buttons Bar -->
    <div class="recipe-actions-bar">
      <a href="${RecipeBank.CONFIG.basePath}/public/countries/${escapeHtml(recipe.country_slug)}.html" class="recipe-action-btn">
        <span class="icon">←</span>
        <span>Back to ${escapeHtml(recipe.country)} Recipes</span>
      </a>
      <button type="button" id="btn-print-recipe" class="recipe-action-btn">
        <span class="icon">🖨️</span>
        <span>Print</span>
      </button>
      <button type="button" id="btn-save-favorite" class="recipe-action-btn btn-primary">
        <span class="icon">🤍</span>
        <span>Save</span>
      </button>
    </div>

    <!-- Print Area -->
    <div class="recipe-print-area">
      <!-- Hero Image -->
      <div class="recipe-hero-image" role="img" aria-label="${escapeHtml(recipe.name_en)} - ${escapeHtml(recipe.country)} dish">
        <div class="recipe-hero-placeholder" aria-hidden="true">🍽️</div>
      </div>

      <!-- Recipe Header -->
      <header class="recipe-header-modern">
        <div class="recipe-header-content">
          <h1 class="recipe-title-modern">${escapeHtml(recipe.name_en)}</h1>
          
          <!-- Classification Badges -->
          <div class="recipe-classification">
            ${RecipeBank.getClassificationBadges(recipe).mealTypeBadge}
            ${RecipeBank.getClassificationBadges(recipe).dietaryBadge}
          </div>
          
          <!-- Interactive Rating Stars -->
          ${ratingHtml}

          <!-- Allergen & Dietary Badges -->
          <div class="allergen-badges-container">
            ${allergenBadgesHtml}
          </div>

          <!-- Meta Pills -->
          <div class="recipe-meta-pills">
            <span class="meta-pill">
              <span class="icon">${RecipeBank.getCountryFlag(recipe.country_slug)}</span>
              ${escapeHtml(recipe.country)}
            </span>
            <span class="meta-pill prep-time">
              <span class="icon">🔪</span>
              Prep: ${RecipeBank.formatTime(prepTime)}
            </span>
            <span class="meta-pill cook-time">
              <span class="icon">🔥</span>
              Cook: ${RecipeBank.formatTime(cookTime)}
            </span>
            <span class="meta-pill total-time">
              <span class="icon">⏱️</span>
              Total: ${RecipeBank.formatTime(totalTime)}
            </span>
            <span class="meta-pill ${getDifficultyClass(recipe.difficulty)}">
              <span class="icon">📊</span>
              ${escapeHtml(recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1))}
            </span>
            <span class="meta-pill">
              <span class="icon">🍽️</span>
              ${servings} servings
            </span>
          </div>

          <!-- Tag Pills -->
          <div class="recipe-tags-modern">
            ${tagsHtml}
          </div>
        </div>
      </header>

      <!-- Description -->
      <div class="recipe-main-content">
        <p class="recipe-description-modern">${escapeHtml(recipe.short_description)}</p>

        <!-- Two Column Layout -->
        <div class="recipe-columns">
          <!-- Left Column: Ingredients -->
          <div class="ingredients-section">
            <h2 class="section-title-modern">
              <span class="icon">🥘</span>
              Ingredients
              <span class="section-subtitle">(${recipe.ingredients.length} items)</span>
            </h2>
            <ul class="ingredients-checklist">
              ${ingredientsHtml}
            </ul>
          </div>

          <!-- Right Column: Steps -->
          <div class="steps-section">
            <h2 class="section-title-modern">
              <span class="icon">👨‍🍳</span>
              Step-by-Step Instructions
              <span class="section-subtitle">(${recipe.steps.length} steps)</span>
            </h2>
            <div class="steps-legend">
              <span class="legend-item"><span class="legend-icon prep">🔪</span> Preparation</span>
              <span class="legend-item"><span class="legend-icon cook">🔥</span> Cooking</span>
            </div>
            <ol class="steps-list-modern">
              ${stepsHtml}
            </ol>
            ${cookingTipsHtml}
          </div>
        </div>
        
        <!-- Nutritional Breakdown (full-width below columns) -->
        ${nutritionBenefitsHtml}
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="recipe-footer-actions">
      <a href="${RecipeBank.CONFIG.basePath}/public/countries/${escapeHtml(recipe.country_slug)}.html" class="btn-back-country">
        <span class="icon">←</span>
        Back to ${escapeHtml(recipe.country)} Recipes
      </a>
    </div>
  `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recipe-container')) {
    initRecipeDetail();
  }
});

/**
 * Initialize favorite button after recipe is rendered
 */
function initFavoriteButton(slug) {
  const saveBtn = document.getElementById('btn-save-favorite');
  if (!saveBtn || !window.Favorites) return;

  const isFavorite = Favorites.isFavorite(slug);
  updateFavoriteButton(saveBtn, isFavorite);

  saveBtn.addEventListener('click', () => {
    const newStatus = Favorites.toggle(slug);
    updateFavoriteButton(saveBtn, newStatus);
  });
}

/**
 * Update favorite button appearance
 */
function updateFavoriteButton(btn, isFavorite) {
  const icon = btn.querySelector('.icon');
  const text = btn.querySelector('span:not(.icon)');
  
  if (isFavorite) {
    btn.classList.add('is-favorite');
    if (icon) icon.textContent = '❤️';
    if (text) text.textContent = 'Saved';
  } else {
    btn.classList.remove('is-favorite');
    if (icon) icon.textContent = '🤍';
    if (text) text.textContent = 'Save';
  }
}

/**
 * Initialize print button to only print recipe content
 * Note: CSS print media query in recipe.css hides non-recipe elements
 * and uses `.recipe-print-area` to isolate the printable content
 */
function initPrintButton() {
  const printBtn = document.getElementById('btn-print-recipe');
  if (!printBtn) return;
  
  printBtn.addEventListener('click', () => {
    window.print();
  });
}
