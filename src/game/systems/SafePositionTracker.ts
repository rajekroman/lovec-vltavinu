export interface Position2D {
  x: number;
  z: number;
}

export interface SafePositionTrackerOptions {
  /** Maximum residual alarm at which a position is still considered safe. */
  maxAlarmValue?: number;
}

/**
 * Keeps a small gameplay checkpoint without becoming a save system.
 *
 * The checkpoint exists only for the current scene. It is used when a hazard
 * reaches its critical alarm threshold so the player is moved back to the
 * last position from which the danger had not yet been detected.
 */
export class SafePositionTracker {
  private readonly maxAlarmValue: number;
  private safePosition: Position2D;

  constructor(
    initialPosition: Position2D,
    options: SafePositionTrackerOptions = {},
  ) {
    this.maxAlarmValue = options.maxAlarmValue ?? 0.28;
    this.safePosition = this.copyPosition(initialPosition);
  }

  remember(position: Position2D, alarmValue: number): void {
    if (alarmValue > this.maxAlarmValue) {
      return;
    }

    this.safePosition = this.copyPosition(position);
  }

  get(): Position2D {
    return this.copyPosition(this.safePosition);
  }

  restore(position: Position2D): void {
    position.x = this.safePosition.x;
    position.z = this.safePosition.z;
  }

  private copyPosition(position: Position2D): Position2D {
    return { x: position.x, z: position.z };
  }
}
