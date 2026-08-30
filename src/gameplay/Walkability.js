const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const squaredDistance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const distanceToSegment = (point, start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.sqrt(squaredDistance(point, start));
  const lengthSquared = dx * dx + dy * dy;
  const projection = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  const closest = { x: start.x + projection * dx, y: start.y + projection * dy };
  return Math.sqrt(squaredDistance(point, closest));
};

const pointInPolygon = (point, points) => {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const crosses = (currentPoint.y > point.y) !== (previousPoint.y > point.y)
      && point.x < (previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)
        / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
};

export function isBlockedByZone(point, zone, clearance = 0) {
  if (!zone || typeof zone !== "object") return false;
  const radius = Math.max(0, Number(clearance) || 0);

  if (zone.shape === "rect") {
    const width = Math.max(0, Number(zone.width) || 0);
    const height = Math.max(0, Number(zone.height) || 0);
    return point.x >= zone.x - radius
      && point.x <= zone.x + width + radius
      && point.y >= zone.y - radius
      && point.y <= zone.y + height + radius;
  }

  if (zone.shape === "circle") {
    const zoneRadius = Math.max(0, Number(zone.radius) || 0) + radius;
    return squaredDistance(point, zone) <= zoneRadius * zoneRadius;
  }

  if (zone.shape === "polygon") {
    const points = Array.isArray(zone.points) ? zone.points : [];
    if (points.length < 3) return false;
    if (pointInPolygon(point, points)) return true;
    if (radius <= 0) return false;
    for (let index = 0; index < points.length; index++) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      if (distanceToSegment(point, start, end) <= radius) return true;
    }
  }

  return false;
}

export function getWalkableBounds(level, clearance = 0) {
  const source = level?.walkable ?? level?.bounds;
  if (!source) return null;
  const radius = Math.max(0, Number(clearance) || 0);
  return {
    minX: source.x + radius,
    maxX: source.x + source.width - radius,
    minY: source.y + radius,
    maxY: source.y + source.height - radius
  };
}

export function isWalkablePoint(level, point, clearance = 0) {
  if (!level || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return false;
  const bounds = getWalkableBounds(level, clearance);
  if (!bounds || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return false;
  if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return false;
  return !(level.blockedZones ?? []).some(zone => isBlockedByZone(point, zone, clearance));
}

export function resolveWalkablePosition(level, from, desired, clearance = 0) {
  const bounds = getWalkableBounds(level, clearance);
  if (!bounds) return { x: from.x, y: from.y };
  const target = {
    x: clamp(desired.x, bounds.minX, bounds.maxX),
    y: clamp(desired.y, bounds.minY, bounds.maxY)
  };
  if (isWalkablePoint(level, target, clearance)) return target;

  const horizontal = { x: target.x, y: from.y };
  const vertical = { x: from.x, y: target.y };
  const horizontalDistance = Math.abs(horizontal.x - from.x);
  const verticalDistance = Math.abs(vertical.y - from.y);
  const candidates = horizontalDistance >= verticalDistance
    ? [horizontal, vertical]
    : [vertical, horizontal];

  for (const candidate of candidates) {
    if (isWalkablePoint(level, candidate, clearance)) return candidate;
  }
  return { x: from.x, y: from.y };
}
