export function createAnimation(options = {}) {
  const frames = Array.isArray(options.frames) ? [...options.frames] : [];
  if (!frames.length) throw new Error("Animation requires at least one frame.");
  const fps = options.fps ?? 8;
  if (!(fps > 0)) throw new RangeError("Animation fps must be greater than zero.");
  return {
    clip: options.clip ?? "default",
    frames,
    fps,
    loop: options.loop !== false,
    playing: options.playing !== false,
    index: Math.max(0, Math.min(frames.length - 1, options.index ?? 0)),
    elapsed: Math.max(0, options.elapsed ?? 0),
    completed: false,
    frame: frames[Math.max(0, Math.min(frames.length - 1, options.index ?? 0))]
  };
}

export class AnimationSystem {
  constructor(options = {}) {
    this.events = options.events ?? null;
  }

  play(animation, options = {}) {
    if (!animation?.frames?.length) throw new TypeError("Invalid animation component.");
    if (options.restart) {
      animation.index = 0;
      animation.elapsed = 0;
      animation.frame = animation.frames[0];
    }
    animation.completed = false;
    animation.playing = true;
    return animation;
  }

  pause(animation) {
    animation.playing = false;
    return animation;
  }

  updateAnimation(animation, dt, entity = null) {
    if (!animation.playing || animation.completed || animation.frames.length < 2) return false;
    const frameDuration = 1 / animation.fps;
    animation.elapsed += Math.max(0, dt);
    let changed = false;

    while (animation.elapsed >= frameDuration && animation.playing) {
      animation.elapsed -= frameDuration;
      if (animation.index < animation.frames.length - 1) {
        animation.index++;
      } else if (animation.loop) {
        animation.index = 0;
      } else {
        animation.index = animation.frames.length - 1;
        animation.completed = true;
        animation.playing = false;
        animation.elapsed = 0;
        this.events?.emit("animation:complete", { entity, clip: animation.clip });
      }
      animation.frame = animation.frames[animation.index];
      changed = true;
    }

    if (changed) this.events?.emit("animation:frame", {
      entity,
      clip: animation.clip,
      frame: animation.frame
    });
    return changed;
  }

  update(world, dt) {
    let changed = 0;
    for (const [entity, animation] of world.query("animation")) {
      if (this.updateAnimation(animation, dt, entity)) changed++;
    }
    return changed;
  }
}
