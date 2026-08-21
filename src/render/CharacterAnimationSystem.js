// Character animation system with personality-driven visuals

export const CHARACTER_MODELS = {
  player: {
    name: "Hráč",
    colors: { body: 0x4A90E2, limbs: 0xF39C12, accent: 0x27AE60 },
    animations: ["idle", "walk", "dig", "interact", "celebrate", "tired"]
  },

  farmer: {
    name: "Václav",
    colors: { body: 0x8B6F47, limbs: 0x5C4033, accent: 0xFF6B6B },
    personality: "grounded, determined",
    animations: ["idle", "wave", "point", "concern"]
  },

  forester: {
    name: "Martin",
    colors: { body: 0x27AE60, limbs: 0x1B5E20, accent: 0x8B7355 },
    personality: "observant, precise",
    animations: ["idle", "examine", "warn", "approve"]
  },

  karel: {
    name: "Krystalový Karel",
    colors: { body: 0x8B0000, limbs: 0xC41E3A, accent: 0xFFD700 },
    personality: "aggressive, competitive",
    animations: ["idle", "threaten", "dig-fast", "defeated", "respect-nod"]
  },

  franta: {
    name: "Feták Franta",
    colors: { body: 0xA0A0A0, limbs: 0x7F7F7F, accent: 0xFFD700 },
    personality: "scheming, persuasive",
    animations: ["idle", "offer", "tempt", "celebrate", "sheepish"]
  },

  jury: {
    name: "Porota",
    colors: { body: 0x2C3E50, limbs: 0x34495E, accent: 0xE74C3C },
    personality: "authoritative, evaluating",
    animations: ["idle", "examine", "approve", "disapprove", "verdict"]
  }
};

export class CharacterAnimationSystem {
  constructor(THREE, options = {}) {
    this.THREE = THREE;
    this.animations = new Map();
    this.activeAnimations = new Map();
  }

  createSimpleCharacter(characterKey, positionX = 0, positionY = 0, scale = 1.0) {
    const model = CHARACTER_MODELS[characterKey];
    if (!model) throw new Error(`Unknown character: ${characterKey}`);

    const group = new this.THREE.Group();
    group.position.set(positionX, positionY, 0);
    group.userData.characterKey = characterKey;
    group.userData.currentAnimation = "idle";

    // Body (head + torso)
    const body = this.createCapsule(0.3 * scale, 0.5 * scale, model.colors.body);
    body.position.y = 0.3 * scale;
    group.add(body);

    // Head
    const head = this.createSphere(0.25 * scale, model.colors.body);
    head.position.y = 0.85 * scale;
    group.add(head);

    // Left and right arms
    const leftArm = this.createCapsule(0.15 * scale, 0.35 * scale, model.colors.limbs);
    leftArm.position.set(-0.35 * scale, 0.6 * scale, 0);
    group.add(leftArm);

    const rightArm = this.createCapsule(0.15 * scale, 0.35 * scale, model.colors.limbs);
    rightArm.position.set(0.35 * scale, 0.6 * scale, 0);
    group.add(rightArm);

    // Legs
    const leftLeg = this.createCapsule(0.12 * scale, 0.4 * scale, model.colors.limbs);
    leftLeg.position.set(-0.15 * scale, -0.2 * scale, 0);
    group.add(leftLeg);

    const rightLeg = this.createCapsule(0.12 * scale, 0.4 * scale, model.colors.limbs);
    rightLeg.position.set(0.15 * scale, -0.2 * scale, 0);
    group.add(rightLeg);

    // Accent (detail for character personality)
    const accent = this.createAccent(characterKey, 0.2 * scale, model.colors.accent);
    if (accent) group.add(accent);

    return group;
  }

  createCapsule(radius, height, color) {
    const geometry = new this.THREE.CapsuleGeometry(radius, height, 4, 8);
    const material = new this.THREE.MeshPhongMaterial({ color });
    return new this.THREE.Mesh(geometry, material);
  }

  createSphere(radius, color) {
    const geometry = new this.THREE.SphereGeometry(radius, 16, 16);
    const material = new this.THREE.MeshPhongMaterial({ color });
    return new this.THREE.Mesh(geometry, material);
  }

  createAccent(characterKey, size, color) {
    const accents = {
      farmer: () => {
        // Hat accent
        const cone = new this.THREE.ConeGeometry(size, size * 0.8, 8);
        const material = new this.THREE.MeshPhongMaterial({ color });
        const hat = new this.THREE.Mesh(cone, material);
        hat.position.y = size * 2;
        return hat;
      },
      forester: () => {
        // Badge accent
        const badge = new this.THREE.SphereGeometry(size * 0.5, 8, 8);
        const material = new this.THREE.MeshPhongMaterial({ color });
        const mesh = new this.THREE.Mesh(badge, material);
        mesh.position.set(0, size, 0);
        return mesh;
      },
      karel: () => {
        // Aggressive edge accent
        const box = new this.THREE.BoxGeometry(size * 1.5, size * 0.3, size);
        const material = new this.THREE.MeshPhongMaterial({ color });
        const edge = new this.THREE.Mesh(box, material);
        edge.position.y = size * 1.5;
        edge.rotation.z = Math.PI / 4;
        return edge;
      },
      franta: () => {
        // Scheming accent - smaller, off-center
        const accent = new this.THREE.SphereGeometry(size * 0.4, 8, 8);
        const material = new this.THREE.MeshPhongMaterial({ color });
        const mesh = new this.THREE.Mesh(accent, material);
        mesh.position.set(size * 0.5, size, 0);
        return mesh;
      },
      jury: () => {
        // Authority accent - formal
        const accent = new this.THREE.OctahedronGeometry(size);
        const material = new this.THREE.MeshPhongMaterial({ color });
        const mesh = new this.THREE.Mesh(accent, material);
        mesh.position.y = size * 1.8;
        return mesh;
      }
    };

    const creator = accents[characterKey];
    return creator ? creator() : null;
  }

  animateCharacter(character, animationType, duration = 500) {
    if (!character || !character.userData) return;

    character.userData.currentAnimation = animationType;

    switch (animationType) {
      case "dig": {
        // Digging motion: arms move down quickly
        const arms = character.children.filter(c => Math.abs(c.position.x) > 0.2);
        arms.forEach(arm => {
          const originalY = arm.position.y;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const bounce = Math.sin(progress * Math.PI * 2) * 0.15;
            arm.position.y = originalY - 0.2 + bounce;
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        });
        break;
      }

      case "walk": {
        // Walking motion: legs alternate, slight body sway
        const legs = character.children.filter(c => Math.abs(c.position.x) <= 0.2 && c.position.y < 0);
        let phase = 0;
        const animate = () => {
          phase += 0.02;
          legs.forEach((leg, index) => {
            leg.rotation.z = Math.sin(phase + (index === 0 ? 0 : Math.PI)) * 0.2;
          });
          if (Date.now() - startTime < duration) requestAnimationFrame(animate);
        };
        const startTime = Date.now();
        animate();
        break;
      }

      case "celebrate": {
        // Celebration: arms up, body bounces
        const arms = character.children.filter(c => Math.abs(c.position.x) > 0.2);
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const bounce = Math.sin(progress * Math.PI * 2) * 0.1;
          arms.forEach(arm => arm.position.y += 0.1 + bounce);
          character.position.y += bounce * 0.05;
          if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
        break;
      }

      case "idle": {
        // Gentle breathing motion
        const body = character.children[0];
        let time = 0;
        const animate = () => {
          time += 0.01;
          body.scale.y = 1 + Math.sin(time) * 0.02;
          if (Date.now() - startTime < duration) requestAnimationFrame(animate);
        };
        const startTime = Date.now();
        animate();
        break;
      }
    }
  }

  updateCharacterExpression(character, expression) {
    // Map expressions to visual changes (brightness, rotation, scale)
    const expressions = {
      happy: { brightness: 1.2, rotation: 0.1 },
      angry: { brightness: 0.9, rotation: -0.15 },
      concerned: { brightness: 0.85, rotation: 0.05 },
      approving: { brightness: 1.1, rotation: 0.02 },
      defeated: { brightness: 0.7, rotation: -0.2 }
    };

    const expr = expressions[expression];
    if (!expr) return;

    character.children.forEach(child => {
      if (child.material) {
        child.material.emissive.setHex(0xffffff);
        child.material.emissiveIntensity = Math.max(0, expr.brightness - 1);
      }
      child.rotation.z = expr.rotation;
    });
  }
}
