// delaunay-cloud/sketch.js — a 3D point cloud meshed by Delaunay triangulation.
//
// Points drift inside a unit cube (normalised coords, so it's resolution
// independent). Each frame we rotate them, run a 2D Bowyer-Watson Delaunay over
// the projected (x, y), and draw the triangle edges in 3D — culling any edge
// that is long in actual 3D space, so only true spatial neighbours connect.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  let pts = [];        // [{x,y,z,vx,vy,vz}] in [-1, 1]^3
  let angle = 0;       // accumulated spin about the vertical axis
  const tilt = 0.42;   // fixed lean so we see the cloud in 3/4 view

  const targetCount = () =>
    Math.round(params.points * (preview ? 0.5 : 1));

  function makePoint() {
    const r = () => (Math.random() * 2 - 1);
    return { x: r(), y: r(), z: r(), vx: r(), vy: r(), vz: r() };
  }

  function syncPopulation() {
    const target = targetCount();
    while (pts.length < target) pts.push(makePoint());
    if (pts.length > target) pts.length = target;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h, p.WEBGL);
    syncPopulation();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
  };

  p.draw = () => {
    syncPopulation();
    const n = pts.length;

    // Drift + reflect inside the cube.
    const drift = params.drift * 0.006;
    for (const q of pts) {
      q.x += q.vx * drift; q.y += q.vy * drift; q.z += q.vz * drift;
      if (q.x < -1 || q.x > 1) q.vx = -q.vx;
      if (q.y < -1 || q.y > 1) q.vy = -q.vy;
      if (q.z < -1 || q.z > 1) q.vz = -q.vz;
      q.x = clamp(q.x); q.y = clamp(q.y); q.z = clamp(q.z);
    }

    angle += params.spin * 0.012;
    const cy = Math.cos(angle), sy = Math.sin(angle);
    const cx = Math.cos(tilt), sx = Math.sin(tilt);

    // Rotate every point once; keep screen-space (RX,RY) for the triangulation
    // and full (RX,RY,RZ) for drawing.
    const RX = new Float64Array(n);
    const RY = new Float64Array(n);
    const RZ = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const q = pts[i];
      // yaw about Y, then pitch about X
      const x1 = q.x * cy + q.z * sy;
      const z1 = -q.x * sy + q.z * cy;
      const y2 = q.y * cx - z1 * sx;
      const z2 = q.y * sx + z1 * cx;
      RX[i] = x1; RY[i] = y2; RZ[i] = z2;
    }

    const tris = triangulate(RX, RY, n);

    const { w, h } = { w: p.width, h: p.height };
    const S = Math.min(w, h) * 0.34;
    const maxLen = params.linkDist * 2; // normalised cube spans 2 units
    const maxLen2 = maxLen * maxLen;

    p.background(...BG);

    // Edges — accent, with a near/far depth fade.
    for (const t of tris) {
      drawEdge(t[0], t[1]);
      drawEdge(t[1], t[2]);
      drawEdge(t[2], t[0]);
    }

    function drawEdge(i, j) {
      const a = pts[i], b = pts[j];
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
      if (dx * dx + dy * dy + dz * dz > maxLen2) return; // not a neighbour in 3D
      const depth = (RZ[i] + RZ[j]) * 0.5;              // ~[-1.4, 1.4]
      const alpha = 50 + (depth + 1.4) / 2.8 * 170;
      p.stroke(ACCENT[0], ACCENT[1], ACCENT[2], alpha);
      p.strokeWeight(1);
      p.line(RX[i] * S, RY[i] * S, RZ[i] * S, RX[j] * S, RY[j] * S, RZ[j] * S);
    }

    if (params.showPoints) {
      p.stroke(...INK);
      p.strokeWeight(preview ? 3 : 4.5);
      for (let i = 0; i < n; i++) p.point(RX[i] * S, RY[i] * S, RZ[i] * S);
    }
  };

  function clamp(v) {
    return v < -1 ? -1 : v > 1 ? 1 : v;
  }
}

// --- 2D Delaunay triangulation (Bowyer-Watson) -----------------------------
// xs/ys hold n point coords; returns triangles as [a,b,c] index triples.
function triangulate(xs, ys, n) {
  if (n < 3) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    if (xs[i] < minX) minX = xs[i];
    if (xs[i] > maxX) maxX = xs[i];
    if (ys[i] < minY) minY = ys[i];
    if (ys[i] > maxY) maxY = ys[i];
  }
  const dmax = Math.max(maxX - minX, maxY - minY) || 1;
  const midx = (minX + maxX) / 2, midy = (minY + maxY) / 2;

  // Point coords plus three super-triangle vertices enclosing them all.
  const X = new Float64Array(n + 3);
  const Y = new Float64Array(n + 3);
  for (let i = 0; i < n; i++) { X[i] = xs[i]; Y[i] = ys[i]; }
  X[n] = midx - 20 * dmax; Y[n] = midy - dmax;
  X[n + 1] = midx;         Y[n + 1] = midy + 20 * dmax;
  X[n + 2] = midx + 20 * dmax; Y[n + 2] = midy - dmax;

  let tris = [[n, n + 1, n + 2]];

  for (let i = 0; i < n; i++) {
    const px = X[i], py = Y[i];
    const edges = [];
    const keep = [];
    for (const t of tris) {
      if (inCircumcircle(X[t[0]], Y[t[0]], X[t[1]], Y[t[1]], X[t[2]], Y[t[2]], px, py)) {
        edges.push([t[0], t[1]], [t[1], t[2]], [t[2], t[0]]);
      } else {
        keep.push(t);
      }
    }
    tris = keep;
    // Re-triangulate the cavity: edges that aren't shared form its boundary.
    for (let a = 0; a < edges.length; a++) {
      let shared = false;
      for (let b = 0; b < edges.length; b++) {
        if (a !== b && sameEdge(edges[a], edges[b])) { shared = true; break; }
      }
      if (!shared) tris.push([edges[a][0], edges[a][1], i]);
    }
  }

  // Drop any triangle still attached to the super-triangle.
  const out = [];
  for (const t of tris) {
    if (t[0] < n && t[1] < n && t[2] < n) out.push(t);
  }
  return out;
}

function sameEdge(e, f) {
  return (e[0] === f[0] && e[1] === f[1]) || (e[0] === f[1] && e[1] === f[0]);
}

// Incircle determinant; sign flips with triangle orientation.
function inCircumcircle(ax, ay, bx, by, cx, cy, px, py) {
  const orient = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const ax_ = ax - px, ay_ = ay - py;
  const bx_ = bx - px, by_ = by - py;
  const cx_ = cx - px, cy_ = cy - py;
  const d =
    (ax_ * ax_ + ay_ * ay_) * (bx_ * cy_ - cx_ * by_) -
    (bx_ * bx_ + by_ * by_) * (ax_ * cy_ - cx_ * ay_) +
    (cx_ * cx_ + cy_ * cy_) * (ax_ * by_ - bx_ * ay_);
  return orient > 0 ? d > 0 : d < 0;
}
