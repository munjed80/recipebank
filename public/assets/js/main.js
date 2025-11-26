/**
 * RecipeBank - Main JavaScript
 * Shared utilities and navigation functionality
 */

// Configuration
const CONFIG = {
  recipesJsonPath: '/recipes.json',
  recipesDataPath: '/data/recipes',
  basePath: ''
};

// Determine base path based on current location
(function setBasePath() {
  const path = window.location.pathname;
  if (path.includes('/public/countries/') || path.includes('/public/recipes/')) {
    CONFIG.basePath = '../..';
    CONFIG.recipesJsonPath = '../../recipes.json';
    CONFIG.recipesDataPath = '../../data/recipes';
  } else if (path.includes('/public/')) {
    CONFIG.basePath = '..';
    CONFIG.recipesJsonPath = '../recipes.json';
    CONFIG.recipesDataPath = '../data/recipes';
  }
})();

// Cache for loaded recipe data
const recipeCache = {
  all: null,
  byCountry: {}
};

/**
 * Fetch all recipes from recipes.json (fallback) or aggregate from country files
 */
async function fetchRecipes() {
  // Return cached data if available
  if (recipeCache.all) {
    return recipeCache.all;
  }

  try {
    // First try to load from the main recipes.json (for backwards compatibility)
    const response = await fetch(CONFIG.recipesJsonPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const recipes = await response.json();
    recipeCache.all = recipes;
    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

/**
 * Fetch recipes for a specific country from the individual country JSON file
 */
async function fetchRecipesByCountry(countrySlug) {
  // Return cached data if available
  if (recipeCache.byCountry[countrySlug]) {
    return recipeCache.byCountry[countrySlug];
  }

  try {
    const response = await fetch(`${CONFIG.recipesDataPath}/${countrySlug}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const recipes = await response.json();
    recipeCache.byCountry[countrySlug] = recipes;
    return recipes;
  } catch (error) {
    console.log(`Country file not found for ${countrySlug}, falling back to main recipes.json`);
    // Fallback to filtering from main recipes.json
    const allRecipes = await fetchRecipes();
    const filtered = allRecipes.filter(recipe => recipe.country_slug === countrySlug);
    recipeCache.byCountry[countrySlug] = filtered;
    return filtered;
  }
}

/**
 * Get recipes for a specific country (uses country-specific JSON file)
 */
async function getRecipesByCountry(countrySlug) {
  return await fetchRecipesByCountry(countrySlug);
}

/**
 * Get a single recipe by slug (ID)
 * Can optionally specify country to optimize loading
 */
async function getRecipeBySlug(slug, countrySlug = null) {
  // If country is known, load directly from country file
  if (countrySlug) {
    const countryRecipes = await fetchRecipesByCountry(countrySlug);
    return countryRecipes.find(recipe => recipe.slug === slug);
  }
  
  // Otherwise search through all recipes
  const recipes = await fetchRecipes();
  return recipes.find(recipe => recipe.slug === slug);
}

/**
 * Get a single recipe by ID (alias for getRecipeBySlug for new URL format)
 */
async function getRecipeById(id, countrySlug = null) {
  return getRecipeBySlug(id, countrySlug);
}

/**
 * Get unique countries from recipes
 */
async function getCountries() {
  const recipes = await fetchRecipes();
  const countryMap = new Map();
  
  recipes.forEach(recipe => {
    const slug = recipe.country_slug;
    if (!countryMap.has(slug)) {
      countryMap.set(slug, {
        name: recipe.country,
        slug: slug,
        count: 1
      });
    } else {
      countryMap.get(slug).count++;
    }
  });
  
  return Array.from(countryMap.values());
}

/**
 * Country flag emojis mapping
 */
const COUNTRY_FLAGS = {
  italy: '🇮🇹',
  india: '🇮🇳',
  japan: '🇯🇵',
  mexico: '🇲🇽',
  syria: '🇸🇾',
  turkey: '🇹🇷',
  france: '🇫🇷',
  thailand: '🇹🇭',
  morocco: '🇲🇦',
  lebanon: '🇱🇧',
  china: '🇨🇳',
  greece: '🇬🇷',
  spain: '🇪🇸',
  korea: '🇰🇷',
  vietnam: '🇻🇳',
  brazil: '🇧🇷',
  ethiopia: '🇪🇹',
  peru: '🇵🇪',
  indonesia: '🇮🇩',
  egypt: '🇪🇬'
};

/**
 * Get flag emoji for a country
 */
function getCountryFlag(countrySlug) {
  return COUNTRY_FLAGS[countrySlug] || '🌍';
}

/**
 * Format cooking time
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get difficulty badge color class
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
 * Generate classification badge HTML for a recipe
 * @param {Object} recipe - Recipe object with mealType and dietaryStyle
 * @returns {Object} Object with mealTypeBadge and dietaryBadge HTML strings
 */
function getClassificationBadges(recipe) {
  const mealTypeBadge = recipe.mealType ? 
    `<span class="classification-badge meal-type-badge meal-${recipe.mealType.toLowerCase()}">${recipe.mealType}</span>` : '';
  
  const dietaryBadge = recipe.dietaryStyle && recipe.dietaryStyle !== 'None' ? 
    `<span class="classification-badge dietary-badge dietary-${recipe.dietaryStyle.toLowerCase().replace(/\s+/g, '-')}">${recipe.dietaryStyle}</span>` : '';
  
  return { mealTypeBadge, dietaryBadge };
}

/**
 * Create a recipe card HTML with favorite button
 */
function createRecipeCard(recipe, options = {}) {
  const tagsHtml = recipe.tags.slice(0, 3).map(tag => 
    `<span class="tag">${tag}</span>`
  ).join('');

  // Calculate total time
  const prepTime = recipe.prep_time_minutes || 0;
  const cookTime = recipe.cooking_time_minutes || 0;
  const totalTime = prepTime + cookTime;

  // Check if favorites module is available
  const isFavorite = window.Favorites ? window.Favorites.isFavorite(recipe.slug) : false;
  const favIcon = isFavorite ? '❤️' : '🤍';
  const favClass = isFavorite ? 'is-favorite' : '';

  // Generate image alt text
  const altText = `${recipe.name_en} - ${recipe.country} ${recipe.difficulty} recipe`;

  // Generate meal type and dietary style badges using utility function
  const { mealTypeBadge, dietaryBadge } = getClassificationBadges(recipe);

  return `
    <article class="recipe-card">
      <button type="button" 
              class="favorite-btn ${favClass}" 
              data-slug="${recipe.slug}" 
              aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
              onclick="toggleFavorite(event, '${recipe.slug}')">
        ${favIcon}
      </button>
      <a href="${CONFIG.basePath}/public/recipes/recipe.html?slug=${recipe.slug}" aria-label="View ${recipe.name_en} recipe">
        <div class="recipe-card-image" role="img" aria-label="${altText}">
          <span aria-hidden="true">🍽️</span>
        </div>
        <div class="recipe-card-content">
          <div class="recipe-card-badges">
            ${mealTypeBadge}
            ${dietaryBadge}
          </div>
          <h3 class="recipe-card-title">${recipe.name_en}</h3>
          <p class="recipe-card-description">${recipe.short_description}</p>
          <div class="recipe-card-meta">
            <span><span aria-hidden="true">⏱️</span> ${formatTime(totalTime)}</span>
            <span><span aria-hidden="true">📊</span> ${recipe.difficulty}</span>
            <span>${getCountryFlag(recipe.country_slug)} ${recipe.country}</span>
          </div>
          <div class="recipe-card-tags">
            ${tagsHtml}
          </div>
        </div>
      </a>
    </article>
  `;
}

/**
 * Toggle favorite status from recipe card
 */
function toggleFavorite(event, slug) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!window.Favorites) return;
  
  const isFavorite = window.Favorites.toggle(slug);
  const btn = event.currentTarget;
  btn.classList.toggle('is-favorite', isFavorite);
  btn.innerHTML = isFavorite ? '❤️' : '🤍';
  btn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });
  }
}

/**
 * Set active navigation link
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href) || (currentPath.endsWith('/') && href.includes('index.html'))) {
      link.classList.add('active');
    }
  });
}

/**
 * Initialize global search functionality
 */
function initGlobalSearch() {
  const searchInput = document.getElementById('global-search');
  const searchResults = document.getElementById('global-search-results');
  
  if (!searchInput) return;
  
  let allRecipes = [];
  let debounceTimer;
  
  // Load recipes
  fetchRecipes().then(recipes => {
    allRecipes = recipes;
  });
  
  // Handle search input
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      if (searchResults) searchResults.innerHTML = '';
      searchResults?.classList.remove('show');
      return;
    }
    
    debounceTimer = setTimeout(() => {
      const results = window.RecipeSearch ? 
        window.RecipeSearch.search(allRecipes, query) :
        allRecipes.filter(r => r.name_en.toLowerCase().includes(query.toLowerCase()));
      
      displaySearchResults(results.slice(0, 5), searchResults);
    }, 300);
  });
  
  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-wrapper')) {
      searchResults?.classList.remove('show');
    }
  });
}

/**
 * Display search results in dropdown
 */
function displaySearchResults(results, container) {
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="search-no-results">No recipes found</div>';
    container.classList.add('show');
    return;
  }
  
  const html = results.map(recipe => {
    const isFav = window.Favorites ? window.Favorites.isFavorite(recipe.slug) : false;
    const favIcon = isFav ? ' ❤️' : '';
    
    return `
      <a href="${CONFIG.basePath}/public/recipes/recipe.html?slug=${recipe.slug}" class="search-result-item">
        <div class="search-result-icon">🍽️</div>
        <div class="search-result-info">
          <span class="search-result-name">${recipe.name_en}${favIcon}</span>
          <span class="search-result-meta">${getCountryFlag(recipe.country_slug)} ${recipe.country} • ${recipe.difficulty}</span>
        </div>
      </a>
    `;
  }).join('');
  
  container.innerHTML = html;
  container.classList.add('show');
}

// Make toggleFavorite globally available
window.toggleFavorite = toggleFavorite;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  setActiveNavLink();
  initGlobalSearch();
});

// Export functions for use in other modules
window.RecipeBank = {
  fetchRecipes,
  fetchRecipesByCountry,
  getRecipesByCountry,
  getRecipeBySlug,
  getRecipeById,
  getCountries,
  getCountryFlag,
  formatTime,
  getDifficultyClass,
  getClassificationBadges,
  createRecipeCard,
  CONFIG
};
