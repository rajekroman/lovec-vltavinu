const STORAGE_KEY = "lovec-vltavinu-locale";
const SUPPORTED_LOCALES = ["cs", "en"];
const DEFAULT_LOCALE = "cs";

export class I18n {
  #locale;
  #translations = {};
  #listeners = new Set();

  constructor(locale = DEFAULT_LOCALE) {
    this.#locale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  }

  get locale() {
    return this.#locale;
  }

  load(locale, translations) {
    this.#translations[locale] = translations;
  }

  setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) return;
    if (locale === this.#locale) return;
    this.#locale = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
    this.#listeners.forEach(fn => fn(locale));
  }

  t(key, fallback = key) {
    const parts = key.split(".");
    let node = this.#translations[this.#locale];
    for (const part of parts) {
      if (!node || typeof node !== "object") return fallback;
      node = node[part];
    }
    return typeof node === "string" ? node : fallback;
  }

  onChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  static getSavedLocale() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  }
}

export const SUPPORTED = SUPPORTED_LOCALES;
