/**
 * RecipeBank - Countries Module
 * Handles loading and rendering country recipe lists
 */

/**
 * Initialize country page
 */
async function initCountryPage() {
  const container = document.getElementById('recipes-container');
  const countrySlug = getCountrySlugFromUrl();
  
  if (!container || !countrySlug) {
    console.error('Missing container or country slug');
    return;
  }

  container.innerHTML = '<div class="loading">Loading recipes...</div>';

  try {
    const recipes = await RecipeBank.getRecipesByCountry(countrySlug);
    
    if (recipes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <p>No recipes found for this country yet.</p>
          <p><a href="${RecipeBank.CONFIG.basePath}/public/index.html">← Back to Home</a></p>
        </div>
      `;
      return;
    }

    const recipesHtml = recipes.map(recipe => RecipeBank.createRecipeCard(recipe)).join('');
    container.innerHTML = `<div class="recipe-grid">${recipesHtml}</div>`;
    
  } catch (error) {
    console.error('Error loading country recipes:', error);
    container.innerHTML = `
      <div class="no-results">
        <p>Error loading recipes. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Get country slug from URL
 */
function getCountrySlugFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/countries\/(\w+)\.html/);
  return match ? match[1] : null;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recipes-container')) {
    initCountryPage();
  }
});
