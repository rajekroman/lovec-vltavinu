import * as THREE from "three";
import type { World } from "../../game/world/World";

export class RenderSyncSystem {
  private readonly interpolated = new THREE.Vector3();

  constructor(private readonly world: World) {}

  update(alpha: number): void {
    for (const entity of this.world.query("transform", "renderable")) {
      const { transform, renderable } = entity.components;

      this.interpolated.lerpVectors(
        transform.previousPosition,
        transform.position,
        alpha,
      );

      renderable.object.position.copy(this.interpolated);
      renderable.object.position.y += renderable.verticalOffset;
      renderable.object.rotation.y = THREE.MathUtils.lerp(
        transform.previousRotationY,
        transform.rotationY,
        alpha,
      );
      renderable.object.scale.copy(transform.scale);
    }
  }
}
