/**
 * NPCAnimationSystem — Manages NPC sprite animations in scenes
 * Integrates SpriteAtlas metadata with Three.js sprite rendering
 */

import { getCharacterAnimation, getCharacterFrame, SpriteAnimator, NPC_SPRITES } from "./SpriteAtlas.js";

const activeDialogueAnimations = new Set();
const dialogueAdvancers = new WeakMap();
let npcAnimationsPaused = false;

export function setNpcAnimationsPaused(paused) {
  npcAnimationsPaused = paused === true;
}

export function areNpcAnimationsPaused() {
  return npcAnimationsPaused;
}

/**
 * Creates an animated NPC sprite using the sprite atlas system
 * @param {object} THREE - Three.js module
 * @param {object} renderer - ThreeRenderer instance
 * @param {string} characterKey - NPC key from SpriteAtlas.NPC_SPRITES
 * @param {object} spriteSpec - { assetId, width, height, texture } — texture is the already-loaded atlas texture
 * @param {object} options - Position/scale options
 * @returns {object} { sprite, animator, playAnimation, setFrame, update, getState }
 */
export function createAnimatedNPC(THREE, renderer, characterKey, spriteSpec, options = {}) {
  const { assetId, width, height, texture } = spriteSpec;

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
  let currentAnimationName = "none";
  let returnToIdleOnComplete = false;
  let api = null;

  const startAnimation = (animationName, animationOptions = {}) => {
    const animSpec = getCharacterAnimation(characterKey, animationName);
    if (!animSpec) return false;

    currentAnimationName = animationName;
    returnToIdleOnComplete = animationOptions.returnToIdle ?? (
      animationName !== "idle" && animSpec.loop === false
    );
    animator.playAnimation(animSpec);
    updateSpriteFrame(sprite, animator.getCurrentFrame(), width, characterKey);
    return true;
  };

  const advance = deltaMs => {
    if (npcAnimationsPaused) return animator.isPlaying;

    const wasPlaying = animator.isPlaying;
    const isPlaying = animator.update(deltaMs);
    updateSpriteFrame(sprite, animator.getCurrentFrame(), width, characterKey);

    if (wasPlaying && !isPlaying && returnToIdleOnComplete && currentAnimationName !== "idle") {
      startAnimation("idle", { returnToIdle: false });
    }

    return animator.isPlaying;
  };

  api = {
    sprite,
    animator,

    playAnimation(animationName, animationOptions = {}) {
      return startAnimation(animationName, animationOptions);
    },

    setFrame(poseName) {
      const frameIdx = getCharacterFrame(characterKey, poseName);
      if (frameIdx !== null) {
        activeDialogueAnimations.delete(api);
        currentAnimationName = "pose";
        returnToIdleOnComplete = false;
        animator.isPlaying = false;
        animator.currentFrame = frameIdx;
        updateSpriteFrame(sprite, frameIdx, width, characterKey);
      }
    },

    update(deltaMs) {
      if (npcAnimationsPaused || activeDialogueAnimations.has(api)) return animator.isPlaying;
      return advance(deltaMs);
    },

    getState() {
      return {
        isPlaying: animator.isPlaying,
        currentFrame: animator.currentFrame,
        animation: currentAnimationName
      };
    }
  };

  dialogueAdvancers.set(api, advance);
  return api;
}

export function updateActiveDialogueAnimations(deltaMs) {
  if (npcAnimationsPaused) return;
  for (const npc of [...activeDialogueAnimations]) {
    const advance = dialogueAdvancers.get(npc);
    if (!advance) {
      activeDialogueAnimations.delete(npc);
      continue;
    }
    advance(deltaMs);
  }
}

export function endActiveDialogueAnimations() {
  for (const npc of [...activeDialogueAnimations]) {
    activeDialogueAnimations.delete(npc);
    npc.playAnimation("idle", { returnToIdle: false });
  }
}

export function getActiveDialogueAnimationCount() {
  return activeDialogueAnimations.size;
}

function updateSpriteFrame(sprite, frameIndex, frameWidth, characterKey) {
  if (!sprite || !sprite.material) return;

  const material = sprite.material;
  if (!material.map) return;

  const atlasWidth = material.map.source.data.width;
  const framesPerRow = Math.floor(atlasWidth / frameWidth);

  const col = frameIndex % framesPerRow;

  let u = (col * frameWidth) / atlasWidth;
  let repeatX = frameWidth / atlasWidth;

  // Apply frameBounds if available
  const character = characterKey ? NPC_SPRITES[characterKey] : null;
  if (character?.frameBounds?.[frameIndex]) {
    const bound = character.frameBounds[frameIndex];
    const boundWidth = bound.x1 - bound.x0;
    u = bound.x0 / atlasWidth;
    repeatX = boundWidth / atlasWidth;
  }

  material.map.offset.x = u;
  material.map.repeat.x = repeatX;

  material.needsUpdate = true;
}

export function playDialogueAnimation(npcSprite, dialoguePhase = "start") {
  if (!npcSprite) return;

  if (dialoguePhase === "start" || dialoguePhase === "middle") {
    npcSprite.playAnimation("talk");
    activeDialogueAnimations.add(npcSprite);
    return;
  }

  activeDialogueAnimations.delete(npcSprite);
  const animMap = {
    end: "idle",
    react_positive: "react_welcome",
    react_negative: "react_concern"
  };
  const animName = animMap[dialoguePhase] || "idle";
  npcSprite.playAnimation(animName);
}
