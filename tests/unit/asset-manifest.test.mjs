import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "assets/manifests/assets.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function localPath(url) {
  assert.match(url, /^\.\/assets\//);
  const resolved = path.resolve(root, url.slice(2));
  assert.ok(resolved.startsWith(`${path.join(root, "assets")}${path.sep}`));
  return resolved;
}

function readPng(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const chunks = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    chunks.push(type);
    if (type === "IHDR") {
      var width = buffer.readUInt32BE(offset + 8);
      var height = buffer.readUInt32BE(offset + 12);
      var colorType = buffer[offset + 17];
    }
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return { width, height, hasAlpha: colorType === 4 || colorType === 6 || chunks.includes("tRNS") };
}

function readGlb(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a);
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/, ""));
}

function multiply(a, b) {
  const result = Array(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let index = 0; index < 4; index++) {
        result[column * 4 + row] += a[index * 4 + row] * b[column * 4 + index];
      }
    }
  }
  return result;
}

function nodeMatrix(node) {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const xx = 2 * x * x, yy = 2 * y * y, zz = 2 * z * z;
  const xy = 2 * x * y, xz = 2 * x * z, yz = 2 * y * z;
  const wx = 2 * w * x, wy = 2 * w * y, wz = 2 * w * z;
  return [
    (1 - yy - zz) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - xx - zz) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - xx - yy) * sz, 0,
    tx, ty, tz, 1
  ];
}

function transformPoint(matrix, [x, y, z]) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
  ];
}

function inspectGlb(gltf) {
  let triangles = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  function visit(nodeIndex, parentMatrix) {
    const node = gltf.nodes[nodeIndex];
    const matrix = multiply(parentMatrix, nodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        const position = gltf.accessors[primitive.attributes.POSITION];
        assert.ok(position.min && position.max, `${node.name}: POSITION bounds chybí`);
        const count = primitive.indices === undefined ? position.count : gltf.accessors[primitive.indices].count;
        const mode = primitive.mode ?? 4;
        triangles += mode === 4 ? count / 3 : Math.max(0, count - 2);
        for (const x of [position.min[0], position.max[0]]) {
          for (const y of [position.min[1], position.max[1]]) {
            for (const z of [position.min[2], position.max[2]]) {
              const point = transformPoint(matrix, [x, y, z]);
              for (let axis = 0; axis < 3; axis++) {
                min[axis] = Math.min(min[axis], point[axis]);
                max[axis] = Math.max(max[axis], point[axis]);
              }
            }
          }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, matrix);
  }

  const scene = gltf.scenes[gltf.scene ?? 0];
  for (const nodeIndex of scene.nodes) visit(nodeIndex, identity);
  return { triangles, min, max };
}

function assertApproxArray(actual, expected, tolerance = 0.001) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(Math.abs(value - expected[index]) <= tolerance, `${value} ≠ ${expected[index]}`);
  });
}

test("Chlum asset manifest splňuje technický kontrakt", () => {
  assert.ok(Array.isArray(manifest));
  assert.equal(manifest.length, 11);
  assert.equal(new Set(manifest.map(entry => entry.id)).size, manifest.length);
  assert.equal(new Set(manifest.map(entry => entry.url)).size, manifest.length);

  for (const entry of manifest) {
    assert.match(entry.id, /^[a-z0-9-]+$/);
    assert.ok(["texture", "spritesheet", "gltf"].includes(entry.type));
    assert.equal(typeof entry.disposeOwner, "string");
    assert.ok(entry.disposeOwner.length > 0);
    assert.ok(entry.budget.bytes > 0);

    const assetPath = localPath(entry.url);
    const buffer = fs.readFileSync(assetPath);
    assert.equal(buffer.length, entry.metrics.bytes, `${entry.id}: neodpovídá skutečná velikost`);
    assert.ok(buffer.length <= entry.budget.bytes, `${entry.id}: překročen byte budget`);
    assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), entry.sha256);

    if (entry.type === "texture" || entry.type === "spritesheet") {
      const png = readPng(buffer);
      assert.deepEqual({ width: png.width, height: png.height }, entry.dimensions);
      assert.equal(png.hasAlpha, entry.transparent, `${entry.id}: nesoulad alfa kanálu`);
      assert.ok(Math.max(png.width, png.height) <= entry.budget.textureMax);
      if (entry.frames) {
        assert.equal(entry.frames.columns * entry.frames.width, png.width);
        assert.equal(entry.frames.rows * entry.frames.height, png.height);
      }
      continue;
    }

    const gltf = readGlb(buffer);
    const inspection = inspectGlb(gltf);
    assert.equal(inspection.triangles, entry.metrics.triangles);
    assert.ok(inspection.triangles <= entry.budget.triangles, `${entry.id}: překročen triangle budget`);
    assertApproxArray(inspection.min, entry.boundsMeters.min);
    assertApproxArray(inspection.max, entry.boundsMeters.max);
    assert.ok(Math.abs(inspection.min[1]) <= entry.pivot.toleranceMeters, `${entry.id}: pivot není u terénu`);
    assert.equal(entry.scale.unit, "meter");
    assert.equal(entry.scale.upAxis, "Y");
    if (entry.requirements?.visibleDriver === false) {
      assert.equal(gltf.nodes.some(node => /driver|řidič/i.test((node.name ?? "").replace(/no[-_ ]?driver/ig, ""))), false);
    }
  }
});

test("všechny URL manifestu se načtou přes HTTP bez 404", async () => {
  const types = { ".json": "application/json", ".png": "image/png", ".glb": "model/gltf-binary" };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const assetPath = path.resolve(root, pathname.replace(/^\/+/, ""));
    if (!assetPath.startsWith(root + path.sep) || !fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": types[path.extname(assetPath)] ?? "application/octet-stream" });
    fs.createReadStream(assetPath).pipe(response);
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    for (const entry of manifest) {
      const response = await fetch(`http://127.0.0.1:${port}/${entry.url.slice(2)}`);
      assert.equal(response.status, 200, entry.url);
      assert.equal((await response.arrayBuffer()).byteLength, entry.metrics.bytes, entry.url);
    }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
