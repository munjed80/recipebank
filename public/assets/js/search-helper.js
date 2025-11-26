/**
 * RecipeBank - Shared Search Helper Module
 * Central place for recipe search, filtering, and matching logic
 */

const RecipeSearch = {
  /**
   * Search recipes based on query string
   * @param {Array} recipes - Array of recipe objects
   * @param {string} query - Search query (name, ingredients, tags, country, description)
   * @returns {Array} Matching recipes sorted by relevance
   */
  search(recipes, query) {
    if (!query || !query.trim()) {
      return recipes;
    }

    const queryTerms = query.toLowerCase().split(/[,\s]+/).filter(t => t.length > 0);
    
    return recipes
      .map(recipe => ({
        ...recipe,
        matchScore: this.calculateMatchScore(recipe, queryTerms)
      }))
      .filter(r => r.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Calculate match score for a recipe based on query terms
   * @param {Object} recipe - Recipe object
   * @param {Array} queryTerms - Array of search terms
   * @returns {number} Match score
   */
  calculateMatchScore(recipe, queryTerms) {
    let score = 0;

    queryTerms.forEach(term => {
      // Check recipe name (highest priority)
      if (recipe.name_en.toLowerCase().includes(term)) score += 5;

      // Check country name
      if (recipe.country.toLowerCase().includes(term)) score += 4;
      if (recipe.country_slug.includes(term)) score += 4;

      // Check ingredient names
      const ingredientMatch = recipe.ingredients.some(i => 
        i.name.toLowerCase().includes(term)
      );
      if (ingredientMatch) score += 3;

      // Check tags
      const tagMatch = recipe.tags.some(t => t.toLowerCase().includes(term));
      if (tagMatch) score += 3;

      // Check description
      if (recipe.short_description.toLowerCase().includes(term)) score += 1;

      // Check difficulty
      if (recipe.difficulty.toLowerCase() === term) score += 2;
    });

    return score;
  },

  /**
   * Filter recipes by multiple criteria
   * @param {Array} recipes - Array of recipe objects
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered recipes
   */
  filter(recipes, filters = {}) {
    let results = [...recipes];

    // Filter by country
    if (filters.country) {
      results = results.filter(r => 
        r.country.toLowerCase() === filters.country.toLowerCase() ||
        r.country_slug === filters.country.toLowerCase()
      );
    }

    // Filter by difficulty
    if (filters.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }

    // Filter by dietary tags
    if (filters.dietary) {
      results = results.filter(r => r.tags.includes(filters.dietary));
    }

    // Filter by time range
    if (filters.timeRange) {
      results = results.filter(r => {
        const totalTime = (r.prep_time_minutes || 0) + (r.cooking_time_minutes || 0);
        switch (filters.timeRange) {
          case 'quick':
            return totalTime < 30;
          case 'medium':
            return totalTime >= 30 && totalTime <= 60;
          case 'long':
            return totalTime > 60;
          default:
            return true;
        }
      });
    }

    return results;
  },

  /**
   * Search and filter combined
   * @param {Array} recipes - Array of recipe objects
   * @param {string} query - Search query
   * @param {Object} filters - Filter criteria
   * @returns {Array} Matching and filtered recipes
   */
  searchAndFilter(recipes, query, filters = {}) {
    let results = this.filter(recipes, filters);
    if (query && query.trim()) {
      results = this.search(results, query);
    }
    return results;
  },

  /**
   * Find recipe by exact name match
   * @param {Array} recipes - Array of recipe objects
   * @param {string} name - Recipe name to find
   * @returns {Object|null} Matching recipe or null
   */
  findByName(recipes, name) {
    const searchName = name.toLowerCase().trim();
    return recipes.find(r => 
      r.name_en.toLowerCase() === searchName ||
      r.name_en.toLowerCase().includes(searchName) ||
      r.slug === searchName.replace(/\s+/g, '-')
    ) || null;
  },

  /**
   * Find recipe by slug
   * @param {Array} recipes - Array of recipe objects
   * @param {string} slug - Recipe slug
   * @returns {Object|null} Matching recipe or null
   */
  findBySlug(recipes, slug) {
    return recipes.find(r => r.slug === slug) || null;
  },

  /**
   * Get recipes by country
   * @param {Array} recipes - Array of recipe objects
   * @param {string} country - Country name or slug
   * @returns {Array} Recipes from that country
   */
  getByCountry(recipes, country) {
    const searchCountry = country.toLowerCase();
    return recipes.filter(r => 
      r.country.toLowerCase() === searchCountry ||
      r.country_slug === searchCountry
    );
  },

  /**
   * Get recipes by tag
   * @param {Array} recipes - Array of recipe objects
   * @param {string} tag - Tag to search for
   * @returns {Array} Recipes with that tag
   */
  getByTag(recipes, tag) {
    return recipes.filter(r => r.tags.includes(tag.toLowerCase()));
  },

  /**
   * Get similar recipes based on tags and country
   * @param {Array} recipes - Array of recipe objects
   * @param {Object} recipe - Reference recipe
   * @param {number} limit - Max number of results
   * @returns {Array} Similar recipes
   */
  getSimilar(recipes, recipe, limit = 3) {
    return recipes
      .filter(r => r.slug !== recipe.slug)
      .map(r => {
        let similarity = 0;
        // Same country
        if (r.country_slug === recipe.country_slug) similarity += 2;
        // Same difficulty
        if (r.difficulty === recipe.difficulty) similarity += 1;
        // Shared tags
        const sharedTags = r.tags.filter(t => recipe.tags.includes(t));
        similarity += sharedTags.length;
        return { ...r, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  /**
   * Get random recipes
   * @param {Array} recipes - Array of recipe objects
   * @param {number} count - Number of random recipes
   * @returns {Array} Random recipes
   */
  getRandom(recipes, count = 3) {
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  /**
   * Extract recipe info for AI assistant responses
   * @param {Object} recipe - Recipe object
   * @returns {Object} Simplified recipe info
   */
  getRecipeInfo(recipe) {
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cooking_time_minutes || 0);
    return {
      name: recipe.name_en,
      slug: recipe.slug,
      country: recipe.country,
      prepTime: recipe.prep_time_minutes,
      cookTime: recipe.cooking_time_minutes,
      totalTime: totalTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      description: recipe.short_description,
      ingredients: recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
      steps: recipe.steps,
      tips: recipe.cooking_tips,
      nutritionBenefits: recipe.nutrition_benefits,
      nutrition: recipe.nutrition
    };
  }
};

// Export for use in other modules
window.RecipeSearch = RecipeSearch;
