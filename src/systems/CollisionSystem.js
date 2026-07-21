const pairKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;

export function circleIntersectsCircle(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy <= radius * radius;
}

export function aabbIntersectsAabb(a, b) {
  return Math.abs(a.x - b.x) * 2 <= a.width + b.width
    && Math.abs(a.y - b.y) * 2 <= a.height + b.height;
}

export function circleIntersectsAabb(circle, box) {
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const closestX = Math.max(box.x - halfWidth, Math.min(circle.x, box.x + halfWidth));
  const closestY = Math.max(box.y - halfHeight, Math.min(circle.y, box.y + halfHeight));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function colliderBounds(collider) {
  if (collider.shape === "circle") {
    return {
      minX: collider.x - collider.radius,
      minY: collider.y - collider.radius,
      maxX: collider.x + collider.radius,
      maxY: collider.y + collider.radius
    };
  }
  return {
    minX: collider.x - collider.width / 2,
    minY: collider.y - collider.height / 2,
    maxX: collider.x + collider.width / 2,
    maxY: collider.y + collider.height / 2
  };
}

export function intersects(a, b) {
  if (a.shape === "circle" && b.shape === "circle") return circleIntersectsCircle(a, b);
  if (a.shape === "aabb" && b.shape === "aabb") return aabbIntersectsAabb(a, b);
  if (a.shape === "circle") return circleIntersectsAabb(a, b);
  return circleIntersectsAabb(b, a);
}

export class CollisionSystem {
  constructor(options = {}) {
    this.cellSize = options.cellSize ?? 128;
    this.events = options.events ?? null;
    this.filter = options.filter ?? (() => true);
    this.previousPairs = new Set();
    if (!(this.cellSize > 0)) throw new RangeError("cellSize must be greater than zero.");
  }

  worldCollider(entity, transform, collider) {
    const x = (transform.x ?? 0) + (collider.offsetX ?? 0);
    const y = (transform.y ?? 0) + (collider.offsetY ?? 0);
    if (collider.shape === "circle") {
      return { entity, shape: "circle", x, y, radius: collider.radius ?? 0, source: collider };
    }
    return {
      entity,
      shape: "aabb",
      x,
      y,
      width: collider.width ?? 0,
      height: collider.height ?? 0,
      source: collider
    };
  }

  update(world) {
    const colliders = [];
    for (const [entity, transform, collider] of world.query("transform", "collider")) {
      if (collider.enabled === false) continue;
      colliders.push(this.worldCollider(entity, transform, collider));
    }

    const grid = new Map();
    for (const collider of colliders) {
      const bounds = colliderBounds(collider);
      const minCellX = Math.floor(bounds.minX / this.cellSize);
      const maxCellX = Math.floor(bounds.maxX / this.cellSize);
      const minCellY = Math.floor(bounds.minY / this.cellSize);
      const maxCellY = Math.floor(bounds.maxY / this.cellSize);
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
          const key = `${cellX},${cellY}`;
          let bucket = grid.get(key);
          if (!bucket) grid.set(key, bucket = []);
          bucket.push(collider);
        }
      }
    }

    const checked = new Set();
    const currentPairs = new Set();
    const collisions = [];

    for (const bucket of grid.values()) {
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) {
          const a = bucket[i];
          const b = bucket[j];
          const key = pairKey(a.entity, b.entity);
          if (checked.has(key)) continue;
          checked.add(key);
          if (!this.filter(a, b) || !intersects(a, b)) continue;

          currentPairs.add(key);
          const phase = this.previousPairs.has(key) ? "stay" : "enter";
          const collision = { key, phase, a, b };
          collisions.push(collision);
          this.events?.emit(`collision:${phase}`, collision);
        }
      }
    }

    for (const key of this.previousPairs) {
      if (!currentPairs.has(key)) this.events?.emit("collision:exit", { key, phase: "exit" });
    }
    this.previousPairs = currentPairs;
    return collisions;
  }

  reset() {
    this.previousPairs.clear();
  }
}
