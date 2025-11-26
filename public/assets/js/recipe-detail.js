/**
 * RecipeBank - Recipe Detail Module
 * Handles rendering single recipe from JSON
 */

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

    renderRecipe(container, recipe);
    updatePageTitle(recipe.name_en);
    
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
 * Get recipe slug from URL query parameter
 */
function getRecipeSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

/**
 * Update page title
 */
function updatePageTitle(recipeName) {
  document.title = `${recipeName} | RecipeBank`;
}

/**
 * Render recipe to container
 */
function renderRecipe(container, recipe) {
  const ingredientsHtml = recipe.ingredients.map(ing => `
    <li>
      <span class="ingredient-name">${ing.name}</span>
      <span class="ingredient-amount">${ing.amount} ${ing.unit}</span>
    </li>
  `).join('');

  const stepsHtml = recipe.steps.map(step => `<li>${step}</li>`).join('');

  const tagsHtml = recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

  const nutritionHtml = recipe.nutrition ? `
    <section class="recipe-section">
      <h2>🥗 Nutrition (per serving)</h2>
      <div class="nutrition-grid">
        <div class="nutrition-item">
          <div class="nutrition-value">${recipe.nutrition.per_serving_kcal}</div>
          <div class="nutrition-label">Calories</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">${recipe.nutrition.protein_g}g</div>
          <div class="nutrition-label">Protein</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">${recipe.nutrition.fat_g}g</div>
          <div class="nutrition-label">Fat</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">${recipe.nutrition.carbs_g}g</div>
          <div class="nutrition-label">Carbs</div>
        </div>
      </div>
    </section>
  ` : '';

  container.innerHTML = `
    <header class="recipe-header">
      <div class="recipe-header-content">
        <nav class="breadcrumb">
          <a href="${RecipeBank.CONFIG.basePath}/public/index.html">Home</a> → 
          <a href="${RecipeBank.CONFIG.basePath}/public/countries/${recipe.country_slug}.html">${recipe.country}</a> → 
          ${recipe.name_en}
        </nav>
        <h1 class="recipe-title">${recipe.name_en}</h1>
        <p class="recipe-local-name">${recipe.name_local}</p>
        <div class="recipe-meta">
          <span class="recipe-meta-item">
            ${RecipeBank.getCountryFlag(recipe.country_slug)} ${recipe.country}
          </span>
          <span class="recipe-meta-item">
            ⏱️ ${RecipeBank.formatTime(recipe.cooking_time_minutes)}
          </span>
          <span class="recipe-meta-item">
            📊 ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
          </span>
        </div>
      </div>
    </header>

    <main class="recipe-content">
      <div class="recipe-description">
        ${recipe.short_description}
      </div>

      <div class="recipe-card-tags mb-3">
        ${tagsHtml}
      </div>

      <section class="recipe-section">
        <h2>🥘 Ingredients</h2>
        <ul class="ingredients-list">
          ${ingredientsHtml}
        </ul>
      </section>

      <section class="recipe-section">
        <h2>👨‍🍳 Instructions</h2>
        <ol class="steps-list">
          ${stepsHtml}
        </ol>
      </section>

      ${nutritionHtml}

      <div class="text-center mt-3">
        <a href="${RecipeBank.CONFIG.basePath}/public/countries/${recipe.country_slug}.html" class="btn">
          ← More ${recipe.country} Recipes
        </a>
      </div>
    </main>
  `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recipe-container')) {
    initRecipeDetail();
  }
});
