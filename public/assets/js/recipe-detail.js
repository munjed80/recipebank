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
 * Get recipe slug/id from URL query parameter
 * Supports both ?slug=xxx and ?id=xxx formats
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
 * Render modern recipe layout
 */
function renderRecipeModern(container, recipe) {
  // Generate ingredients checklist HTML
  const ingredientsHtml = recipe.ingredients.map((ing, index) => `
    <li class="ingredient-item">
      <input type="checkbox" class="ingredient-checkbox" id="ing-${index}">
      <label class="ingredient-name" for="ing-${index}">${escapeHtml(ing.name)}</label>
      <span class="ingredient-amount">${escapeHtml(String(ing.amount))} ${escapeHtml(ing.unit)}</span>
    </li>
  `).join('');

  // Generate steps cards HTML
  const stepsHtml = recipe.steps.map((step, index) => `
    <li class="step-card">
      <div class="step-number">${index + 1}</div>
      <div class="step-content">${escapeHtml(step)}</div>
    </li>
  `).join('');

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

  // Generate nutrition and benefits section HTML
  const nutritionBenefitsHtml = recipe.nutrition ? `
    <section class="nutrition-section">
      <h3 class="nutrition-title">
        <span class="icon">📊</span>
        Nutrition Facts
        <span class="section-subtitle">(per serving)</span>
      </h3>
      <div class="nutrition-grid-modern">
        <div class="nutrition-item-modern">
          <div class="nutrition-icon">🔥</div>
          <div class="nutrition-value-modern">${recipe.nutrition.per_serving_kcal}</div>
          <div class="nutrition-label-modern">Calories</div>
        </div>
        <div class="nutrition-item-modern">
          <div class="nutrition-icon">🥩</div>
          <div class="nutrition-value-modern">${recipe.nutrition.protein_g}g</div>
          <div class="nutrition-label-modern">Protein</div>
        </div>
        <div class="nutrition-item-modern">
          <div class="nutrition-icon">🧈</div>
          <div class="nutrition-value-modern">${recipe.nutrition.fat_g}g</div>
          <div class="nutrition-label-modern">Fat</div>
        </div>
        <div class="nutrition-item-modern">
          <div class="nutrition-icon">🍞</div>
          <div class="nutrition-value-modern">${recipe.nutrition.carbs_g}g</div>
          <div class="nutrition-label-modern">Carbs</div>
        </div>
      </div>
      ${recipe.nutrition_benefits ? `
        <div class="nutrition-benefits">
          <h4 class="benefits-title">
            <span class="icon">🌿</span>
            Nutrition & Benefits
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
          
          <!-- Rating Stars Placeholder -->
          <div class="recipe-rating">
            <span class="stars">★★★★☆</span>
            <span class="rating-text">(Coming soon)</span>
          </div>

          <!-- Meta Pills -->
          <div class="recipe-meta-pills">
            <span class="meta-pill">
              <span class="icon">${RecipeBank.getCountryFlag(recipe.country_slug)}</span>
              ${escapeHtml(recipe.country)}
            </span>
            <span class="meta-pill">
              <span class="icon">🥣</span>
              Prep: ${RecipeBank.formatTime(prepTime)}
            </span>
            <span class="meta-pill">
              <span class="icon">🔥</span>
              Cook: ${RecipeBank.formatTime(cookTime)}
            </span>
            <span class="meta-pill">
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
            ${nutritionBenefitsHtml}
          </div>

          <!-- Right Column: Steps -->
          <div class="steps-section">
            <h2 class="section-title-modern">
              <span class="icon">👨‍🍳</span>
              Method
              <span class="section-subtitle">(${recipe.steps.length} steps)</span>
            </h2>
            <ol class="steps-list-modern">
              ${stepsHtml}
            </ol>
            ${cookingTipsHtml}
          </div>
        </div>
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
