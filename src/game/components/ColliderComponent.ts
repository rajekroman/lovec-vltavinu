export const CollisionLayer = {
  PLAYER: 1 << 0,
  NPC: 1 << 1,
  WORLD: 1 << 2,
  HAZARD: 1 << 3,
  INTERACTION: 1 << 4,
} as const;

export interface CircleColliderComponent {
  shape: "circle";
  radius: number;
  layer: number;
  mask: number;
  isTrigger: boolean;
}

export type ColliderComponent = CircleColliderComponent;
