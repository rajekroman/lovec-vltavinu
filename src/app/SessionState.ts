import type { MoldaviteStone } from "../game/mechanics/Moldavite";
import type { LevelId } from "../game/levels/LevelData";

export interface SessionState {
  currentLevelId: LevelId;
  currentLevelIndex: number;
  foundCount: number;
  collectionScore: number;
  stones: MoldaviteStone[];
}

export function createSessionState(): SessionState {
  return {
    currentLevelId: "chlum",
    currentLevelIndex: 0,
    foundCount: 0,
    collectionScore: 0,
    stones: [],
  };
}
