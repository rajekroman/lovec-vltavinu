import type { InputManager } from "../../engine/input/InputManager";
import type { World } from "../world/World";

export class PlayerControlSystem {
  constructor(
    private readonly world: World,
    private readonly input: InputManager,
  ) {}

  update(): void {
    const player = this.world
      .query("movement")
      .find((entity) => entity.tags.has("player"));

    if (!player) {
      return;
    }

    const move = this.input.getMove();
    player.components.movement.desiredDirection.set(move.x, move.y);
  }

  stop(): void {
    const player = this.world
      .query("movement")
      .find((entity) => entity.tags.has("player"));

    if (player) {
      player.components.movement.desiredDirection.set(0, 0);
      player.components.movement.velocity.set(0, 0);
    }
  }
}
