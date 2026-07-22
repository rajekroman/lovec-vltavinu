import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_DIR = resolve("public/assets/models");

mkdirSync(OUTPUT_DIR, { recursive: true });

class GlbBuilder {
  constructor() {
    this.binary = Buffer.alloc(0);
    this.bufferViews = [];
    this.accessors = [];
    this.materials = [];
    this.meshes = [];
    this.nodes = [];
  }

  addMaterial(name, hex, roughness = 0.82, metallic = 0) {
    const color = [
      ((hex >> 16) & 0xff) / 255,
      ((hex >> 8) & 0xff) / 255,
      (hex & 0xff) / 255,
      1,
    ];
    const index = this.materials.length;
    this.materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: metallic,
        roughnessFactor: roughness,
      },
    });
    return index;
  }

  addPart(name, geometry, material, translation = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const position = this.addAccessor(
      new Float32Array(geometry.positions),
      5126,
      "VEC3",
      34962,
      minMax(geometry.positions, 3),
    );
    const normal = this.addAccessor(
      new Float32Array(geometry.normals),
      5126,
      "VEC3",
      34962,
    );
    const indices = this.addAccessor(
      new Uint16Array(geometry.indices),
      5123,
      "SCALAR",
      34963,
      minMax(geometry.indices, 1),
    );

    const mesh = this.meshes.length;
    this.meshes.push({
      name,
      primitives: [{
        attributes: { POSITION: position, NORMAL: normal },
        indices,
        material,
      }],
    });

    const node = this.nodes.length;
    this.nodes.push({
      name,
      mesh,
      translation,
      rotation: quaternionFromEuler(...rotation),
      scale,
    });
    return node;
  }

  addAccessor(array, componentType, type, target, bounds) {
    const byteOffset = align4(this.binary.length);
    if (byteOffset > this.binary.length) {
      this.binary = Buffer.concat([this.binary, Buffer.alloc(byteOffset - this.binary.length)]);
    }

    const source = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    this.binary = Buffer.concat([this.binary, source]);
    const bufferView = this.bufferViews.length;
    this.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: source.byteLength,
      target,
    });

    const accessor = this.accessors.length;
    const componentCount = type === "VEC3" ? 3 : 1;
    this.accessors.push({
      bufferView,
      componentType,
      count: array.length / componentCount,
      type,
      ...(bounds ? { min: bounds.min, max: bounds.max } : {}),
    });
    return accessor;
  }

  build(sceneName) {
    const json = {
      asset: { version: "2.0", generator: "Lovec vltavinu low-poly asset pipeline" },
      scene: 0,
      scenes: [{ name: sceneName, nodes: this.nodes.map((_, index) => index) }],
      nodes: this.nodes,
      meshes: this.meshes,
      materials: this.materials,
      accessors: this.accessors,
      bufferViews: this.bufferViews,
      buffers: [{ byteLength: this.binary.length }],
    };

    const jsonBytes = Buffer.from(JSON.stringify(json));
    const paddedJson = padBuffer(jsonBytes, 0x20);
    const paddedBinary = padBuffer(this.binary, 0);
    const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(totalLength, 8);

    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(paddedJson.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);

    const binaryHeader = Buffer.alloc(8);
    binaryHeader.writeUInt32LE(paddedBinary.length, 0);
    binaryHeader.writeUInt32LE(0x004e4942, 4);

    return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
  }
}

function align4(value) {
  return (value + 3) & ~3;
}

function padBuffer(buffer, byte) {
  const length = align4(buffer.length);
  return length === buffer.length ? buffer : Buffer.concat([buffer, Buffer.alloc(length - buffer.length, byte)]);
}

function minMax(values, stride) {
  const min = Array(stride).fill(Infinity);
  const max = Array(stride).fill(-Infinity);
  for (let index = 0; index < values.length; index += stride) {
    for (let axis = 0; axis < stride; axis += 1) {
      min[axis] = Math.min(min[axis], values[index + axis]);
      max[axis] = Math.max(max[axis], values[index + axis]);
    }
  }
  return { min, max };
}

function quaternionFromEuler(x, y, z) {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
}

function box(width, height, depth) {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const faces = [
    { normal: [1, 0, 0], corners: [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]] },
    { normal: [-1, 0, 0], corners: [[-x, -y, z], [-x, y, z], [-x, y, -z], [-x, -y, -z]] },
    { normal: [0, 1, 0], corners: [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]] },
    { normal: [0, -1, 0], corners: [[-x, -y, z], [-x, -y, -z], [x, -y, -z], [x, -y, z]] },
    { normal: [0, 0, 1], corners: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]] },
    { normal: [0, 0, -1], corners: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]] },
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  for (const face of faces) {
    const start = positions.length / 3;
    for (const corner of face.corners) {
      positions.push(...corner);
      normals.push(...face.normal);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return { positions, normals, indices };
}

function cylinder(radius, height, segments = 12) {
  const positions = [];
  const normals = [];
  const indices = [];
  const halfHeight = height / 2;
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const nextAngle = ((index + 1) / segments) * Math.PI * 2;
    const current = [Math.cos(angle), Math.sin(angle)];
    const next = [Math.cos(nextAngle), Math.sin(nextAngle)];
    const start = positions.length / 3;
    positions.push(
      radius * current[0], -halfHeight, radius * current[1],
      radius * current[0], halfHeight, radius * current[1],
      radius * next[0], halfHeight, radius * next[1],
      radius * next[0], -halfHeight, radius * next[1],
    );
    normals.push(
      current[0], 0, current[1],
      current[0], 0, current[1],
      next[0], 0, next[1],
      next[0], 0, next[1],
    );
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  const topCenter = positions.length / 3;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  const bottomCenter = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const nextAngle = ((index + 1) / segments) * Math.PI * 2;
    const topStart = positions.length / 3;
    positions.push(
      radius * Math.cos(angle), halfHeight, radius * Math.sin(angle),
      radius * Math.cos(nextAngle), halfHeight, radius * Math.sin(nextAngle),
    );
    normals.push(0, 1, 0, 0, 1, 0);
    indices.push(topCenter, topStart, topStart + 1);
    const bottomStart = positions.length / 3;
    positions.push(
      radius * Math.cos(nextAngle), -halfHeight, radius * Math.sin(nextAngle),
      radius * Math.cos(angle), -halfHeight, radius * Math.sin(angle),
    );
    normals.push(0, -1, 0, 0, -1, 0);
    indices.push(bottomCenter, bottomStart, bottomStart + 1);
  }
  return { positions, normals, indices };
}

function createTractor() {
  const builder = new GlbBuilder();
  const red = builder.addMaterial("tractor red", 0x9b4436, 0.84);
  const dark = builder.addMaterial("rubber and chassis", 0x242b26, 0.95);
  const glass = builder.addMaterial("cab glass", 0x54767a, 0.28, 0.05);
  builder.addPart("tractor body", box(2.7, 0.72, 1.6), red, [0, 0.72, 0]);
  builder.addPart("front hood", box(0.8, 0.42, 1.42), red, [-1.05, 1.08, 0]);
  builder.addPart("cab frame", box(1.05, 1.25, 1.18), dark, [0.38, 1.58, 0]);
  builder.addPart("front windscreen", box(0.04, 0.62, 0.86), glass, [-0.16, 1.7, 0]);
  builder.addPart("cab roof", box(1.22, 0.18, 1.34), red, [0.38, 2.25, 0]);
  for (const x of [-0.72, 0.72]) {
    for (const z of [-0.84, 0.84]) {
      builder.addPart("tractor wheel", cylinder(0.43, 0.24, 12), dark, [x, 0.43, z], [Math.PI / 2, 0, 0]);
    }
  }
  builder.addPart("exhaust", cylinder(0.08, 0.75, 8), dark, [-0.72, 1.32, 0.54]);
  return builder.build("Traktor Chlum");
}

function createExcavator() {
  const builder = new GlbBuilder();
  const yellow = builder.addMaterial("excavator yellow", 0xb88732, 0.85);
  const dark = builder.addMaterial("excavator tracks", 0x2d322d, 0.95);
  const glass = builder.addMaterial("excavator glass", 0x536f72, 0.3, 0.04);
  builder.addPart("left track", box(3.4, 0.36, 0.38), dark, [0, 0.26, -0.7]);
  builder.addPart("right track", box(3.4, 0.36, 0.38), dark, [0, 0.26, 0.7]);
  builder.addPart("counterweight", box(1.8, 0.56, 1.35), yellow, [0.65, 0.7, 0]);
  builder.addPart("operator cabin", box(1.25, 1.2, 1.3), yellow, [0.35, 1.34, 0]);
  builder.addPart("cabin glass", box(0.06, 0.72, 0.92), glass, [-0.3, 1.48, 0]);
  builder.addPart("boom", box(2.5, 0.3, 0.34), yellow, [-1.15, 1.72, 0], [0, 0, -0.31]);
  builder.addPart("dipper", box(1.55, 0.24, 0.3), yellow, [-2.15, 1.22, 0], [0, 0, 0.48]);
  builder.addPart("bucket", box(0.72, 0.55, 0.88), yellow, [-2.78, 0.72, 0], [0, 0, 0.28]);
  return builder.build("Bagr Besednice");
}

function createSlavia() {
  const builder = new GlbBuilder();
  const facade = builder.addMaterial("Slavia facade", 0xbab9ad, 0.9);
  const roof = builder.addMaterial("Slavia roof", 0x403936, 0.95);
  const glass = builder.addMaterial("Slavia glass", 0x6d9aa0, 0.26, 0.08);
  const window = builder.addMaterial("Slavia window frames", 0x283a38, 0.72);
  const sign = builder.addMaterial("event sign", 0xb68d39, 0.74);
  builder.addPart("historic hall", box(13, 4.8, 5.5), facade, [0, 2.4, 0]);
  builder.addPart("roof cap", box(13.8, 0.5, 6.1), roof, [0, 5.05, 0]);
  builder.addPart("glass annex", box(6.2, 3.8, 5.8), glass, [6.5, 1.9, 0.35]);
  for (const x of [-5, -2.5, 0, 2.5, 5]) {
    builder.addPart("front window", box(1.25, 1.85, 0.08), window, [x, 2.45, -2.79]);
  }
  builder.addPart("event sign", box(4.6, 0.52, 0.12), sign, [0, 4.0, -2.82]);
  for (const x of [4.4, 6.5, 8.6]) {
    builder.addPart("annex mullion", box(0.11, 3.3, 0.11), window, [x, 1.9, -2.58]);
  }
  return builder.build("KD Slavia");
}

const assets = [
  ["tractor-chlum.glb", createTractor()],
  ["excavator-besednice.glb", createExcavator()],
  ["kd-slavia.glb", createSlavia()],
];

for (const [filename, data] of assets) {
  writeFileSync(resolve(OUTPUT_DIR, filename), data);
  console.log(`generated ${filename} (${data.length} bytes)`);
}
