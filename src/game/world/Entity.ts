import type { ComponentKey, ComponentMap } from "../components/ComponentMap";

export type EntityId = number;

export interface Entity {
  id: EntityId;
  tags: Set<string>;
  components: Partial<ComponentMap>;
}

export type EntityWith<TKey extends ComponentKey> = Entity & {
  components: Partial<ComponentMap> & Required<Pick<ComponentMap, TKey>>;
};
