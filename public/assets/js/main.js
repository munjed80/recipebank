/**
 * RecipeBank - Main JavaScript
 * Shared utilities and navigation functionality
 */

// Configuration
const CONFIG = {
  recipesJsonPath: '/recipes.json',
  basePath: ''
};

// Determine base path based on current location
(function setBasePath() {
  const path = window.location.pathname;
  if (path.includes('/public/countries/') || path.includes('/public/recipes/')) {
    CONFIG.basePath = '../..';
    CONFIG.recipesJsonPath = '../../recipes.json';
  } else if (path.includes('/public/')) {
    CONFIG.basePath = '..';
    CONFIG.recipesJsonPath = '../recipes.json';
  }
})();

/**
 * Fetch all recipes from recipes.json
 */
async function fetchRecipes() {
  try {
    const response = await fetch(CONFIG.recipesJsonPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

/**
 * Get recipes for a specific country
 */
async function getRecipesByCountry(countrySlug) {
  const recipes = await fetchRecipes();
  return recipes.filter(recipe => recipe.country_slug === countrySlug);
}

/**
 * Get a single recipe by slug
 */
async function getRecipeBySlug(slug) {
  const recipes = await fetchRecipes();
  return recipes.find(recipe => recipe.slug === slug);
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
  getRecipesByCountry,
  getRecipeBySlug,
  getCountries,
  getCountryFlag,
  formatTime,
  getDifficultyClass,
  createRecipeCard,
  CONFIG
};
