/**
 * ChefSense - Favorites Module
 * Handles saving, loading, and managing favorite recipes using localStorage
 */

const Favorites = {
  STORAGE_KEY: 'recipebank_favorites',

  /**
   * Get all favorite recipe slugs
   * @returns {Array} Array of recipe slugs
   */
  getAll() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading favorites:', e);
      return [];
    }
  },

  /**
   * Save favorites to localStorage
   * @param {Array} favorites - Array of recipe slugs
   */
  save(favorites) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: favorites }));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  },

  /**
   * Check if a recipe is in favorites
   * @param {string} slug - Recipe slug
   * @returns {boolean}
   */
  isFavorite(slug) {
    return this.getAll().includes(slug);
  },

  /**
   * Add a recipe to favorites
   * @param {string} slug - Recipe slug
   * @returns {boolean} Success status
   */
  add(slug) {
    const favorites = this.getAll();
    if (!favorites.includes(slug)) {
      favorites.push(slug);
      this.save(favorites);
      return true;
    }
    return false;
  },

  /**
   * Remove a recipe from favorites
   * @param {string} slug - Recipe slug
   * @returns {boolean} Success status
   */
  remove(slug) {
    const favorites = this.getAll();
    const index = favorites.indexOf(slug);
    if (index > -1) {
      favorites.splice(index, 1);
      this.save(favorites);
      return true;
    }
    return false;
  },

  /**
   * Toggle favorite status
   * @param {string} slug - Recipe slug
   * @returns {boolean} New favorite status
   */
  toggle(slug) {
    if (this.isFavorite(slug)) {
      this.remove(slug);
      return false;
    } else {
      this.add(slug);
      return true;
    }
  },

  /**
   * Get count of favorites
   * @returns {number}
   */
  count() {
    return this.getAll().length;
  },

  /**
   * Clear all favorites
   */
  clear() {
    this.save([]);
  },

  /**
   * Get favorite recipes from full recipe list
   * @param {Array} allRecipes - All recipes
   * @returns {Array} Favorite recipes
   */
  async getFavoriteRecipes(allRecipes = null) {
    if (!allRecipes) {
      allRecipes = await RecipeBank.fetchRecipes();
    }
    const favoriteSlugs = this.getAll();
    return allRecipes.filter(r => favoriteSlugs.includes(r.slug));
  },

  /**
   * Create a favorite button element
   * @param {string} slug - Recipe slug
   * @param {Object} options - Button options
   * @returns {HTMLElement} Button element
   */
  createButton(slug, options = {}) {
    const isFav = this.isFavorite(slug);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `favorite-btn ${isFav ? 'is-favorite' : ''} ${options.className || ''}`;
    btn.setAttribute('data-slug', slug);
    btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    btn.innerHTML = isFav ? '❤️' : '🤍';
    
    if (options.showText) {
      btn.innerHTML = isFav ? '❤️ Saved' : '🤍 Save';
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newStatus = this.toggle(slug);
      btn.classList.toggle('is-favorite', newStatus);
      btn.setAttribute('aria-label', newStatus ? 'Remove from favorites' : 'Add to favorites');
      if (options.showText) {
        btn.innerHTML = newStatus ? '❤️ Saved' : '🤍 Save';
      } else {
        btn.innerHTML = newStatus ? '❤️' : '🤍';
      }
      if (options.onToggle) {
        options.onToggle(newStatus, slug);
      }
    });

    return btn;
  },

  /**
   * Update all favorite buttons on the page
   */
  updateAllButtons() {
    const buttons = document.querySelectorAll('.favorite-btn[data-slug]');
    buttons.forEach(btn => {
      const slug = btn.getAttribute('data-slug');
      const isFav = this.isFavorite(slug);
      btn.classList.toggle('is-favorite', isFav);
      const showText = btn.innerHTML.includes('Save');
      if (showText) {
        btn.innerHTML = isFav ? '❤️ Saved' : '🤍 Save';
      } else {
        btn.innerHTML = isFav ? '❤️' : '🤍';
      }
    });
  }
};

// Export for use in other modules
window.Favorites = Favorites;

// Listen for favorites changes across tabs
window.addEventListener('storage', (e) => {
  if (e.key === Favorites.STORAGE_KEY) {
    Favorites.updateAllButtons();
  }
});
