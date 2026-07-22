import * as THREE from "three";
import { SpatialHash, type Bounds2D } from "./SpatialHash";

export interface StaticCollider extends Bounds2D {
  id: string;
  layer: number;
  mask: number;
}

export interface WorldBounds extends Bounds2D {}

export interface CollisionFilter {
  layer: number;
  mask: number;
}

export class CollisionWorld {
  private readonly staticHash = new SpatialHash<StaticCollider>(4);
  private readonly staticColliders: StaticCollider[] = [];
  private bounds: WorldBounds = {
    minX: -20,
    maxX: 20,
    minZ: -20,
    maxZ: 20,
  };

  setBounds(bounds: WorldBounds): void {
    this.bounds = bounds;
  }

  addStatic(collider: StaticCollider): void {
    this.staticColliders.push(collider);
    this.staticHash.insert(collider, collider);
  }

  moveCircle(
    position: THREE.Vector3,
    delta: THREE.Vector2,
    radius: number,
    filter: CollisionFilter,
  ): void {
    const targetX = THREE.MathUtils.clamp(
      position.x + delta.x,
      this.bounds.minX + radius,
      this.bounds.maxX - radius,
    );

    position.x = this.resolveAxisX(targetX, position.z, delta.x, radius, filter);

    const targetZ = THREE.MathUtils.clamp(
      position.z + delta.y,
      this.bounds.minZ + radius,
      this.bounds.maxZ - radius,
    );

    position.z = this.resolveAxisZ(position.x, targetZ, delta.y, radius, filter);
  }

  clear(): void {
    this.staticColliders.length = 0;
    this.staticHash.clear();
  }

  private resolveAxisX(
    targetX: number,
    z: number,
    direction: number,
    radius: number,
    filter: CollisionFilter,
  ): number {
    const candidates = this.staticHash.query({
      minX: Math.min(targetX, targetX - direction) - radius,
      maxX: Math.max(targetX, targetX - direction) + radius,
      minZ: z - radius,
      maxZ: z + radius,
    });

    let resolved = targetX;

    for (const collider of candidates) {
      if (!this.canCollide(filter, collider)) {
        continue;
      }

      const overlapsZ = z + radius > collider.minZ && z - radius < collider.maxZ;
      const overlapsX = resolved + radius > collider.minX && resolved - radius < collider.maxX;

      if (!overlapsZ || !overlapsX) {
        continue;
      }

      resolved = direction >= 0 ? collider.minX - radius : collider.maxX + radius;
    }

    return resolved;
  }

  private resolveAxisZ(
    x: number,
    targetZ: number,
    direction: number,
    radius: number,
    filter: CollisionFilter,
  ): number {
    const candidates = this.staticHash.query({
      minX: x - radius,
      maxX: x + radius,
      minZ: Math.min(targetZ, targetZ - direction) - radius,
      maxZ: Math.max(targetZ, targetZ - direction) + radius,
    });

    let resolved = targetZ;

    for (const collider of candidates) {
      if (!this.canCollide(filter, collider)) {
        continue;
      }

      const overlapsX = x + radius > collider.minX && x - radius < collider.maxX;
      const overlapsZ = resolved + radius > collider.minZ && resolved - radius < collider.maxZ;

      if (!overlapsX || !overlapsZ) {
        continue;
      }

      resolved = direction >= 0 ? collider.minZ - radius : collider.maxZ + radius;
    }

    return resolved;
  }

  private canCollide(source: CollisionFilter, target: StaticCollider): boolean {
    return (source.mask & target.layer) !== 0 && (target.mask & source.layer) !== 0;
  }
}
