// js/components/core.js
// Storage Service for persistence
export class StorageService {
  static KEYS = {
    JOBS: 'kalakar_jobs',
    APPLICATIONS: 'kalakar_applications',
    MESSAGES: 'kalakar_messages',
    USER: 'kalakar_user_id'
  };

  static get(key) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return data; // Return raw if not JSON
    }
  }

  static set(key, value) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, val);
  }

  static init() {
    console.log('StorageService Initialized');
    // Removed the automatic removal of 'USER' and 'creators' to prevent infinite logout loops
  }
}

StorageService.init();

export const translations = {
  en: { brandSubtitle: 'Kalakar | Entertainment OS' },
  mr: { brandSubtitle: 'कलाकार | एंटरटेनमेंट OS' }
};

export function setLanguage(lang) {
  const dictionary = translations[lang] || translations.en;
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (dictionary[key]) node.textContent = dictionary[key];
  });
}

export const StorageServiceInstance = StorageService;
