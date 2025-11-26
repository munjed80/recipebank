/**
 * RecipeBank - Countries Module
 * Handles loading and rendering country recipe lists with search and filters
 * Uses shared utilities from main.js for country data
 */

/**
 * Store for all recipes on the current country page
 */
let countryRecipes = [];

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

  // Get country name from shared utility
  const countryName = RecipeBank.getCountryName(countrySlug);

  try {
    countryRecipes = await RecipeBank.getRecipesByCountry(countrySlug);
    
    // Apply SEO for country page
    if (window.SEO) {
      window.SEO.applyCountrySEO(countrySlug, countryName, countryRecipes.length);
    }
    
    if (countryRecipes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <p>No recipes found for this country yet.</p>
          <p><a href="${RecipeBank.CONFIG.basePath}/public/index.html">← Back to Home</a></p>
        </div>
      `;
      return;
    }

    // Render search/filter bar and recipes
    renderCountryContent(container, countryRecipes);
    
    // Initialize filter handlers
    initFilters();
    
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

/**
 * Get unique values from recipe tags
 */
function getUniqueTags(recipes) {
  const tagSet = new Set();
  recipes.forEach(recipe => {
    recipe.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Get difficulty levels from recipes
 */
function getDifficultyLevels(recipes) {
  const levels = new Set();
  recipes.forEach(recipe => levels.add(recipe.difficulty));
  return Array.from(levels);
}

/**
 * Get unique meal types from recipes
 */
function getUniqueMealTypes(recipes) {
  const types = new Set();
  recipes.forEach(recipe => {
    if (recipe.mealType) types.add(recipe.mealType);
  });
  return Array.from(types).sort();
}

/**
 * Get unique dietary styles from recipes
 */
function getUniqueDietaryStyles(recipes) {
  const styles = new Set();
  recipes.forEach(recipe => {
    if (recipe.dietaryStyle && recipe.dietaryStyle !== 'None') {
      styles.add(recipe.dietaryStyle);
    }
  });
  return Array.from(styles).sort();
}

/**
 * Render the full country content with search bar and recipes
 */
function renderCountryContent(container, recipes) {
  const difficulties = getDifficultyLevels(recipes);
  const mealTypes = getUniqueMealTypes(recipes);
  const dietaryStyles = getUniqueDietaryStyles(recipes);
  
  // Build difficulty options
  const difficultyOptions = difficulties.map(d => 
    `<option value="${d}">${d.charAt(0).toUpperCase() + d.slice(1)}</option>`
  ).join('');
  
  // Build meal type options
  const mealTypeOptions = mealTypes.map(m => 
    `<option value="${m}">${m}</option>`
  ).join('');
  
  // Build dietary style options
  const dietaryStyleOptions = dietaryStyles.map(s => 
    `<option value="${s}">${s}</option>`
  ).join('');

  const searchBarHtml = `
    <div class="recipe-filters">
      <div class="filter-row">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" 
                 id="recipe-search" 
                 class="recipe-search-input" 
                 placeholder="Search recipes by name...">
        </div>
        <div class="filter-group">
          <select id="difficulty-filter" class="filter-select">
            <option value="">All Difficulties</option>
            ${difficultyOptions}
          </select>
        </div>
        <div class="filter-group">
          <select id="meal-type-filter" class="filter-select">
            <option value="">All Meal Types</option>
            ${mealTypeOptions}
          </select>
        </div>
        <div class="filter-group">
          <select id="dietary-filter" class="filter-select">
            <option value="">All Dietary Styles</option>
            ${dietaryStyleOptions}
          </select>
        </div>
        <div class="filter-group">
          <select id="time-filter" class="filter-select">
            <option value="">Any Prep Time</option>
            <option value="quick">Quick (under 30 min)</option>
            <option value="medium">Medium (30-60 min)</option>
            <option value="long">Long (over 60 min)</option>
          </select>
        </div>
        <button type="button" id="clear-filters" class="clear-filters-btn">Clear Filters</button>
      </div>
      <div id="active-filters" class="active-filters"></div>
      <div id="results-count" class="results-count">Showing ${recipes.length} recipes</div>
    </div>
  `;

  const recipesHtml = recipes.map(recipe => RecipeBank.createRecipeCard(recipe)).join('');
  
  container.innerHTML = `
    ${searchBarHtml}
    <div id="recipe-grid" class="recipe-grid">${recipesHtml}</div>
  `;
}

/**
 * Initialize filter event handlers
 */
function initFilters() {
  const searchInput = document.getElementById('recipe-search');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const mealTypeFilter = document.getElementById('meal-type-filter');
  const dietaryFilter = document.getElementById('dietary-filter');
  const timeFilter = document.getElementById('time-filter');
  const clearBtn = document.getElementById('clear-filters');

  // Use shared debounce from main.js
  const debouncedApplyFilters = RecipeBank.debounce(applyFilters, 250);

  // Add event listeners
  if (searchInput) {
    searchInput.addEventListener('input', debouncedApplyFilters);
  }
  if (difficultyFilter) {
    difficultyFilter.addEventListener('change', applyFilters);
  }
  if (mealTypeFilter) {
    mealTypeFilter.addEventListener('change', applyFilters);
  }
  if (dietaryFilter) {
    dietaryFilter.addEventListener('change', applyFilters);
  }
  if (timeFilter) {
    timeFilter.addEventListener('change', applyFilters);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }
}

/**
 * Apply all filters and update the recipe grid
 */
function applyFilters() {
  const searchInput = document.getElementById('recipe-search');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const mealTypeFilter = document.getElementById('meal-type-filter');
  const dietaryFilter = document.getElementById('dietary-filter');
  const timeFilter = document.getElementById('time-filter');
  const recipeGrid = document.getElementById('recipe-grid');
  const resultsCount = document.getElementById('results-count');
  const activeFilters = document.getElementById('active-filters');

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const difficulty = difficultyFilter ? difficultyFilter.value : '';
  const mealType = mealTypeFilter ? mealTypeFilter.value : '';
  const dietary = dietaryFilter ? dietaryFilter.value : '';
  const time = timeFilter ? timeFilter.value : '';

  // Filter recipes
  let filteredRecipes = countryRecipes.filter(recipe => {
    // Search filter
    if (searchTerm && !recipe.name_en.toLowerCase().includes(searchTerm)) {
      return false;
    }

    // Difficulty filter
    if (difficulty && recipe.difficulty !== difficulty) {
      return false;
    }

    // Meal type filter (with null check)
    if (mealType && (!recipe.mealType || recipe.mealType !== mealType)) {
      return false;
    }

    // Dietary style filter (with null check)
    if (dietary && (!recipe.dietaryStyle || recipe.dietaryStyle !== dietary)) {
      return false;
    }

    // Time filter (quick: under 30 min, medium: 30-60 min inclusive, long: over 60 min)
    if (time) {
      const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
      switch (time) {
        case 'quick':
          if (totalTime >= 30) return false;
          break;
        case 'medium':
          if (totalTime < 30 || totalTime > 60) return false;
          break;
        case 'long':
          if (totalTime < 60) return false;
          break;
      }
    }

    return true;
  });

  // Update recipe grid
  if (recipeGrid) {
    if (filteredRecipes.length === 0) {
      recipeGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1;">
          <p>No recipes match your filters. Try adjusting your search criteria.</p>
        </div>
      `;
    } else {
      recipeGrid.innerHTML = filteredRecipes.map(recipe => RecipeBank.createRecipeCard(recipe)).join('');
    }
  }

  // Update results count
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredRecipes.length} of ${countryRecipes.length} recipes`;
  }

  // Update active filters display
  updateActiveFiltersDisplay(searchTerm, difficulty, mealType, dietary, time, activeFilters);
}

/**
 * Update the active filters display
 */
function updateActiveFiltersDisplay(searchTerm, difficulty, mealType, dietary, time, container) {
  if (!container) return;

  const filters = [];
  
  if (searchTerm) {
    filters.push(`<span class="filter-tag" data-filter="search">Search: "${searchTerm}" <button type="button" onclick="clearFilter('search')">×</button></span>`);
  }
  if (difficulty) {
    filters.push(`<span class="filter-tag" data-filter="difficulty">Difficulty: ${difficulty} <button type="button" onclick="clearFilter('difficulty')">×</button></span>`);
  }
  if (mealType) {
    filters.push(`<span class="filter-tag" data-filter="mealType">Meal: ${mealType} <button type="button" onclick="clearFilter('mealType')">×</button></span>`);
  }
  if (dietary) {
    filters.push(`<span class="filter-tag" data-filter="dietary">Dietary: ${dietary} <button type="button" onclick="clearFilter('dietary')">×</button></span>`);
  }
  if (time) {
    const timeLabels = { quick: 'Under 30 min', medium: '30-60 min', long: 'Over 60 min' };
    filters.push(`<span class="filter-tag" data-filter="time">Time: ${timeLabels[time]} <button type="button" onclick="clearFilter('time')">×</button></span>`);
  }

  container.innerHTML = filters.join('');
}

/**
 * Clear a specific filter
 */
function clearFilter(filterType) {
  switch (filterType) {
    case 'search':
      document.getElementById('recipe-search').value = '';
      break;
    case 'difficulty':
      document.getElementById('difficulty-filter').value = '';
      break;
    case 'mealType':
      document.getElementById('meal-type-filter').value = '';
      break;
    case 'dietary':
      document.getElementById('dietary-filter').value = '';
      break;
    case 'time':
      document.getElementById('time-filter').value = '';
      break;
  }
  applyFilters();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  const searchInput = document.getElementById('recipe-search');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const mealTypeFilter = document.getElementById('meal-type-filter');
  const dietaryFilter = document.getElementById('dietary-filter');
  const timeFilter = document.getElementById('time-filter');

  if (searchInput) searchInput.value = '';
  if (difficultyFilter) difficultyFilter.value = '';
  if (mealTypeFilter) mealTypeFilter.value = '';
  if (dietaryFilter) dietaryFilter.value = '';
  if (timeFilter) timeFilter.value = '';

  applyFilters();
}

// Make clearFilter available globally for onclick handlers
window.clearFilter = clearFilter;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recipes-container')) {
    initCountryPage();
  }
});
