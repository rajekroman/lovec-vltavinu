// Radarový sken: světelný kužel, který obíhá kolem hledače a prosvěcuje okolí.
//
// Hledání vltavínů bylo dosud jen textová hláška o síle signálu. Tenhle modul
// dává hledání obraz — kužel rotuje kolem postavy, při aktivaci vyšle prstenec
// a jeho jas roste, jak se hráč blíží k ložisku.
//
// Vše je procedurální: geometrie výseče a gradient v shaderu, žádné externí
// textury.

const TAU = Math.PI * 2;

const clamp01 = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export const RADAR_DEFAULTS = Object.freeze({
  radius: 460,
  // Šířka kužele. Užší kužel působí jako přesnější přístroj.
  coneAngle: Math.PI / 3.6,
  // Otáčky za sekundu. Pomalý sken čte lépe než rychlé blikání.
  sweepSpeed: 0.55,
  color: 0x7BC47F,
  pulseDuration: 1.15,
  segments: 48
});

// Úhel natočení kužele v daném čase.
export function resolveSweepAngle(elapsed, speed = RADAR_DEFAULTS.sweepSpeed) {
  const time = Number.isFinite(elapsed) ? elapsed : 0;
  const rate = Number.isFinite(speed) ? speed : 0;
  return (time * rate * TAU) % TAU;
}

// Síla signálu podle vzdálenosti od ložiska: 1 přímo na něm, 0 na hranici dosahu.
export function resolveSignalStrength(distance, range) {
  const safeRange = Number(range) > 0 ? Number(range) : 0;
  if (safeRange === 0) return 0;
  const safeDistance = Math.max(0, Number(distance) || 0);
  // Druhá mocnina drží slabý signál dlouho slabý a zesílí až u cíle.
  return clamp01(1 - safeDistance / safeRange) ** 0.65;
}

// Prstenec se rozpíná od hráče a cestou slábne.
export function resolvePulseProgress(elapsed, duration = RADAR_DEFAULTS.pulseDuration) {
  const safeDuration = Number(duration) > 0 ? Number(duration) : 1;
  return clamp01((Number(elapsed) || 0) / safeDuration);
}

export function resolvePulseOpacity(progress) {
  const t = clamp01(progress);
  // Náběh je rychlý, dozvuk pozvolný.
  return t < 0.15 ? t / 0.15 : (1 - (t - 0.15) / 0.85) ** 1.6;
}

const CONE_VERTEX_SHADER = `
  varying float vRadial;
  varying float vAngular;
  uniform float uRadius;
  uniform float uHalfAngle;
  void main() {
    vRadial = length(position.xy) / max(uRadius, 0.0001);
    // Znaménko se zachovává: náběžná hrana skenu se musí dát odlišit od zadní.
    vAngular = atan(position.y, position.x) / max(uHalfAngle, 0.0001);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CONE_FRAGMENT_SHADER = `
  varying float vRadial;
  varying float vAngular;
  uniform vec3 uColor;
  uniform float uStrength;
  void main() {
    // Světlo je nejsilnější u postavy a měkce vyhasíná k okraji dosahu.
    float radial = 1.0 - smoothstep(0.0, 1.0, vRadial);
    // Těsně u postavy se tlumí, jinak by měl kužel tvrdý vrchol.
    radial *= smoothstep(0.0, 0.08, vRadial);
    // Do stran vyhasíná plynule od osy, aby kužel neměl ostré boční hrany.
    float angular = 1.0 - smoothstep(0.0, 0.9, abs(vAngular));
    // Doznívající stopa za náběžnou hranou dává skenu směr otáčení.
    float trail = smoothstep(0.35, 1.0, vAngular) * 0.25;
    float alpha = radial * (angular * 0.75 + trail) * uStrength;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

function createConeMesh(THREE, options) {
  const halfAngle = options.coneAngle / 2;
  const geometry = new THREE.CircleGeometry(
    options.radius,
    options.segments,
    -halfAngle,
    options.coneAngle
  );
  const material = new THREE.ShaderMaterial({
    vertexShader: CONE_VERTEX_SHADER,
    fragmentShader: CONE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: new THREE.Color(options.color) },
      uRadius: { value: options.radius },
      uHalfAngle: { value: halfAngle },
      uStrength: { value: 0 }
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending ?? undefined
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "radar-sweep-cone";
  return mesh;
}

function createPulseMesh(THREE, options) {
  // Tenký prstenec; rozpínání řeší měřítko, ne přegenerování geometrie.
  const geometry = new THREE.RingGeometry(0.92, 1, options.segments);
  const material = new THREE.MeshBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending ?? undefined
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "radar-sweep-pulse";
  mesh.scale.setScalar(1);
  mesh.visible = false;
  return mesh;
}

export function createRadarSweep(THREE, options = {}) {
  if (!THREE?.Mesh || !THREE?.CircleGeometry || !THREE?.ShaderMaterial) {
    throw new TypeError("createRadarSweep requires an injected Three.js namespace.");
  }
  const settings = { ...RADAR_DEFAULTS, ...options };

  const group = new THREE.Group();
  group.name = "radar-sweep";
  group.visible = false;

  const cone = createConeMesh(THREE, settings);
  const pulse = createPulseMesh(THREE, settings);
  group.add(cone, pulse);

  let elapsed = 0;
  let pulseElapsed = null;
  let signal = 0;

  return {
    object: group,
    get active() {
      return group.visible;
    },

    show() {
      group.visible = true;
    },

    hide() {
      group.visible = false;
      pulseElapsed = null;
      pulse.visible = false;
    },

    // Síla signálu řídí jas kužele — hráč vidí, že se blíží.
    setSignal(strength) {
      signal = clamp01(strength);
      return signal;
    },

    // Vyšle rozpínající se prstenec.
    pulse() {
      pulseElapsed = 0;
      pulse.visible = true;
    },

    update(dt) {
      const step = Math.max(0, Number(dt) || 0);
      elapsed += step;
      cone.rotation.z = resolveSweepAngle(elapsed, settings.sweepSpeed);
      // Základní jas drží kužel čitelný i bez signálu; strop je nízko, aby sken
      // zůstal světlem přes terén a nepřekryl malbu plnou barvou.
      cone.material.uniforms.uStrength.value = 0.10 + signal * 0.35;

      if (pulseElapsed !== null) {
        pulseElapsed += step;
        const progress = resolvePulseProgress(pulseElapsed, settings.pulseDuration);
        pulse.scale.setScalar(Math.max(0.001, progress * settings.radius));
        pulse.material.opacity = resolvePulseOpacity(progress) * 0.85;
        if (progress >= 1) {
          pulseElapsed = null;
          pulse.visible = false;
        }
      }
      return elapsed;
    },

    dispose() {
      group.remove(cone, pulse);
      cone.geometry?.dispose?.();
      cone.material?.dispose?.();
      pulse.geometry?.dispose?.();
      pulse.material?.dispose?.();
    }
  };
}
