/**
 * SpriteAtlas — Sprite sheet metadata and frame management
 * Based on Claude Design specifications for character poses and animations
 */

/**
 * NPC Character specifications from design artboards
 * Each character: 120px width × 160px height per frame
 * Color scheme: #d4a574 primary, #8b9d6f accent, #5a6b4a shadow
 */
export const NPC_SPRITES = Object.freeze({
  farmer_vaclav: {
    name: "Václav (Farmer)",
    assetId: "npc-farmer-vaclav-atlas",
    width: 120,
    height: 160,
    frames: {
      neutral: 0,
      talking: 1,
      concerned: 2,
      welcoming: 3,
      pointing: 4
    },
    animations: {
      idle: {
        frames: [0],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [1, 0, 1, 0],
        fps: 3,
        loop: true
      },
      react_concern: {
        frames: [2],
        fps: 1,
        loop: false
      },
      react_welcome: {
        frames: [3],
        fps: 1,
        loop: false
      },
      action_point: {
        frames: [4, 3, 4],
        fps: 4,
        loop: false
      }
    }
  },

  forester_jan: {
    name: "Jan (Forester)",
    assetId: "npc-forester-jan-atlas",
    width: 120,
    height: 160,
    frames: {
      alert: 0,
      serious: 1,
      relaxed: 2,
      warning: 3,
      beckoning: 4
    },
    animations: {
      idle: {
        frames: [2],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [1, 2, 1, 2],
        fps: 3,
        loop: true
      },
      react_alert: {
        frames: [0],
        fps: 1,
        loop: false
      },
      react_warning: {
        frames: [3, 1, 3],
        fps: 4,
        loop: false
      },
      action_beckon: {
        frames: [4, 2, 4],
        fps: 4,
        loop: false
      }
    }
  },

  guide_milan: {
    name: "Milan (Quarry Guide)",
    assetId: "npc-guide-milan-atlas",
    width: 120,
    height: 160,
    frames: {
      neutral: 0,
      talking_a: 1,
      talking_b: 2,
      explaining: 3,
      approving: 4
    },
    animations: {
      idle: {
        frames: [0],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [1, 0, 2, 0],
        fps: 3,
        loop: true
      },
      action_explain: {
        frames: [3, 0, 3],
        fps: 4,
        loop: false
      },
      react_approve: {
        frames: [4],
        fps: 1,
        loop: false
      }
    }
  },

  expert_eva: {
    name: "Eva (Expert)",
    assetId: "npc-expert-eva-atlas",
    width: 120,
    height: 160,
    frames: {
      explaining: 0,
      curious: 1,
      pondering: 2,
      affirming: 3,
      skeptical: 4
    },
    animations: {
      idle: {
        frames: [3],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [0, 1, 0, 2],
        fps: 3,
        loop: true
      },
      react_curious: {
        frames: [1],
        fps: 1,
        loop: false
      },
      react_pondering: {
        frames: [2, 3, 2],
        fps: 3,
        loop: false
      },
      react_skeptical: {
        frames: [4],
        fps: 1,
        loop: false
      }
    }
  },

  rival_karel: {
    name: "Karel (Rival)",
    assetId: "npc-rival-karel-atlas",
    width: 120,
    height: 160,
    frames: {
      neutral: 0,
      aggressive: 1,
      smug: 2,
      warning: 3,
      backing_away: 4
    },
    animations: {
      idle: {
        frames: [0],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [1, 2, 1, 0],
        fps: 3,
        loop: true
      },
      react_aggressive: {
        frames: [1, 0, 1],
        fps: 4,
        loop: false
      },
      react_smug: {
        frames: [2],
        fps: 1,
        loop: false
      },
      action_back_away: {
        frames: [4, 3, 4, 0],
        fps: 4,
        loop: false
      }
    }
  },

  thief_franta: {
    name: "František (Guide/Thief)",
    assetId: "npc-thief-franta-atlas",
    width: 120,
    height: 160,
    frames: {
      neutral: 0,
      mysterious: 1,
      scheming: 2,
      friendly: 3,
      warning: 4
    },
    animations: {
      idle: {
        frames: [3],
        fps: 1,
        loop: true
      },
      talk: {
        frames: [1, 3, 2, 3],
        fps: 3,
        loop: true
      },
      react_mysterious: {
        frames: [1, 2, 1],
        fps: 3,
        loop: false
      },
      react_friendly: {
        frames: [3],
        fps: 1,
        loop: false
      },
      react_warning: {
        frames: [4, 1, 4],
        fps: 4,
        loop: false
      }
    }
  }
});

/**
 * Shared animation sequences (used across multiple NPCs)
 * These are triggered by game events
 */
export const SHARED_ANIMATIONS = Object.freeze({
  interact: {
    name: "Shoulder Shrug (Interact)",
    frames: [0, 1, 2, 1],
    fps: 8,
    loop: false,
    duration_ms: 500,
    trigger: "interaction"
  },

  success: {
    name: "Celebration (Success)",
    frames: [0, 1, 2, 3, 2, 1],
    fps: 8,
    loop: false,
    duration_ms: 750,
    trigger: "finding_complete",
    peak_frame: 3
  }
});

/**
 * Get animation frames for a character + animation state
 * @param {string} characterKey - Key from NPC_SPRITES
 * @param {string} animationName - Animation name (e.g., "talk", "idle")
 * @returns {object|null} Animation spec { frames, fps, loop } or null if not found
 */
export function getCharacterAnimation(characterKey, animationName) {
  const character = NPC_SPRITES[characterKey];
  if (!character) return null;
  return character.animations?.[animationName] || null;
}

/**
 * Get frame index for a character's pose
 * @param {string} characterKey - Key from NPC_SPRITES
 * @param {string} poseName - Pose name (e.g., "neutral", "talking")
 * @returns {number|null} Frame index or null if not found
 */
export function getCharacterFrame(characterKey, poseName) {
  const character = NPC_SPRITES[characterKey];
  if (!character) return null;
  return character.frames?.[poseName] ?? null;
}

/**
 * Calculate texture coordinates for a frame in a sprite atlas
 * Assumes single row layout: frames are arranged left-to-right
 * @param {number} frameIndex - Frame index
 * @param {number} frameWidth - Width of each frame
 * @param {number} frameHeight - Height of each frame
 * @param {number} atlasWidth - Total atlas width
 * @returns {object} { u: 0..1, v: 0..1, uSize: 0..1, vSize: 0..1 }
 */
export function calculateSpriteTexCoord(frameIndex, frameWidth, frameHeight, atlasWidth) {
  const framesPerRow = Math.floor(atlasWidth / frameWidth);
  const row = Math.floor(frameIndex / framesPerRow);
  const col = frameIndex % framesPerRow;

  const u = (col * frameWidth) / atlasWidth;
  const v = (row * frameHeight) / atlasWidth; // Assuming square or portrait atlas

  return {
    u,
    v,
    uSize: frameWidth / atlasWidth,
    vSize: frameHeight / atlasWidth
  };
}

/**
 * Animation player for sprite frame sequencing
 * Manages playback of animation sequences
 */
export class SpriteAnimator {
  constructor(initialFrame = 0) {
    this.currentFrame = initialFrame;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.isPlaying = false;
    this.animation = null;
  }

  /**
   * Start playing an animation
   * @param {object} animSpec - Animation spec { frames, fps, loop }
   */
  playAnimation(animSpec) {
    if (!animSpec || !animSpec.frames) return;
    this.animation = animSpec;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.isPlaying = true;
    this.updateFrame();
  }

  /**
   * Update animator (call every frame)
   * @param {number} deltaMs - Time elapsed since last update (ms)
   */
  update(deltaMs) {
    if (!this.isPlaying || !this.animation) return false;

    this.elapsed += deltaMs;
    const frameDuration = 1000 / this.animation.fps;
    const newFrameIndex = Math.floor(this.elapsed / frameDuration);

    if (newFrameIndex >= this.animation.frames.length) {
      if (this.animation.loop) {
        this.frameIndex = newFrameIndex % this.animation.frames.length;
        this.elapsed = (newFrameIndex % this.animation.frames.length) * frameDuration;
      } else {
        this.isPlaying = false;
        this.frameIndex = this.animation.frames.length - 1;
        this.updateFrame();
        return false; // Animation finished
      }
    } else {
      this.frameIndex = newFrameIndex;
    }

    this.updateFrame();
    return true;
  }

  updateFrame() {
    if (this.animation && this.animation.frames) {
      this.currentFrame = this.animation.frames[this.frameIndex];
    }
  }

  getCurrentFrame() {
    return this.currentFrame;
  }

  isAnimationFinished() {
    return !this.isPlaying;
  }
}
