// Enhanced visual feedback system for game actions

export class DigFeedbackEffect {
  constructor(THREE, targetPosition = { x: 0, y: 0 }) {
    this.THREE = THREE;
    this.targetPosition = targetPosition;
    this.particles = [];
  }

  createDigParticles(particleCount = 12, intensity = 1.0) {
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.5;
      const size = 0.05 + Math.random() * 0.1;

      const geometry = new this.THREE.SphereGeometry(size, 8, 8);
      const material = new this.THREE.MeshPhongMaterial({
        color: 0x8B6F47 + Math.random() * 0x1F1F1F, // Soil brown variance
        emissive: 0x1A1A1A
      });
      const particle = new this.THREE.Mesh(geometry, material);

      particle.position.set(
        this.targetPosition.x,
        this.targetPosition.y,
        Math.random() * 0.2 - 0.1
      );

      particle.velocity = {
        x: Math.cos(angle) * speed * intensity,
        y: (0.1 + Math.random() * 0.3) * intensity,
        z: Math.random() * 0.3 - 0.15
      };

      particle.life = 1.0;
      particle.decay = 0.98;
      particles.push(particle);
    }
    return particles;
  }

  updateParticles(particles, deltaTime = 0.016) {
    const livingParticles = [];
    particles.forEach(particle => {
      particle.position.x += particle.velocity.x * deltaTime * 30;
      particle.position.y += particle.velocity.y * deltaTime * 30;
      particle.position.z += particle.velocity.z * deltaTime * 30;

      particle.velocity.y -= 9.8 * deltaTime; // Gravity

      particle.life *= particle.decay;
      particle.material.opacity = particle.life;

      if (particle.life > 0.01) {
        livingParticles.push(particle);
      }
    });
    return livingParticles;
  }
}

export class FindingRevealEffect {
  constructor(THREE, targetPosition = { x: 0, y: 0 }) {
    this.THREE = THREE;
    this.targetPosition = targetPosition;
    this.startTime = Date.now();
  }

  createRevealParticles(particleCount = 20, rarity = "C") {
    const rarityColors = {
      A: 0xFFD700, // Gold - very rare
      B: 0xC0C0C0, // Silver - rare
      C: 0xCD7F32  // Bronze - common
    };

    const color = rarityColors[rarity] || rarityColors.C;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 0.2 + Math.random() * 0.3;

      const geometry = new this.THREE.SphereGeometry(0.03, 8, 8);
      const material = new this.THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8
      });
      const particle = new this.THREE.Mesh(geometry, material);

      particle.position.set(
        this.targetPosition.x + Math.cos(angle) * distance,
        this.targetPosition.y + Math.sin(angle) * distance,
        0
      );

      particle.scale.set(1, 1, 1);
      particle.velocity = {
        x: Math.cos(angle) * 0.2,
        y: Math.sin(angle) * 0.2
      };

      particle.life = 1.0;
      particles.push(particle);
    }

    return particles;
  }

  updateRevealParticles(particles, deltaTime = 0.016) {
    const livingParticles = [];
    particles.forEach(particle => {
      particle.position.x += particle.velocity.x * deltaTime * 50;
      particle.position.y += particle.velocity.y * deltaTime * 50;

      // Expand outward
      particle.scale.multiplyScalar(1 + deltaTime * 2);

      particle.life -= deltaTime * 1.5;
      particle.material.emissiveIntensity = particle.life * 0.8;
      particle.material.opacity = particle.life;

      if (particle.life > 0.01) {
        livingParticles.push(particle);
      }
    });
    return livingParticles;
  }
}

export class DangerPulseEffect {
  constructor(THREE, options = {}) {
    this.THREE = THREE;
    this.intensity = 0;
    this.color = new this.THREE.Color(options.color || 0xFF0000);
    this.maxIntensity = options.maxIntensity || 1.0;
  }

  updateDangerPulse(camera, progress = 0.5) {
    if (!camera) return;

    // Pulse intensity based on danger level
    const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
    this.intensity = progress * this.maxIntensity * pulseIntensity;

    // Apply vignette effect (darken edges)
    if (camera.userData.vignetteIntensity !== undefined) {
      camera.userData.vignetteIntensity = this.intensity * 0.4;
    }

    // Screen shake based on intensity
    const shakeAmount = this.intensity * 0.02;
    camera.position.x += (Math.random() - 0.5) * shakeAmount;
    camera.position.y += (Math.random() - 0.5) * shakeAmount;
  }

  createHeartbeatEffect(audioContext, bpm = 120) {
    // Returns heartbeat frequency in Hz based on danger BPM
    return bpm / 60;
  }
}

export class ScreenShakeEffect {
  constructor(options = {}) {
    this.duration = options.duration || 200; // milliseconds
    this.magnitude = options.magnitude || 0.1;
    this.startTime = null;
  }

  start(camera, originalPosition) {
    this.startTime = Date.now();
    this.originalPosition = {
      x: originalPosition?.x || camera.position.x,
      y: originalPosition?.y || camera.position.y,
      z: originalPosition?.z || camera.position.z
    };
  }

  update(camera) {
    if (!this.startTime || !this.originalPosition) return false;

    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.duration) {
      camera.position.copy(this.originalPosition);
      return false;
    }

    const progress = elapsed / this.duration;
    const strength = (1 - progress) * this.magnitude; // Fade out

    camera.position.x = this.originalPosition.x + (Math.random() - 0.5) * strength * 2;
    camera.position.y = this.originalPosition.y + (Math.random() - 0.5) * strength * 2;

    return true;
  }
}

export class FloatingTextEffect {
  constructor(THREE, text, position, options = {}) {
    this.THREE = THREE;
    this.text = text;
    this.position = position;
    this.duration = options.duration || 1500; // milliseconds
    this.color = options.color || 0xFFFF00;
    this.startTime = Date.now();
  }

  createTextMesh() {
    // Simple floating text using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = `#${this.color.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, 128, 64);

    const texture = new this.THREE.CanvasTexture(canvas);
    const geometry = new this.THREE.PlaneGeometry(2, 1);
    const material = new this.THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: this.THREE.DoubleSide
    });

    const mesh = new this.THREE.Mesh(geometry, material);
    mesh.position.set(this.position.x, this.position.y, 1);
    return mesh;
  }

  update(mesh) {
    if (!mesh) return false;

    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.duration) return false;

    const progress = elapsed / this.duration;
    mesh.position.y += 0.02; // Float upward
    mesh.material.opacity = 1 - progress; // Fade out

    return true;
  }
}
