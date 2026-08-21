// Persistence adapter - handles localStorage operations
// Keeps persistence logic isolated from game modules

export class StorageAdapter {
  constructor(storageKey, defaultValue = {}) {
    this.storageKey = storageKey;
    this.defaultValue = defaultValue;
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.defaultValue;
    } catch (error) {
      return this.defaultValue;
    }
  }

  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      // Handle save failure gracefully
    }
  }
}
