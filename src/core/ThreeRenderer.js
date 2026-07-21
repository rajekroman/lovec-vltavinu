export class ThreeRenderer {
  #THREE;
  #renderer;
  #scene;
  #camera;
  #container;
  #resizeObserver;

  constructor({ THREE, container, clearColor = 0x08110c, alpha = false } = {}) {
    if (!THREE?.WebGLRenderer || !THREE?.Scene || !THREE?.OrthographicCamera) {
      throw new TypeError("ThreeRenderer requires a compatible THREE namespace.");
    }
    if (!(container instanceof Element)) {
      throw new TypeError("ThreeRenderer requires a DOM container element.");
    }

    this.#THREE = THREE;
    this.#container = container;
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    this.#camera.position.set(0, 12, 12);
    this.#camera.lookAt(0, 0, 0);

    this.#renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: "high-performance" });
    this.#renderer.setClearColor(clearColor, alpha ? 0 : 1);
    this.#renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace ?? this.#renderer.outputColorSpace;
    this.#renderer.domElement.setAttribute("aria-label", "Herní 3D scéna");
    this.#renderer.domElement.style.width = "100%";
    this.#renderer.domElement.style.height = "100%";
    this.#renderer.domElement.style.display = "block";
    container.append(this.#renderer.domElement);

    this.#resizeObserver = new ResizeObserver(() => this.resize());
    this.#resizeObserver.observe(container);
    this.resize();
  }

  get scene() { return this.#scene; }
  get camera() { return this.#camera; }
  get renderer() { return this.#renderer; }
  get canvas() { return this.#renderer.domElement; }

  resize() {
    const width = Math.max(1, this.#container.clientWidth);
    const height = Math.max(1, this.#container.clientHeight);
    const aspect = width / height;
    const viewHeight = 18;
    const viewWidth = viewHeight * aspect;

    this.#camera.left = -viewWidth / 2;
    this.#camera.right = viewWidth / 2;
    this.#camera.top = viewHeight / 2;
    this.#camera.bottom = -viewHeight / 2;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height, false);
  }

  render() {
    this.#renderer.render(this.#scene, this.#camera);
  }

  dispose() {
    this.#resizeObserver?.disconnect();
    this.#scene.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(material => material?.dispose?.());
      else object.material?.dispose?.();
    });
    this.#renderer.dispose();
    this.#renderer.domElement.remove();
  }
}
