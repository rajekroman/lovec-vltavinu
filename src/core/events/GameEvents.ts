import type { EntityId } from "../../game/world/Entity";
import type { MoldaviteStone } from "../../game/mechanics/Moldavite";

export interface GameEvents {
  "assets:progress": {
    loaded: number;
    total: number;
    assetId: string;
  };
  "interaction:focusChanged": {
    entityId: EntityId | null;
    label: string | null;
  };
  "interaction:triggered": {
    entityId: EntityId;
    kind: string;
  };
  "dialog:shown": {
    speaker: string;
    text: string;
    durationMs?: number;
  };
  "permission:changed": {
    granted: boolean;
  };
  "collection:certified": {
    stoneCount: number;
    localityCount: number;
  };
  "digging:requested": {
    entityId: EntityId;
  };
  "digging:stateChanged": {
    active: boolean;
    cursor: number;
    targetStart: number;
    targetEnd: number;
    hits: number;
    requiredHits: number;
    misses: number;
    feedback: "none" | "hit" | "miss";
  };
  "digging:completed": {
    entityId: EntityId;
    quality: "A" | "B" | "C";
    score: number;
    misses: number;
  };
  "collectible:found": {
    name: string;
    quality: "A" | "B" | "C";
    score: number;
    stone: MoldaviteStone;
  };
  "hole:filled": {
    entityId: EntityId;
  };
  "level:completed": {
    levelId: string;
    score: number;
    final: boolean;
  };
  "game:completed": {
    score: number;
    foundCount: number;
  };
  "danger:changed": {
    active: boolean;
    label: string;
    value: number;
  };
  "danger:critical": {
    label: string;
  };
  "objective:changed": {
    text: string;
  };
  "ui:toastRequested": {
    text: string;
    durationMs?: number;
  };
  "game:pauseChanged": {
    paused: boolean;
  };
}
