import { HybridRenderer } from "./HybridRenderer.js";

export class ThreeRenderer extends HybridRenderer {
  constructor(options = {}) {
    super(options);
    this.maxInternalPixels = options.maxInternalPixels ?? 1_800_000;
    this.objectByEntity = new Map();
  }

  resize(width, height, pixelRatio = globalThis.devicePixelRatio ?? 1) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    const areaRatio = Math.sqrt(this.maxInternalPixels / (safeWidth * safeHeight));
    const adaptiveRatio = Math.min(pixelRatio || 1, Number.isFinite(areaRatio) ? areaRatio : 1);
    return super.resize(safeWidth, safeHeight, adaptiveRatio);
  }

  resizeToElement(element = this.canvas) {
    const bounds = element.getBoundingClientRect();
    return this.resize(bounds.width, bounds.height, globalThis.devicePixelRatio ?? 1);
  }

  bindEntity(entity, object, layer = "actors") {
    if (this.objectByEntity.has(entity)) this.unbindEntity(entity);
    this.objectByEntity.set(entity, object);
    this.add(object, layer);
    return object;
  }

  unbindEntity(entity, dispose = true) {
    const object = this.objectByEntity.get(entity);
    if (!object) return false;
    this.objectByEntity.delete(entity);
    this.remove(object);
    if (dispose) this.disposeObject(object);
    return true;
  }

  syncWorld(world, alpha = 1) {
    for (const [entity, transform] of world.query("transform")) {
      const object = this.objectByEntity.get(entity);
      if (!object) continue;
      const previous = world.get(entity, "previousTransform") ?? transform;
      object.position.x = previous.x + (transform.x - previous.x) * alpha;
      object.position.y = previous.y + (transform.y - previous.y) * alpha;
      object.rotation.z = transform.rotation ?? 0;
    }
  }

  dispose() {
    this.objectByEntity.clear();
    super.dispose();
  }
}
