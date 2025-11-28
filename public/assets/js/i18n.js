(function initI18N() {
  const translations = {
    en: {
      heroTitle: 'ChefSense — Master Chef & Nutrition Expert',
      heroSubtitle: 'Your multilingual cooking guide with nutrition insights and voice support',
      openAssistant: '🤖 Open ChefSense',
      searchPlaceholder: 'Search recipes, ingredients, or cuisines...',
      sendLabel: 'Send message'
    },
    ar: {},
    nl: {},
    fr: {}
  };

  const api = {
    current: 'en',
    setLang(lang) {
      this.current = translations[lang] ? lang : 'en';
    },
    t(key) {
      const langPack = translations[this.current] || translations.en;
      return langPack[key] || translations.en[key] || key;
    },
    applyTranslations(lang = 'en') {
      this.setLang(lang);
      document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        const value = this.t(key);
        if (!value) return;
        if (el.placeholder !== undefined && el.tagName === 'INPUT') {
          el.placeholder = value;
        } else {
          el.textContent = value;
        }
      });
    }
  };

  window.I18N = api;
  window.AppLang = window.AppLang || 'en';
})();
