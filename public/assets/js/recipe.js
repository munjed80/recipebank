/**
 * RecipeBank - Recipe Page Interactions
 * Handles ingredient checking, printing, and tag filtering
 * Note: Favorites are now handled by the favorites.js module and recipe-detail.js
 */

const RecipeInteractions = {
  /**
   * Initialize all recipe page interactions
   */
  init() {
    this.initIngredientCheckboxes();
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
        // Show toast notification for tag filtering (future feature)
        this.showToast(`Filtering by tag: ${tagName} (coming soon!)`);
      });
    });
  },

  /**
   * Show a toast notification
   */
  showToast(message) {
    // Remove any existing toast
    const existingToast = document.querySelector('.recipe-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'recipe-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2c3e50;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 0.95rem;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: toastFadeIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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
