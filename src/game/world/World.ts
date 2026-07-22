import type { ComponentKey, ComponentMap } from "../components/ComponentMap";
import type { Entity, EntityId, EntityWith } from "./Entity";

export class World {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly pendingDestroy = new Set<EntityId>();
  private nextEntityId = 1;

  createEntity(components: Partial<ComponentMap> = {}, tags: string[] = []): Entity {
    const entity: Entity = {
      id: this.nextEntityId,
      tags: new Set(tags),
      components,
    };

    this.nextEntityId += 1;
    this.entities.set(entity.id, entity);
    return entity;
  }

  get(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }

  findByTag(tag: string): Entity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.tags.has(tag)) {
        return entity;
      }
    }

    return undefined;
  }

  query<TKey extends ComponentKey>(...keys: TKey[]): EntityWith<TKey>[] {
    const result: EntityWith<TKey>[] = [];

    for (const entity of this.entities.values()) {
      if (keys.every((key) => entity.components[key] !== undefined)) {
        result.push(entity as EntityWith<TKey>);
      }
    }

    return result;
  }

  destroyLater(entityId: EntityId): void {
    this.pendingDestroy.add(entityId);
  }

  flushCommands(): void {
    for (const entityId of this.pendingDestroy) {
      this.entities.delete(entityId);
    }

    this.pendingDestroy.clear();
  }

  clear(): void {
    this.pendingDestroy.clear();
    this.entities.clear();
  }
}
