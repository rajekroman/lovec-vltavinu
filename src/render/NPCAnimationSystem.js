/**
 * NPCAnimationSystem — Manages NPC sprite animations in scenes
 * Integrates SpriteAtlas metadata with Three.js sprite rendering
 */

import { getCharacterAnimation, getCharacterFrame, SpriteAnimator } from "./SpriteAtlas.js";

/**
 * Creates an animated NPC sprite using the sprite atlas system
 * @param {object} THREE - Three.js module
 * @param {object} renderer - ThreeRenderer instance
 * @param {string} characterKey - NPC key from SpriteAtlas.NPC_SPRITES
 * @param {object} spriteSpec - { assetId, width, height, texture } — texture is the already-loaded atlas texture
 * @param {object} options - Position/scale options
 * @returns {object} { sprite, animator, playAnimation, setFrame }
 */
export function createAnimatedNPC(THREE, renderer, characterKey, spriteSpec, options = {}) {
  const { assetId, width, height, texture } = spriteSpec;

  // Create sprite using atlas texture
  const sprite = renderer.createSprite(texture, {
    width: options.width || width,
    height: options.height || height,
    z: options.z || 10,
    anchorX: options.anchorX || 0.5,
    anchorY: options.anchorY || 0.08,
    assetId,
    ...options
  });

  const animator = new SpriteAnimator(0);

  // API for animation control
  return {
    sprite,
    animator,

    /**
     * Play an animation sequence
     * @param {string} animationName - Name of animation (e.g., "talk", "idle")
     */
    playAnimation(animationName) {
      const animSpec = getCharacterAnimation(characterKey, animationName);
      if (animSpec) {
        animator.playAnimation(animSpec);
      }
    },

    /**
     * Set a static frame/pose
     * @param {string} poseName - Pose name (e.g., "neutral", "talking")
     */
    setFrame(poseName) {
      const frameIdx = getCharacterFrame(characterKey, poseName);
      if (frameIdx !== null) {
        animator.currentFrame = frameIdx;
        updateSpriteFrame(sprite, frameIdx, width);
      }
    },

    /**
     * Update animator each frame (call from scene update)
     * @param {number} deltaMs - Time delta in milliseconds
     * @returns {boolean} true if animation is still playing
     */
    update(deltaMs) {
      const isPlaying = animator.update(deltaMs);
      updateSpriteFrame(sprite, animator.getCurrentFrame(), width);
      return isPlaying;
    },

    /**
     * Get current animation state
     * @returns {object} { isPlaying, currentFrame, animation }
     */
    getState() {
      return {
        isPlaying: animator.isPlaying,
        currentFrame: animator.currentFrame,
        animation: animator.animation?.name || "none"
      };
    }
  };
}

/**
 * Internal helper to update sprite texture coordinates
 * Assumes single-row sprite sheet layout (frames arranged horizontally)
 * @param {THREE.Sprite} sprite - Sprite object
 * @param {number} frameIndex - Frame index
 * @param {number} frameWidth - Width of each frame in pixels
 */
function updateSpriteFrame(sprite, frameIndex, frameWidth) {
  if (!sprite || !sprite.material) return;

  const material = sprite.material;
  if (!material.map) return;

  const atlasWidth = material.map.source.data.width;
  const framesPerRow = Math.floor(atlasWidth / frameWidth);

  const col = frameIndex % framesPerRow;
  const u = (col * frameWidth) / atlasWidth;

  material.map.offset.x = u;
  material.map.repeat.x = frameWidth / atlasWidth;

  material.needsUpdate = true;
}

/**
 * Hook: Play animation when NPC enters dialogue
 * @param {object} npcSprite - Result of createAnimatedNPC()
 * @param {string} dialoguePhase - Phase of dialogue ("start", "middle", "end")
 */
export function playDialogueAnimation(npcSprite, dialoguePhase = "start") {
  const animMap = {
    start: "talk",
    middle: "talk",
    end: "idle",
    react_positive: "react_welcome",
    react_negative: "react_concern"
  };

  const animName = animMap[dialoguePhase] || "idle";
  npcSprite.playAnimation(animName);
}
