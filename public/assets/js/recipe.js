/**
 * RecipeBank - Recipe Page Interactions
 * Handles favorites, printing, ingredient checking, and tag filtering
 */

const RecipeInteractions = {
  FAVORITES_KEY: 'recipebank_favorites',

  /**
   * Initialize all recipe page interactions
   */
  init() {
    this.initIngredientCheckboxes();
    this.initFavoriteButton();
    this.initPrintButton();
    this.initTagLinks();
  },

  /**
   * Initialize ingredient checkbox functionality
   */
  initIngredientCheckboxes() {
    const checkboxes = document.querySelectorAll('.ingredient-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const item = e.target.closest('.ingredient-item');
        if (item) {
          item.classList.toggle('checked', e.target.checked);
        }
      });
    });
  },

  /**
   * Initialize favorite button functionality with localStorage
   */
  initFavoriteButton() {
    const btn = document.getElementById('btn-save-favorite');
    if (!btn) return;

    const recipeSlug = this.getRecipeSlug();
    if (!recipeSlug) return;

    // Check if already saved
    if (this.isFavorite(recipeSlug)) {
      this.updateFavoriteButton(btn, true);
    }

    btn.addEventListener('click', () => {
      this.toggleFavorite(recipeSlug, btn);
    });
  },

  /**
   * Get recipe slug from URL
   */
  getRecipeSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
  },

  /**
   * Get favorites from localStorage
   */
  getFavorites() {
    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading favorites:', e);
      return [];
    }
  },

  /**
   * Save favorites to localStorage
   */
  saveFavorites(favorites) {
    try {
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  },

  /**
   * Check if a recipe is favorited
   */
  isFavorite(slug) {
    const favorites = this.getFavorites();
    return favorites.includes(slug);
  },

  /**
   * Toggle favorite status
   */
  toggleFavorite(slug, btn) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(slug);
    
    if (index === -1) {
      favorites.push(slug);
      this.updateFavoriteButton(btn, true);
    } else {
      favorites.splice(index, 1);
      this.updateFavoriteButton(btn, false);
    }
    
    this.saveFavorites(favorites);
  },

  /**
   * Update favorite button appearance
   */
  updateFavoriteButton(btn, isSaved) {
    if (isSaved) {
      btn.classList.add('saved');
      btn.innerHTML = '<span class="icon">❤️</span><span>Saved!</span>';
    } else {
      btn.classList.remove('saved');
      btn.innerHTML = '<span class="icon">🤍</span><span>Save</span>';
    }
  },

  /**
   * Initialize print button functionality
   */
  initPrintButton() {
    const btn = document.getElementById('btn-print-recipe');
    if (!btn) return;

    btn.addEventListener('click', () => {
      this.printRecipe();
    });
  },

  /**
   * Print only the recipe section
   */
  printRecipe() {
    window.print();
  },

  /**
   * Initialize tag link functionality
   */
  initTagLinks() {
    const tags = document.querySelectorAll('.tag-pill[data-tag]');
    tags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const tagName = e.target.dataset.tag;
        // Navigate to assistant page with tag filter (future enhancement)
        // For now, we show an alert with the tag name
        alert(`Filtering by tag: ${tagName}\n\nThis feature will show all recipes with this tag.`);
      });
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure recipe content is rendered first
  setTimeout(() => {
    RecipeInteractions.init();
  }, 100);
});

// Export for use in other modules
window.RecipeInteractions = RecipeInteractions;
