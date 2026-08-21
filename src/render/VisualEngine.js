// Vizuální engine: jedno místo, které drží obrazovou identitu hry.
//
// Malované podklady lokalit mají vlastní perspektivu — terén se směrem k horizontu
// sbíhá. Sprity postav a rekvizit ale žijí v ortografické kameře, takže bez korekce
// vypadá vzdálený objekt stejně velký jako blízký (typicky traktor v pozadí větší
// než hráč v popředí). Engine proto počítá měřítko a barevné doladění z hloubky
// aktéra na plátně a přidává kontaktní stín, aby postava neplavala nad terénem.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clamp01 = value => clamp(Number.isFinite(value) ? value : 0, 0, 1);

const lerp = (from, to, t) => from + (to - from) * t;

// Profily odpovídají tomu, jak je která lokalita namalovaná: kde leží horizont,
// jak silně terén ubíhá a jakou má scéna atmosféru.
export const LOCATION_VISUAL_PROFILES = {
  chlum: {
    // Podíl výšky plátna, kde končí ubíhající pole a začíná vzdálený okraj.
    horizon: 0.86,
    // Měřítko aktéra na horizontu vůči popředí.
    depthScaleRange: [0.52, 1.06],
    // Vzdálené objekty ztrácejí kontrast do barvy vzduchu.
    hazeColor: 0xb9c2c0,
    hazeStrength: 0.34,
    exposure: 1.0,
    contactShadow: { opacity: 0.42, width: 0.62, height: 0.17 }
  },
  locenice: {
    horizon: 0.84,
    depthScaleRange: [0.55, 1.05],
    hazeColor: 0xc6cbb4,
    hazeStrength: 0.3,
    exposure: 1.02,
    contactShadow: { opacity: 0.38, width: 0.6, height: 0.16 }
  },
  nesmen: {
    horizon: 0.9,
    depthScaleRange: [0.58, 1.04],
    hazeColor: 0x8fa07e,
    hazeStrength: 0.42,
    exposure: 0.96,
    contactShadow: { opacity: 0.5, width: 0.64, height: 0.18 }
  },
  besednice: {
    horizon: 0.88,
    depthScaleRange: [0.54, 1.05],
    hazeColor: 0xc3b39a,
    hazeStrength: 0.32,
    exposure: 1.0,
    contactShadow: { opacity: 0.44, width: 0.62, height: 0.17 }
  },
  slavia: {
    horizon: 0.82,
    depthScaleRange: [0.6, 1.03],
    hazeColor: 0xc8c4bb,
    hazeStrength: 0.26,
    exposure: 1.04,
    contactShadow: { opacity: 0.36, width: 0.58, height: 0.15 }
  }
};

export const DEFAULT_VISUAL_PROFILE = {
  horizon: 0.86,
  depthScaleRange: [0.55, 1.05],
  hazeColor: 0xb9c2c0,
  hazeStrength: 0.3,
  exposure: 1,
  contactShadow: { opacity: 0.4, width: 0.6, height: 0.16 }
};

export function resolveVisualProfile(locationId) {
  const profile = LOCATION_VISUAL_PROFILES[locationId];
  return profile ? { ...DEFAULT_VISUAL_PROFILE, ...profile } : { ...DEFAULT_VISUAL_PROFILE };
}

// Normalizovaná hloubka: 0 = nejblíž kameře (spodek plátna), 1 = horizont.
export function resolveDepth(y, bounds, profile = DEFAULT_VISUAL_PROFILE) {
  const height = Number(bounds?.height) || 0;
  if (height <= 0) return 0;
  const originY = Number(bounds?.y) || 0;
  const relative = clamp01((Number(y) - originY) / height);
  const horizon = clamp(Number(profile.horizon) || 1, 0.05, 1);
  return clamp01(relative / horizon);
}

// Měřítko aktéra podle hloubky — tohle drží proporce vůči malované krajině.
export function resolveDepthScale(depth, profile = DEFAULT_VISUAL_PROFILE) {
  // Pořadí v profilu je [u horizontu, v popředí] — depth 0 je popředí.
  const [horizonScale, foregroundScale] = Array.isArray(profile.depthScaleRange)
    ? profile.depthScaleRange
    : DEFAULT_VISUAL_PROFILE.depthScaleRange;
  return lerp(foregroundScale, horizonScale, clamp01(depth));
}

// Síla vzdušného oparu pro daný objekt.
export function resolveHazeAmount(depth, profile = DEFAULT_VISUAL_PROFILE) {
  const strength = clamp01(Number(profile.hazeStrength) ?? 0);
  // Opar roste nelineárně, aby popředí zůstalo plně sytě malované.
  return clamp01(depth * depth * strength);
}

export class VisualEngine {
  constructor(options = {}) {
    const THREE = options.three;
    if (!THREE?.Color || !THREE?.Sprite) {
      throw new TypeError("VisualEngine requires an injected Three.js namespace.");
    }
    this.THREE = THREE;
    this.renderer = options.renderer ?? null;
    this.profile = resolveVisualProfile(options.locationId);
    this.locationId = options.locationId ?? null;
    this.bounds = options.bounds ?? { x: 0, y: 0, width: 0, height: 0 };
    this.hazeColor = new THREE.Color(this.profile.hazeColor);
    this.tracked = new Map();
    this.shadowTexture = null;
    this.applyExposure();
  }

  applyExposure() {
    const webgl = this.renderer?.renderer;
    if (webgl && "toneMappingExposure" in webgl) {
      webgl.toneMappingExposure = this.profile.exposure ?? 1;
    }
  }

  setBounds(bounds) {
    if (bounds) this.bounds = bounds;
    return this.bounds;
  }

  // Měkký radiální stín se generuje jednou a sdílí mezi všemi aktéry.
  createShadowTexture() {
    if (this.shadowTexture) return this.shadowTexture;
    const documentRef = globalThis.document;
    if (!documentRef?.createElement) return null;
    const size = 128;
    const canvas = documentRef.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext?.("2d");
    if (!context) return null;
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,0.85)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.35)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.shadowTexture = texture;
    return texture;
  }

  createContactShadow(width, height) {
    const texture = this.createShadowTexture();
    if (!texture) return null;
    const settings = this.profile.contactShadow ?? DEFAULT_VISUAL_PROFILE.contactShadow;
    const material = new this.THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: settings.opacity
    });
    const shadow = new this.THREE.Sprite(material);
    shadow.scale.set(width * settings.width, height * settings.height, 1);
    shadow.center.set(0.5, 0.5);
    shadow.position.set(0, 0, -0.01);
    shadow.name = "contact-shadow";
    return shadow;
  }

  // Zaregistruje aktéra, aby ho engine držel v perspektivě.
  track(object, options = {}) {
    if (!object) return null;
    const baseWidth = Math.abs(object.scale?.x ?? 1) || 1;
    const baseHeight = Math.abs(object.scale?.y ?? 1) || 1;
    const entry = {
      object,
      baseScale: options.baseScale ?? 1,
      baseWidth,
      baseHeight,
      haze: options.haze !== false,
      shadow: null
    };
    if (options.shadow !== false) {
      const shadow = this.createContactShadow(baseWidth, baseHeight);
      if (shadow) {
        object.add?.(shadow);
        entry.shadow = shadow;
      }
    }
    this.tracked.set(object, entry);
    this.apply(object);
    return entry;
  }

  untrack(object) {
    const entry = this.tracked.get(object);
    if (!entry) return false;
    if (entry.shadow) {
      entry.shadow.parent?.remove?.(entry.shadow);
      entry.shadow.material?.dispose?.();
    }
    this.tracked.delete(object);
    return true;
  }

  // Přepočítá měřítko a opar jednoho aktéra podle jeho aktuální pozice.
  apply(object) {
    const entry = this.tracked.get(object);
    if (!entry) return null;
    const depth = resolveDepth(object.position?.y ?? 0, this.bounds, this.profile);
    const scale = resolveDepthScale(depth, this.profile) * entry.baseScale;

    if (object.scale?.set) {
      const flipped = (object.userData?.spriteFlipX === true) || object.scale.x < 0;
      const width = entry.baseWidth * scale;
      object.scale.set(flipped ? -width : width, entry.baseHeight * scale, 1);
    }

    if (entry.haze) {
      const amount = resolveHazeAmount(depth, this.profile);
      this.applyHaze(object, amount);
    }
    return { depth, scale };
  }

  applyHaze(object, amount) {
    const apply = node => {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!material?.color?.lerpColors) continue;
        if (!material.userData) material.userData = {};
        if (!material.userData.baseColor) {
          material.userData.baseColor = material.color.clone();
        }
        material.color.lerpColors(material.userData.baseColor, this.hazeColor, amount);
      }
    };
    if (object.name === "contact-shadow") return;
    apply(object);
    for (const child of object.children ?? []) {
      if (child.name === "contact-shadow") continue;
      apply(child);
    }
  }

  // Zavolá se každý snímek po aktualizaci pozic.
  update() {
    for (const object of this.tracked.keys()) this.apply(object);
  }

  dispose() {
    for (const object of [...this.tracked.keys()]) this.untrack(object);
    this.tracked.clear();
    this.shadowTexture?.dispose?.();
    this.shadowTexture = null;
  }
}
