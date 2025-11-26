/**
 * Chefpedia - SEO Module
 * Handles dynamic meta tags, Schema.org structured data, and Open Graph tags
 */

const SEO = {
  /**
   * Base URL for the site (update for production)
   */
  BASE_URL: 'https://munjed80.github.io/recipebank/public',

  /**
   * Default author for recipes
   */
  DEFAULT_AUTHOR: 'Chefpedia Team',

  /**
   * Update page meta tags
   * @param {Object} options - Meta tag options
   */
  updateMeta(options) {
    const {
      title,
      description,
      canonicalUrl,
      ogType = 'website',
      ogImage,
      ogTitle,
      ogDescription,
      twitterCard = 'summary_large_image',
      keywords
    } = options;

    // Update title
    if (title) {
      document.title = title;
    }

    // Update or create meta description
    this.setMetaTag('description', description);

    // Update or create keywords
    if (keywords) {
      this.setMetaTag('keywords', keywords);
    }

    // Set canonical URL
    if (canonicalUrl) {
      this.setLinkTag('canonical', canonicalUrl);
    }

    // Open Graph tags
    this.setMetaProperty('og:type', ogType);
    this.setMetaProperty('og:title', ogTitle || title);
    this.setMetaProperty('og:description', ogDescription || description);
    this.setMetaProperty('og:url', canonicalUrl);
    if (ogImage) {
      this.setMetaProperty('og:image', ogImage);
    }
    this.setMetaProperty('og:site_name', 'Chefpedia');

    // Twitter Card tags
    this.setMetaName('twitter:card', twitterCard);
    this.setMetaName('twitter:title', ogTitle || title);
    this.setMetaName('twitter:description', ogDescription || description);
    if (ogImage) {
      this.setMetaName('twitter:image', ogImage);
    }
  },

  /**
   * Set or create a meta tag with name attribute
   */
  setMetaTag(name, content) {
    if (!content) return;
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  /**
   * Set or create a meta tag with name attribute
   */
  setMetaName(name, content) {
    if (!content) return;
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  /**
   * Set or create a meta tag with property attribute (for Open Graph)
   */
  setMetaProperty(property, content) {
    if (!content) return;
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  /**
   * Set or create a link tag
   */
  setLinkTag(rel, href) {
    if (!href) return;
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
  },

  /**
   * Generate Schema.org Recipe structured data
   * @param {Object} recipe - Recipe data object
   * @returns {Object} - JSON-LD structured data
   */
  generateRecipeSchema(recipe) {
    const prepTime = recipe.prep_time_minutes || 0;
    const cookTime = recipe.cooking_time_minutes || 0;
    const totalTime = prepTime + cookTime;

    // Convert ingredients to strings
    const ingredients = recipe.ingredients.map(ing => 
      `${ing.amount} ${ing.unit} ${ing.name}`
    );

    // Convert steps to HowToStep objects
    const instructions = recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'text': step
    }));

    // Build nutrition object if available
    let nutrition = null;
    if (recipe.nutrition) {
      nutrition = {
        '@type': 'NutritionInformation',
        'calories': `${recipe.nutrition.per_serving_kcal} calories`,
        'proteinContent': `${recipe.nutrition.protein_g}g`,
        'fatContent': `${recipe.nutrition.fat_g}g`,
        'carbohydrateContent': `${recipe.nutrition.carbs_g}g`
      };
    }

    // Build keywords from tags and dietary info
    let keywords = recipe.tags ? recipe.tags.join(', ') : '';
    if (recipe.mealType) {
      keywords += `, ${recipe.mealType}`;
    }
    if (recipe.dietaryStyle && recipe.dietaryStyle !== 'None') {
      keywords += `, ${recipe.dietaryStyle}`;
    }

    // Use mealType for recipe category if available, otherwise default to Dinner
    let recipeCategory = recipe.mealType || 'Dinner';

    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Recipe',
      'name': recipe.name_en,
      'description': recipe.short_description,
      'image': recipe.image ? `${this.BASE_URL}/${recipe.image}` : `${this.BASE_URL}/assets/img/recipes/default.jpg`,
      'author': {
        '@type': 'Organization',
        'name': this.DEFAULT_AUTHOR
      },
      'datePublished': '2024-01-01',
      'prepTime': `PT${prepTime}M`,
      'cookTime': `PT${cookTime}M`,
      'totalTime': `PT${totalTime}M`,
      'recipeYield': `${recipe.servings || 4} servings`,
      'recipeCategory': recipeCategory,
      'recipeCuisine': recipe.country,
      'keywords': keywords,
      'recipeIngredient': ingredients,
      'recipeInstructions': instructions,
      // Placeholder aggregateRating - can be populated when rating system is implemented
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.5',
        'ratingCount': '10',
        'bestRating': '5',
        'worstRating': '1'
      }
    };

    // Add nutrition if available
    if (nutrition) {
      schema.nutrition = nutrition;
    }

    // Add cooking tips as additional content
    if (recipe.cooking_tips && recipe.cooking_tips.length > 0) {
      schema.description = `${recipe.short_description} Tips: ${recipe.cooking_tips.join(' ')}`;
    }

    return schema;
  },

  /**
   * Insert Schema.org structured data into the page
   * @param {Object} schema - JSON-LD data
   */
  insertStructuredData(schema) {
    // Remove existing schema if any
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Create new script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  },

  /**
   * Generate breadcrumb structured data
   * @param {Array} items - Array of {name, url} objects
   * @returns {Object} - BreadcrumbList JSON-LD
   */
  generateBreadcrumbSchema(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };
  },

  /**
   * Apply recipe page SEO
   * @param {Object} recipe - Recipe data object
   */
  applyRecipeSEO(recipe) {
    const canonicalUrl = `${this.BASE_URL}/recipes/recipe.html?slug=${recipe.slug}`;
    const imageUrl = recipe.image ? `${this.BASE_URL}/${recipe.image}` : null;
    
    const prepTime = recipe.prep_time_minutes || 0;
    const cookTime = recipe.cooking_time_minutes || 0;
    const totalTime = prepTime + cookTime;

    // Update meta tags
    this.updateMeta({
      title: `${recipe.name_en} Recipe - ${recipe.country} Cuisine | Chefpedia`,
      description: `Learn how to make ${recipe.name_en}, a delicious ${recipe.country} dish. ${recipe.short_description.substring(0, 120)}...`,
      canonicalUrl: canonicalUrl,
      ogType: 'article',
      ogImage: imageUrl,
      ogTitle: `${recipe.name_en} - Authentic ${recipe.country} Recipe`,
      ogDescription: recipe.short_description,
      keywords: `${recipe.name_en}, ${recipe.country} recipe, ${recipe.country} cuisine, ${(recipe.tags || []).join(', ')}, how to make ${recipe.name_en}`
    });

    // Generate and insert recipe schema
    const recipeSchema = this.generateRecipeSchema(recipe);
    this.insertStructuredData(recipeSchema);
  },

  /**
   * Apply country page SEO
   * @param {string} countrySlug - Country slug
   * @param {string} countryName - Country display name
   * @param {number} recipeCount - Number of recipes
   */
  applyCountrySEO(countrySlug, countryName, recipeCount) {
    const canonicalUrl = `${this.BASE_URL}/countries/${countrySlug}.html`;
    
    // Country-specific descriptions
    const countryDescriptions = {
      italy: 'Explore authentic Italian recipes including pasta, pizza, risotto and more. Discover the heart of Mediterranean cuisine with our collection of traditional Italian dishes.',
      india: 'Discover traditional Indian recipes featuring rich curries, aromatic biryanis, tandoori dishes and more. Experience the vibrant spices and flavors of Indian cuisine.',
      japan: 'Explore elegant Japanese recipes including ramen, sushi, teriyaki and more. Discover Japan\'s culinary artistry with umami-rich traditional dishes.',
      mexico: 'Find authentic Mexican recipes featuring tacos, enchiladas, guacamole and more. Experience bold, vibrant flavors from Mexico\'s rich culinary heritage.',
      syria: 'Discover traditional Syrian and Levantine recipes including kibbeh, fattoush, hummus and more. Explore the ancient flavors of Middle Eastern cuisine.',
      france: 'Explore classic French recipes including coq au vin, croissants, ratatouille and more. Master the elegant gastronomy of French cuisine.',
      thailand: 'Discover authentic Thai recipes featuring pad thai, green curry, tom yum and more. Experience the bold and aromatic flavors of Thai cuisine.',
      morocco: 'Find traditional Moroccan recipes including tagines, couscous and more. Explore the exotic spices and aromatic dishes of North African cuisine.',
      lebanon: 'Explore Lebanese recipes featuring fresh mezze, shawarma, tabbouleh and more. Discover the healthy and flavorful dishes of Lebanese cuisine.',
      china: 'Discover Chinese recipes spanning dim sum, stir-fries, dumplings and more. Explore thousands of years of culinary tradition from China.',
      greece: 'Find authentic Greek recipes including moussaka, souvlaki, tzatziki and more. Experience the sun-kissed flavors of Mediterranean Greek cuisine.',
      spain: 'Explore Spanish recipes featuring paella, tapas, gazpacho and more. Discover the passionate flavors of Spanish culinary tradition.',
      turkey: 'Discover Turkish recipes including kebabs, baklava, pide and more. Experience the rich flavors where East meets West.',
      korea: 'Find Korean recipes featuring kimchi, bulgogi, bibimbap and more. Explore the fermented flavors and BBQ traditions of Korean cuisine.',
      vietnam: 'Explore Vietnamese recipes including pho, banh mi, spring rolls and more. Discover the fresh and aromatic flavors of Vietnamese cuisine.',
      brazil: 'Discover Brazilian recipes featuring feijoada, picanha, açaí and more. Experience the diverse flavors of South America\'s largest country.',
      ethiopia: 'Find Ethiopian recipes including doro wat, injera and more. Explore the unique spices and communal dining traditions of Ethiopian cuisine.',
      peru: 'Explore Peruvian recipes featuring ceviche, lomo saltado and more. Discover the fusion flavors of Peru\'s world-renowned cuisine.',
      indonesia: 'Discover Indonesian recipes including nasi goreng, rendang, satay and more. Experience the diverse flavors from the spice islands.',
      egypt: 'Find Egyptian recipes including koshari, ful medames and more. Explore the ancient flavors of Egyptian cuisine along the Nile.'
    };

    const description = countryDescriptions[countrySlug] || 
      `Explore authentic ${countryName} recipes and traditional dishes. Discover the flavors and culinary traditions of ${countryName} cuisine.`;

    this.updateMeta({
      title: `${countryName} Recipes - Authentic ${countryName} Food | Chefpedia`,
      description: description,
      canonicalUrl: canonicalUrl,
      ogTitle: `${countryName} Recipes - Traditional ${countryName} Cuisine`,
      ogDescription: `Browse ${recipeCount || 'our collection of'} authentic ${countryName} recipes. From traditional favorites to modern classics.`,
      keywords: `${countryName} recipes, ${countryName} food, ${countryName} cuisine, ${countryName} dishes, traditional ${countryName} cooking`
    });
  },

  /**
   * Apply home page SEO
   */
  applyHomeSEO() {
    const canonicalUrl = `${this.BASE_URL}/index.html`;
    
    this.updateMeta({
      title: 'Chefpedia - Global Recipe Library | World Cuisine Recipes',
      description: 'Explore authentic recipes from around the world. From Italian pasta to Japanese ramen, Mexican tacos to Indian curry. Your free global recipe library with step-by-step instructions.',
      canonicalUrl: canonicalUrl,
      ogTitle: 'Chefpedia - Discover World Cuisine',
      ogDescription: 'Explore authentic recipes from over 20 countries. Free global recipe library with step-by-step cooking instructions.',
      keywords: 'recipes, world cuisine, global recipes, cooking, international food, recipe library, Italian recipes, Japanese recipes, Mexican recipes, Indian recipes'
    });

    // Add WebSite schema for home page
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Chefpedia',
      'description': 'A free, open-source global recipe library with authentic recipes from around the world.',
      'url': this.BASE_URL,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${this.BASE_URL}/assistant.html?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    this.insertStructuredData(websiteSchema);
  },

  /**
   * Apply favorites page SEO
   */
  applyFavoritesSEO() {
    const canonicalUrl = `${this.BASE_URL}/favorites.html`;
    
    this.updateMeta({
      title: 'My Favorite Recipes | Chefpedia',
      description: 'View and manage your saved favorite recipes from Chefpedia. Quick access to your personal collection of world cuisine recipes.',
      canonicalUrl: canonicalUrl,
      ogTitle: 'My Favorite Recipes - Chefpedia',
      ogDescription: 'Your personal collection of saved recipes from around the world.',
      keywords: 'favorite recipes, saved recipes, recipe collection, cookbook'
    });
  },

  /**
   * Apply assistant page SEO
   */
  applyAssistantSEO() {
    const canonicalUrl = `${this.BASE_URL}/assistant.html`;
    
    this.updateMeta({
      title: 'AI Chef Assistant - Recipe Search & Cooking Help | Chefpedia',
      description: 'Get cooking help from our AI Chef Assistant. Search recipes by ingredients, country or difficulty. Get step-by-step guidance, ingredient substitutions and nutrition information.',
      canonicalUrl: canonicalUrl,
      ogTitle: 'AI Chef Assistant - Your Personal Cooking Guide',
      ogDescription: 'Chat with our AI assistant to find recipes, get cooking tips, and learn about nutrition.',
      keywords: 'AI chef, recipe search, cooking assistant, ingredient search, recipe finder, cooking help'
    });
  }
};

// Export for use in other modules
window.SEO = SEO;
