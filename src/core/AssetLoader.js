export class AssetLoader {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.loaders = new Map();
    this.cache = new Map();
  }

  register(type, loader) {
    if (typeof type !== "string" || !type) throw new TypeError("Asset type must be a non-empty string.");
    if (typeof loader !== "function") throw new TypeError("Asset loader must be a function.");
    this.loaders.set(type, loader);
    return () => this.loaders.delete(type);
  }

  key(entry) {
    if (!entry || typeof entry !== "object") throw new TypeError("Asset entry must be an object.");
    if (!entry.id || !entry.type) throw new Error("Asset entry requires id and type.");
    return `${entry.type}:${entry.id}`;
  }

  load(entry) {
    const key = this.key(entry);
    if (this.cache.has(key)) return this.cache.get(key);

    const loader = this.loaders.get(entry.type);
    if (!loader) return Promise.reject(new Error(`No loader registered for asset type: ${entry.type}`));

    this.events?.emit("asset:load:start", { id: entry.id, type: entry.type });
    const promise = Promise.resolve()
      .then(() => loader(entry))
      .then(asset => {
        this.events?.emit("asset:load:complete", { id: entry.id, type: entry.type });
        return asset;
      })
      .catch(error => {
        this.cache.delete(key);
        this.events?.emit("asset:load:error", {
          id: entry.id,
          type: entry.type,
          message: error instanceof Error ? error.message : String(error)
        });
        throw error;
      });

    this.cache.set(key, promise);
    return promise;
  }

  async loadAll(entries, options = {}) {
    if (!Array.isArray(entries)) throw new TypeError("Asset manifest must be an array.");
    const total = entries.length;
    let completed = 0;
    const result = new Map();

    await Promise.all(entries.map(async entry => {
      const asset = await this.load(entry);
      result.set(entry.id, asset);
      completed++;
      options.onProgress?.({ completed, total, ratio: total ? completed / total : 1, entry });
    }));

    return result;
  }

  async get(id, type) {
    return this.cache.get(`${type}:${id}`) ?? null;
  }

  has(id, type) {
    return this.cache.has(`${type}:${id}`);
  }

  unload(id, type, disposer = null) {
    const key = `${type}:${id}`;
    const assetPromise = this.cache.get(key);
    if (!assetPromise) return false;
    this.cache.delete(key);
    if (typeof disposer === "function") {
      Promise.resolve(assetPromise).then(asset => disposer(asset)).catch(() => {});
    }
    return true;
  }

  clear(disposer = null) {
    const entries = [...this.cache.entries()];
    this.cache.clear();
    if (typeof disposer === "function") {
      for (const [, promise] of entries) Promise.resolve(promise).then(asset => disposer(asset)).catch(() => {});
    }
  }
}
