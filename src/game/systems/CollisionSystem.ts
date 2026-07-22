import * as THREE from "three";
import type { CollisionWorld } from "../../engine/collision/CollisionWorld";
import type { World } from "../world/World";

export class CollisionSystem {
  private readonly delta = new THREE.Vector2();

  constructor(
    private readonly world: World,
    private readonly collisionWorld: CollisionWorld,
  ) {}

  update(dt: number): void {
    for (const entity of this.world.query("transform", "movement", "collider")) {
      const { transform, movement, collider } = entity.components;

      transform.previousPosition.copy(transform.position);
      transform.previousRotationY = transform.rotationY;

      if (collider.isTrigger) {
        transform.position.x += movement.velocity.x * dt;
        transform.position.z += movement.velocity.y * dt;
        continue;
      }

      this.delta.set(movement.velocity.x * dt, movement.velocity.y * dt);
      this.collisionWorld.moveCircle(
        transform.position,
        this.delta,
        collider.radius,
        { layer: collider.layer, mask: collider.mask },
      );
    }
  }
}
