import * as THREE from "three";
import type { World } from "../world/World";

export class MovementSystem {
  constructor(private readonly world: World) {}

  update(dt: number): void {
    for (const entity of this.world.query("movement")) {
      const movement = entity.components.movement;
      const targetX = movement.desiredDirection.x * movement.maxSpeed;
      const targetY = movement.desiredDirection.y * movement.maxSpeed;
      const maxDelta = movement.acceleration * dt;

      movement.velocity.x = this.moveTowards(movement.velocity.x, targetX, maxDelta);
      movement.velocity.y = this.moveTowards(movement.velocity.y, targetY, maxDelta);

      if (movement.desiredDirection.lengthSq() === 0 && movement.velocity.lengthSq() < 0.0025) {
        movement.velocity.set(0, 0);
      }
    }
  }

  private moveTowards(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }

    return current + Math.sign(target - current) * THREE.MathUtils.clamp(maxDelta, 0, Infinity);
  }
}
