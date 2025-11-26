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
  lebanon: '🇱🇧'
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
 * Create a recipe card HTML
 */
function createRecipeCard(recipe) {
  const tagsHtml = recipe.tags.slice(0, 3).map(tag => 
    `<span class="tag">${tag}</span>`
  ).join('');

  return `
    <article class="recipe-card">
      <a href="${CONFIG.basePath}/public/recipes/recipe.html?slug=${recipe.slug}">
        <div class="recipe-card-image">
          <span>🍽️</span>
        </div>
        <div class="recipe-card-content">
          <h3 class="recipe-card-title">${recipe.name_en}</h3>
          <p class="recipe-card-local-name">${recipe.name_local}</p>
          <p class="recipe-card-description">${recipe.short_description}</p>
          <div class="recipe-card-meta">
            <span>⏱️ ${formatTime(recipe.cooking_time_minutes)}</span>
            <span>📊 ${recipe.difficulty}</span>
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  setActiveNavLink();
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
