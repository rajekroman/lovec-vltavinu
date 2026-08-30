import test from "node:test";
import assert from "node:assert/strict";
import { LEVEL_DEFINITIONS } from "../../src/data/levels.js";
import { CHLUM_ENTITY_DEFINITIONS } from "../../src/data/chlum.js";
import { NESMEN_ENTITY_DEFINITIONS, NESMEN_PROFILE_IDS } from "../../src/data/nesmen.js";
import { BESEDNICE_ENTITY_DEFINITIONS, BESEDNICE_TRACE_IDS } from "../../src/data/besednice.js";
import { SLAVIA_DOCUMENT_IDS, SLAVIA_ENTITY_DEFINITIONS } from "../../src/data/slavia.js";
import { isWalkablePoint } from "../../src/gameplay/Walkability.js";

const STEP = 20;
const MAX_VISITED = 20000;
const keyOf = point => `${Math.round(point.x)},${Math.round(point.y)}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const entityDefinitions = Object.freeze({
  chlum: CHLUM_ENTITY_DEFINITIONS,
  nesmen: NESMEN_ENTITY_DEFINITIONS,
  besednice: BESEDNICE_ENTITY_DEFINITIONS,
  slavia: SLAVIA_ENTITY_DEFINITIONS
});

const orderedRoutes = Object.freeze({
  chlum: [
    ["farmer-vaclav", 0],
    ["chlum-search-site", 0],
    ["chlum-search-site", 1],
    ["chlum-search-site", 2]
  ],
  nesmen: [
    ["forester", 0],
    ["forest-profile", 0],
    ["forest-profile", 1],
    ["forest-profile", 2]
  ],
  besednice: [
    ["besednice-guide", 0],
    ["besednice-trace", 0],
    ["besednice-trace", 1],
    ["besednice-trace", 2],
    ["besednice-hedgehog", 0],
    ["crystal-karel", 0]
  ],
  slavia: [
    ["documentation-folder", 0],
    ["documentation-folder", 1],
    ["documentation-folder", 2],
    ["expert-eva", 0],
    ["thief-franta", 0],
    ["expert-eva", 0],
    ["kd-slavia", 0]
  ]
});

function entityById(levelId, entityId) {
  return entityDefinitions[levelId]?.find(entity => entity.id === entityId) ?? null;
}

function playerClearance(levelId) {
  const player = entityById(levelId, "player");
  const collider = player?.components?.collider;
  assert.equal(collider?.shape, "circle", `${levelId} player must use the canonical circle collider`);
  assert.ok(Number.isFinite(collider.radius) && collider.radius > 0, `${levelId} player collider radius must be positive`);
  return collider.radius;
}

function targetEntityId(levelId, targetId, index) {
  if (levelId === "chlum" && targetId === "chlum-search-site") {
    return index === 0 ? "chlum-search-site" : `chlum-search-site-${index + 1}`;
  }
  if (levelId === "nesmen" && targetId === "forest-profile") return NESMEN_PROFILE_IDS[index];
  if (levelId === "besednice" && targetId === "besednice-trace") return BESEDNICE_TRACE_IDS[index];
  if (levelId === "slavia" && targetId === "documentation-folder") return SLAVIA_DOCUMENT_IDS[index];
  return targetId;
}

function targetReachRange(levelId, targetId, index) {
  const entityId = targetEntityId(levelId, targetId, index);
  const entity = entityById(levelId, entityId);
  assert.ok(entity, `${levelId}:${targetId}[${index}] must map to a production entity`);
  const interactionRange = entity.components?.interaction?.range;
  if (Number.isFinite(interactionRange) && interactionRange > 0) return interactionRange;
  const detectionRange = entity.components?.searchSpot?.detectionRange;
  assert.ok(Number.isFinite(detectionRange) && detectionRange > 0, `${levelId}:${entityId} must define an interaction or detection range`);
  return detectionRange;
}

function edgeIsWalkable(level, from, to, clearance) {
  const length = distance(from, to);
  const samples = Math.max(1, Math.ceil(length / Math.max(6, clearance / 2)));
  for (let sample = 1; sample <= samples; sample++) {
    const t = sample / samples;
    const point = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t
    };
    if (!isWalkablePoint(level, point, clearance)) return false;
  }
  return true;
}

function findReachablePocket(level, start, target, reachRange, clearance) {
  if (!isWalkablePoint(level, start, clearance)) return null;

  const queue = [{ ...start }];
  const visited = new Set([keyOf(start)]);
  let cursor = 0;

  while (cursor < queue.length && visited.size <= MAX_VISITED) {
    const current = queue[cursor++];
    if (distance(current, target) <= reachRange) return current;

    for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = keyOf(next);
      if (visited.has(key)) continue;
      if (!isWalkablePoint(level, next, clearance)) continue;
      if (!edgeIsWalkable(level, current, next, clearance)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return null;
}

function getTarget(level, targetId, index) {
  const target = level.targets.find(candidate => candidate.id === targetId);
  assert.ok(target, `${level.id}:${targetId} target must exist`);
  const position = target.positions[index];
  assert.ok(position, `${level.id}:${targetId}[${index}] position must exist`);
  return position;
}

test("every canonical level defines real blocked geometry with negative probes", () => {
  for (const level of LEVEL_DEFINITIONS) {
    const clearance = playerClearance(level.id);
    assert.ok(Array.isArray(level.blockedZones), `${level.id} must define blockedZones`);
    assert.ok(level.blockedZones.length > 0, `${level.id} must contain blocked geometry`);

    const ids = new Set();
    for (const zone of level.blockedZones) {
      assert.equal(typeof zone.id, "string", `${level.id} blocked zone must have an id`);
      assert.ok(zone.id.length > 0, `${level.id} blocked zone id must not be empty`);
      assert.equal(ids.has(zone.id), false, `${level.id}:${zone.id} must be unique`);
      ids.add(zone.id);
      assert.ok(zone.probe && Number.isFinite(zone.probe.x) && Number.isFinite(zone.probe.y), `${level.id}:${zone.id} must define a probe`);
      assert.equal(
        isWalkablePoint(level, zone.probe, clearance),
        false,
        `${level.id}:${zone.id} probe must be blocked`
      );
    }
  }
});

test("every mandatory target has a reachable gameplay interaction pocket", () => {
  for (const level of LEVEL_DEFINITIONS) {
    const clearance = playerClearance(level.id);
    assert.equal(isWalkablePoint(level, level.spawn, clearance), true, `${level.id} spawn must be walkable`);
    for (const target of level.targets) {
      for (const [index, position] of target.positions.entries()) {
        const reachRange = targetReachRange(level.id, target.id, index);
        const pocket = findReachablePocket(level, level.spawn, position, reachRange, clearance);
        assert.ok(
          pocket,
          `${level.id}:${target.id}[${index}] must have a reachable interaction pocket within ${reachRange} units`
        );
      }
    }
  }
});

test("mandatory gameplay targets remain connected in their real ordered flow", () => {
  for (const level of LEVEL_DEFINITIONS) {
    const clearance = playerClearance(level.id);
    let current = { ...level.spawn };
    for (const [targetId, index] of orderedRoutes[level.id]) {
      const position = getTarget(level, targetId, index);
      const reachRange = targetReachRange(level.id, targetId, index);
      const pocket = findReachablePocket(level, current, position, reachRange, clearance);
      assert.ok(
        pocket,
        `${level.id} ordered route must reach ${targetId}[${index}] within ${reachRange} units from the previous gameplay step`
      );
      current = pocket;
    }
  }
});

test("reachability fails when a structural barrier cuts the Chlum route", () => {
  const source = LEVEL_DEFINITIONS.find(level => level.id === "chlum");
  assert.ok(source);
  const brokenLevel = {
    ...source,
    blockedZones: [
      ...source.blockedZones,
      {
        id: "test-total-barrier",
        kind: "test",
        shape: "rect",
        x: source.walkable.x,
        y: 600,
        width: source.walkable.width,
        height: 80,
        probe: { x: 800, y: 640 }
      }
    ]
  };
  const clearance = playerClearance("chlum");
  const target = getTarget(source, "chlum-search-site", 2);
  const reachRange = targetReachRange("chlum", "chlum-search-site", 2);
  assert.equal(
    findReachablePocket(brokenLevel, source.spawn, target, reachRange, clearance),
    null,
    "full-width barrier must make the third Chlum radar pocket unreachable from spawn"
  );
});
