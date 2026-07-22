const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const COMPONENTS = Object.freeze({
  5120: { ArrayType: Int8Array, bytes: 1, read: "getInt8" },
  5121: { ArrayType: Uint8Array, bytes: 1, read: "getUint8" },
  5122: { ArrayType: Int16Array, bytes: 2, read: "getInt16" },
  5123: { ArrayType: Uint16Array, bytes: 2, read: "getUint16" },
  5125: { ArrayType: Uint32Array, bytes: 4, read: "getUint32" },
  5126: { ArrayType: Float32Array, bytes: 4, read: "getFloat32" }
});
const ITEM_SIZES = Object.freeze({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 });
const ATTRIBUTES = Object.freeze({ POSITION: "position", NORMAL: "normal", TEXCOORD_0: "uv", COLOR_0: "color", TANGENT: "tangent" });

function parseChunks(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Invalid GLB header.");
  if (view.getUint32(4, true) !== 2) throw new Error("Only GLB version 2 is supported.");
  const declaredLength = view.getUint32(8, true);
  if (declaredLength !== view.byteLength) throw new Error("GLB length does not match the file size.");

  let offset = 12;
  let json = null;
  let binary = null;
  while (offset + 8 <= view.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > view.byteLength) throw new Error("GLB chunk exceeds the file size.");
    if (type === JSON_CHUNK) {
      const text = new TextDecoder().decode(new Uint8Array(buffer, start, length)).replace(/\0+$/g, "").trim();
      json = JSON.parse(text);
    } else if (type === BIN_CHUNK) {
      binary = buffer.slice(start, end);
    }
    offset = end;
  }
  if (!json || !binary) throw new Error("GLB requires JSON and BIN chunks.");
  return { json, binary };
}

function readAccessor(json, binary, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];
  if (!accessor) throw new Error(`Missing GLB accessor ${accessorIndex}.`);
  const viewDefinition = json.bufferViews?.[accessor.bufferView];
  if (!viewDefinition) throw new Error(`Missing GLB bufferView ${accessor.bufferView}.`);
  const component = COMPONENTS[accessor.componentType];
  const itemSize = ITEM_SIZES[accessor.type];
  if (!component || !itemSize) throw new Error(`Unsupported GLB accessor ${accessor.componentType}/${accessor.type}.`);

  const count = accessor.count ?? 0;
  const stride = viewDefinition.byteStride ?? component.bytes * itemSize;
  const start = (viewDefinition.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const result = new component.ArrayType(count * itemSize);
  const data = new DataView(binary);
  for (let index = 0; index < count; index++) {
    for (let componentIndex = 0; componentIndex < itemSize; componentIndex++) {
      const byteOffset = start + index * stride + componentIndex * component.bytes;
      result[index * itemSize + componentIndex] = data[component.read](byteOffset, true);
    }
  }
  return { array: result, itemSize, normalized: accessor.normalized === true };
}

function createMaterial(THREE, definition = {}, vertexColors = false) {
  const pbr = definition.pbrMetallicRoughness ?? {};
  const baseColor = pbr.baseColorFactor ?? [1, 1, 1, 1];
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor[0], baseColor[1], baseColor[2]),
    opacity: baseColor[3] ?? 1,
    transparent: definition.alphaMode === "BLEND" || (baseColor[3] ?? 1) < 1,
    alphaTest: definition.alphaMode === "MASK" ? definition.alphaCutoff ?? 0.5 : 0,
    metalness: pbr.metallicFactor ?? 1,
    roughness: pbr.roughnessFactor ?? 1,
    vertexColors,
    side: definition.doubleSided ? THREE.DoubleSide : THREE.FrontSide
  });
  material.name = definition.name ?? "glb-material";
  if (definition.emissiveFactor) material.emissive.fromArray(definition.emissiveFactor);
  return material;
}

function buildMesh(THREE, json, binary, meshIndex) {
  const definition = json.meshes?.[meshIndex];
  if (!definition) throw new Error(`Missing GLB mesh ${meshIndex}.`);
  const container = new THREE.Group();
  container.name = definition.name ?? `mesh-${meshIndex}`;

  for (const [primitiveIndex, primitive] of (definition.primitives ?? []).entries()) {
    if (primitive.mode !== undefined && primitive.mode !== 4) throw new Error(`Unsupported GLB primitive mode ${primitive.mode}.`);
    const geometry = new THREE.BufferGeometry();
    for (const [semantic, accessorIndex] of Object.entries(primitive.attributes ?? {})) {
      const name = ATTRIBUTES[semantic];
      if (!name) continue;
      const attribute = readAccessor(json, binary, accessorIndex);
      geometry.setAttribute(name, new THREE.BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized));
    }
    if (primitive.indices !== undefined) {
      const index = readAccessor(json, binary, primitive.indices);
      geometry.setIndex(new THREE.BufferAttribute(index.array, 1, index.normalized));
    }
    if (!geometry.getAttribute("normal") && geometry.getAttribute("position")) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const materialDefinition = json.materials?.[primitive.material] ?? {};
    const material = createMaterial(THREE, materialDefinition, Boolean(geometry.getAttribute("color")));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${container.name}-primitive-${primitiveIndex}`;
    container.add(mesh);
  }
  return container.children.length === 1 ? container.children[0] : container;
}

function applyTransform(object, node) {
  if (Array.isArray(node.matrix)) {
    object.matrix.fromArray(node.matrix);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
  } else {
    if (Array.isArray(node.translation)) object.position.fromArray(node.translation);
    if (Array.isArray(node.rotation)) object.quaternion.fromArray(node.rotation);
    if (Array.isArray(node.scale)) object.scale.fromArray(node.scale);
  }
}

function buildNode(THREE, json, binary, nodeIndex, stack = new Set()) {
  if (stack.has(nodeIndex)) throw new Error("Cyclic GLB node graph.");
  const node = json.nodes?.[nodeIndex];
  if (!node) throw new Error(`Missing GLB node ${nodeIndex}.`);
  const nextStack = new Set(stack).add(nodeIndex);
  const object = node.mesh === undefined ? new THREE.Group() : buildMesh(THREE, json, binary, node.mesh);
  object.name = node.name ?? object.name ?? `node-${nodeIndex}`;
  applyTransform(object, node);
  for (const childIndex of node.children ?? []) object.add(buildNode(THREE, json, binary, childIndex, nextStack));
  return object;
}

export function parseGlbModel(THREE, buffer) {
  if (!THREE?.BufferGeometry || !THREE?.MeshStandardMaterial) throw new TypeError("parseGlbModel requires a Three.js namespace.");
  const arrayBuffer = buffer instanceof ArrayBuffer
    ? buffer
    : ArrayBuffer.isView(buffer) ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) : null;
  if (!arrayBuffer) throw new TypeError("GLB input must be an ArrayBuffer or typed array.");
  const { json, binary } = parseChunks(arrayBuffer);
  const sceneDefinition = json.scenes?.[json.scene ?? 0];
  if (!sceneDefinition) throw new Error("GLB has no default scene.");
  const root = new THREE.Group();
  root.name = sceneDefinition.name ?? "glb-scene";
  root.userData.glbAsset = Object.freeze({ version: json.asset?.version ?? "2.0", generator: json.asset?.generator ?? null });
  for (const nodeIndex of sceneDefinition.nodes ?? []) root.add(buildNode(THREE, json, binary, nodeIndex));
  return root;
}

export async function loadGlbModel(THREE, url, options = {}) {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new TypeError("loadGlbModel requires fetch.");
  const response = await fetchImpl(url);
  if (!response?.ok) throw new Error(`HTTP ${response?.status ?? "?"} for ${url}`);
  return parseGlbModel(THREE, await response.arrayBuffer());
}
