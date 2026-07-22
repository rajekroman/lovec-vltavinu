import type { AnimatorComponent } from "./AnimatorComponent";
import type { ColliderComponent } from "./ColliderComponent";
import type { InteractableComponent } from "./InteractableComponent";
import type { MovementComponent } from "./MovementComponent";
import type { RenderableComponent } from "./RenderableComponent";
import type { TransformComponent } from "./TransformComponent";

export interface ComponentMap {
  transform: TransformComponent;
  movement: MovementComponent;
  collider: ColliderComponent;
  renderable: RenderableComponent;
  animator: AnimatorComponent;
  interactable: InteractableComponent;
}

export type ComponentKey = keyof ComponentMap;
