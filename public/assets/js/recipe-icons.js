const RecipeIcons = {
  ICONS: {
    spicy: { label: 'Spicy', symbol: '🌶️' },
    sweet: { label: 'Sweet', symbol: '🍯' },
    soup: { label: 'Soup or stew', symbol: '🍲' },
    salad: { label: 'Salad', symbol: '🥗' },
    meat: { label: 'Red meat', symbol: '🥩' },
    chicken: { label: 'Chicken', symbol: '🍗' },
    fish: { label: 'Seafood or fish', symbol: '🐟' },
    vegan: { label: 'Vegan friendly', symbol: '🌱' },
    vegetarian: { label: 'Vegetarian', symbol: '🥬' },
    gluten_free: { label: 'Gluten-free', symbol: '🚫🌾' },
    dairy: { label: 'Contains dairy', symbol: '🥛' },
    nuts: { label: 'Contains nuts', symbol: '🥜' },
    rice: { label: 'Rice based', symbol: '🍚' },
    pasta: { label: 'Pasta or noodles', symbol: '🍝' },
    bread: { label: 'Bread or pastry', symbol: '🥖' },
    dessert: { label: 'Dessert', symbol: '🍰' },
    drink: { label: 'Drink', symbol: '🥤' },
    grill: { label: 'Grilled', symbol: '🔥' }
  },

  ingredientKeywords: {
    spicy: ['chili', 'chilli', 'pepper', 'harissa', 'sambal', 'gochujang', 'jalapeno', 'cayenne', 'paprika'],
    sweet: ['sugar', 'honey', 'syrup', 'molasses', 'sweet'],
    soup: ['soup', 'stew', 'broth', 'stock', 'pho', 'ramen', 'chowder', 'stewed'],
    salad: ['salad', 'greens', 'lettuce'],
    meat: ['beef', 'lamb', 'pork', 'veal', 'mutton'],
    chicken: ['chicken'],
    fish: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'cod', 'mackerel', 'sardine'],
    vegan: ['tofu', 'tempeh', 'seitan', 'beans', 'lentils', 'chickpeas'],
    vegetarian: ['cheese', 'paneer', 'egg'],
    gluten_free: ['cornmeal', 'rice flour'],
    dairy: ['milk', 'cheese', 'cream', 'butter', 'yogurt', 'ghee'],
    nuts: ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'peanut', 'pine nut'],
    rice: ['rice', 'risotto'],
    pasta: ['pasta', 'noodle', 'spaghetti', 'fettuccine', 'linguine', 'udon', 'ramen'],
    bread: ['bread', 'pita', 'tortilla', 'flatbread', 'baguette', 'pastry'],
    dessert: ['dessert', 'cake', 'cookie', 'pudding', 'sweet'],
    drink: ['drink', 'tea', 'coffee', 'juice', 'smoothie'],
    grill: ['grill', 'barbecue', 'bbq', 'char']
  },

  getIcons(recipe) {
    if (!recipe) return [];
    const detected = new Set();
    const textFields = [recipe.short_description || '', recipe.mealType || '', recipe.dietaryStyle || '', (recipe.tags || []).join(' ')];
    const combinedText = textFields.join(' ').toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => (i.name || '').toLowerCase());

    const matchAny = (keywords) => keywords.some(kw => combinedText.includes(kw) || ingredients.some(ing => ing.includes(kw)));

    Object.entries(this.ingredientKeywords).forEach(([key, keywords]) => {
      if (matchAny(keywords)) detected.add(key);
    });

    if (recipe.dietaryStyle) {
      const style = recipe.dietaryStyle.toLowerCase();
      if (style.includes('vegan')) detected.add('vegan');
      if (style.includes('vegetarian')) detected.add('vegetarian');
      if (style.includes('gluten')) detected.add('gluten_free');
    }

    if (combinedText.includes('dessert') || (recipe.mealType && recipe.mealType.toLowerCase() === 'dessert')) detected.add('dessert');
    if (combinedText.includes('soup') || combinedText.includes('stew')) detected.add('soup');
    if (combinedText.includes('salad')) detected.add('salad');

    if (!ingredients.some(ing => /meat|chicken|fish|shrimp|prawn|beef|lamb|pork/.test(ing)) && detected.has('vegan')) {
      detected.delete('vegetarian');
    }

    if (ingredients.some(ing => /flour|wheat|barley|rye|pasta/.test(ing))) {
      detected.delete('gluten_free');
    }

    return Array.from(detected);
  },

  renderIcons(iconKeys = []) {
    if (!iconKeys.length) return '';
    const icons = iconKeys
      .filter(key => this.ICONS[key])
      .map(key => {
        const icon = this.ICONS[key];
        return `<span class="recipe-icon" data-icon="${key}" title="${icon.label}" aria-label="${icon.label}">${icon.symbol}</span>`;
      })
      .join('');

    return `<div class="recipe-icon-row" aria-label="Recipe highlights">${icons}</div>`;
  }
};

window.RecipeIcons = RecipeIcons;
