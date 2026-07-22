export interface Bounds2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class SpatialHash<TValue> {
  private readonly cells = new Map<string, Set<TValue>>();

  constructor(private readonly cellSize: number) {}

  clear(): void {
    this.cells.clear();
  }

  insert(value: TValue, bounds: Bounds2D): void {
    this.forEachCell(bounds, (key) => {
      let cell = this.cells.get(key);

      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }

      cell.add(value);
    });
  }

  query(bounds: Bounds2D): Set<TValue> {
    const result = new Set<TValue>();

    this.forEachCell(bounds, (key) => {
      for (const value of this.cells.get(key) ?? []) {
        result.add(value);
      }
    });

    return result;
  }

  private forEachCell(bounds: Bounds2D, callback: (key: string) => void): void {
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellZ = Math.floor(bounds.minZ / this.cellSize);
    const maxCellZ = Math.floor(bounds.maxZ / this.cellSize);

    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let z = minCellZ; z <= maxCellZ; z += 1) {
        callback(`${x}:${z}`);
      }
    }
  }
}
