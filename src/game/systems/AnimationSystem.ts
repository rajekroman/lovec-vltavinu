import type { SpriteDirection } from "../../engine/animation/SpriteAnimator";
import type { EntityId } from "../world/Entity";
import type { World } from "../world/World";

export class AnimationSystem {
  private readonly directionByEntity = new Map<EntityId, SpriteDirection>();

  constructor(private readonly world: World) {}

  getDirection(entityId: EntityId): SpriteDirection {
    return this.directionByEntity.get(entityId) ?? "south";
  }

  update(dt: number): void {
    for (const entity of this.world.query("movement", "animator")) {
      const { movement, animator } = entity.components;
      const moving = movement.velocity.lengthSq() > 0.04;
      let direction = this.directionByEntity.get(entity.id) ?? "south";

      if (moving) {
        if (Math.abs(movement.velocity.x) > Math.abs(movement.velocity.y)) {
          direction = movement.velocity.x < 0 ? "west" : "east";
        } else {
          direction = movement.velocity.y < 0 ? "north" : "south";
        }

        this.directionByEntity.set(entity.id, direction);
      }

      animator.animator.setState(moving ? "walk" : "idle", direction);
      animator.animator.update(dt);
    }
  }
}
