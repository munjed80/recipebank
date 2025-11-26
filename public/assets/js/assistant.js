/**
 * Chefpedia - AI Assistant Module
 * Local search and filtering logic for recipe suggestions
 */

/**
 * Initialize AI Assistant page
 */
async function initAssistant() {
  const form = document.getElementById('search-form');
  const resultsContainer = document.getElementById('results-container');
  
  if (!form || !resultsContainer) {
    console.error('Missing form or results container');
    return;
  }

  // Load all recipes for local search
  const allRecipes = await RecipeBank.fetchRecipes();
  
  if (allRecipes.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>Unable to load recipes. Please try again later.</p>
      </div>
    `;
    return;
  }

  // Populate country filter
  populateCountryFilter(allRecipes);

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('query').value.trim();
    const country = document.getElementById('country-filter').value;
    const difficulty = document.getElementById('difficulty-filter').value;
    
    const results = searchRecipes(allRecipes, query, country, difficulty);
    displayResults(resultsContainer, results, query);
  });

  // Show initial suggestions
  displayResults(resultsContainer, getRandomRecipes(allRecipes, 3), '');
}

/**
 * Populate country filter dropdown
 */
function populateCountryFilter(recipes) {
  const select = document.getElementById('country-filter');
  if (!select) return;

  const countries = [...new Set(recipes.map(r => r.country))].sort();
  
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country.toLowerCase();
    option.textContent = country;
    select.appendChild(option);
  });
}

/**
 * Search recipes based on query, country, and difficulty
 */
function searchRecipes(recipes, query, country, difficulty) {
  let results = [...recipes];

  // Filter by country
  if (country) {
    results = results.filter(r => r.country.toLowerCase() === country);
  }

  // Filter by difficulty
  if (difficulty) {
    results = results.filter(r => r.difficulty === difficulty);
  }

  // Search by query (ingredients, tags, name)
  if (query) {
    const queryTerms = query.toLowerCase().split(/[,\s]+/).filter(t => t.length > 0);
    
    results = results.map(recipe => {
      const score = calculateMatchScore(recipe, queryTerms);
      return { ...recipe, matchScore: score };
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
  }

  return results;
}

/**
 * Calculate match score for a recipe based on query terms
 */
function calculateMatchScore(recipe, queryTerms) {
  let score = 0;
  const searchableText = [
    recipe.name_en.toLowerCase(),
    recipe.name_local.toLowerCase(),
    recipe.short_description.toLowerCase(),
    ...recipe.tags.map(t => t.toLowerCase()),
    ...recipe.ingredients.map(i => i.name.toLowerCase())
  ].join(' ');

  queryTerms.forEach(term => {
    // Check ingredient names (highest priority)
    const ingredientMatch = recipe.ingredients.some(i => 
      i.name.toLowerCase().includes(term)
    );
    if (ingredientMatch) score += 3;

    // Check tags (high priority)
    const tagMatch = recipe.tags.some(t => t.toLowerCase().includes(term));
    if (tagMatch) score += 2;

    // Check name
    if (recipe.name_en.toLowerCase().includes(term)) score += 2;
    if (recipe.name_local.toLowerCase().includes(term)) score += 1;

    // Check description
    if (recipe.short_description.toLowerCase().includes(term)) score += 1;
  });

  return score;
}

/**
 * Get random recipes for initial display
 */
function getRandomRecipes(recipes, count) {
  const shuffled = [...recipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Display search results
 */
function displayResults(container, results, query) {
  if (results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <h3>No recipes found</h3>
        <p>Try different ingredients or filters. Here are some suggestions:</p>
        <ul>
          <li>Use common ingredients like "chicken", "rice", "tomato"</li>
          <li>Try tags like "vegetarian", "quick", "spicy"</li>
          <li>Search for cuisine types like "pasta" or "curry"</li>
        </ul>
      </div>
    `;
    return;
  }

  const title = query 
    ? `Found ${results.length} recipe${results.length > 1 ? 's' : ''} matching "${query}"`
    : `Here are some recipes to try:`;

  const recipesHtml = results.map(recipe => RecipeBank.createRecipeCard(recipe)).join('');

  container.innerHTML = `
    <h3 class="results-title">${title}</h3>
    <div class="recipe-grid">
      ${recipesHtml}
    </div>
  `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('search-form')) {
    initAssistant();
  }
});
