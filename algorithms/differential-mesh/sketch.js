// differential-mesh/sketch.js — 3D differential growth on a triangle mesh.
//
// Topology starts as an octahedron and grows by edge subdivision: any edge
// longer than a threshold is split at its midpoint (both incident faces split,
// so the surface stays watertight). Per frame each vertex is pushed away from
// nearby vertices (repulsion), pulled along its edges toward a rest length
// (springs), and fairied toward its neighbours (smoothing). Area grows faster
// than smoothing can flatten it, so the membrane folds.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT } from "../../js/engine/palette.js";

const REST = 16;            // target edge length
const SPLIT = REST * 1.6;   // split edges longer than this
const REPEL = REST * 1.9;   // repulsion radius

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const maxVerts = preview ? 320 : 850;

  let verts, vel, faces; // verts/vel: [{x,y,z}]; faces: [[a,b,c]]
  let edges, neighbours; // adjacency cache, rebuilt on topology change
  let angle = 0;
  const tilt = 0.5;

  function reset() {
    const o = octahedron(REST * 1.4);
    verts = o.verts.map((v) => ({ x: v[0], y: v[1], z: v[2] }));
    vel = verts.map(() => ({ x: 0, y: 0, z: 0 }));
    faces = o.faces;
    rebuildAdjacency();
  }

  function rebuildAdjacency() {
    const adj = buildAdjacency(faces, verts.length);
    edges = adj.edges;
    neighbours = adj.neighbours;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h, p.WEBGL);
    reset();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
  };

  function grow() {
    if (verts.length >= maxVerts) return;
    if (Math.random() > params.growth) return;
    const newFaces = subdivide(verts, vel, faces, SPLIT);
    if (newFaces !== faces) {
      faces = newFaces;
      rebuildAdjacency();
    }
  }

  // --- spatial hash for repulsion ---
  function hashVerts() {
    const grid = new Map();
    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const key =
        ((v.x / REPEL) | 0) + "," + ((v.y / REPEL) | 0) + "," + ((v.z / REPEL) | 0);
      let b = grid.get(key);
      if (!b) grid.set(key, (b = []));
      b.push(i);
    }
    return grid;
  }

  function step() {
    const repulsion = params.repulsion;
    const attraction = params.attraction;
    const smoothing = params.smoothing;
    const n = verts.length;
    const acc = verts.map(() => ({ x: 0, y: 0, z: 0 }));

    // Repulsion (spatial-hashed, 3x3x3 cell scan).
    const grid = hashVerts();
    for (let i = 0; i < n; i++) {
      const v = verts[i];
      const cx = (v.x / REPEL) | 0, cy = (v.y / REPEL) | 0, cz = (v.z / REPEL) | 0;
      for (let gx = cx - 1; gx <= cx + 1; gx++)
        for (let gy = cy - 1; gy <= cy + 1; gy++)
          for (let gz = cz - 1; gz <= cz + 1; gz++) {
            const b = grid.get(gx + "," + gy + "," + gz);
            if (!b) continue;
            for (const j of b) {
              if (j === i) continue;
              const dx = v.x - verts[j].x, dy = v.y - verts[j].y, dz = v.z - verts[j].z;
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 > 0 && d2 < REPEL * REPEL) {
                const d = Math.sqrt(d2);
                const f = ((REPEL - d) / REPEL) * repulsion * 0.5;
                acc[i].x += (dx / d) * f; acc[i].y += (dy / d) * f; acc[i].z += (dz / d) * f;
              }
            }
          }
    }

    // Springs along edges toward REST.
    for (const [a, b] of edges) {
      const va = verts[a], vb = verts[b];
      const dx = vb.x - va.x, dy = vb.y - va.y, dz = vb.z - va.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const f = ((d - REST) / d) * attraction * 0.5;
      acc[a].x += dx * f; acc[a].y += dy * f; acc[a].z += dz * f;
      acc[b].x -= dx * f; acc[b].y -= dy * f; acc[b].z -= dz * f;
    }

    // Smoothing toward the neighbour centroid.
    for (let i = 0; i < n; i++) {
      const nb = neighbours[i];
      if (!nb.length) continue;
      let mx = 0, my = 0, mz = 0;
      for (const j of nb) { mx += verts[j].x; my += verts[j].y; mz += verts[j].z; }
      mx /= nb.length; my /= nb.length; mz /= nb.length;
      acc[i].x += (mx - verts[i].x) * smoothing;
      acc[i].y += (my - verts[i].y) * smoothing;
      acc[i].z += (mz - verts[i].z) * smoothing;
    }

    // Integrate with damping + speed cap.
    for (let i = 0; i < n; i++) {
      const ve = vel[i], a = acc[i];
      ve.x = (ve.x + a.x) * 0.6;
      ve.y = (ve.y + a.y) * 0.6;
      ve.z = (ve.z + a.z) * 0.6;
      const sp = Math.hypot(ve.x, ve.y, ve.z);
      if (sp > 4) { ve.x = ve.x / sp * 4; ve.y = ve.y / sp * 4; ve.z = ve.z / sp * 4; }
      verts[i].x += ve.x; verts[i].y += ve.y; verts[i].z += ve.z;
    }
  }

  p.draw = () => {
    grow();
    step();

    // Recentre + auto-fit so the growing mesh stays framed.
    let cx = 0, cy = 0, cz = 0;
    for (const v of verts) { cx += v.x; cy += v.y; cz += v.z; }
    cx /= verts.length; cy /= verts.length; cz /= verts.length;
    let maxR = 1;
    for (const v of verts) {
      const r = Math.hypot(v.x - cx, v.y - cy, v.z - cz);
      if (r > maxR) maxR = r;
    }
    const S = (Math.min(p.width, p.height) * 0.38) / maxR;

    angle += params.spin * 0.01;

    p.background(...BG);
    p.push();
    p.rotateX(tilt);
    p.rotateY(angle);
    p.scale(S);
    p.translate(-cx, -cy, -cz);

    p.ambientLight(48, 48, 48);
    p.directionalLight(ACCENT[0], ACCENT[1], ACCENT[2], 0.4, 0.6, -0.7);
    p.directionalLight(INK[0] * 0.5, INK[1] * 0.5, INK[2] * 0.5, -0.5, -0.3, -0.4);
    p.ambientMaterial(ACCENT[0], ACCENT[1], ACCENT[2]);
    p.stroke(INK[0], INK[1], INK[2], 35);
    p.strokeWeight(0.6 / S);

    p.beginShape(p.TRIANGLES);
    for (const f of faces) {
      const a = verts[f[0]], b = verts[f[1]], c = verts[f[2]];
      // Flat per-face normal, flipped to face outward from the centroid.
      let nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
      let ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
      let nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      const fxc = (a.x + b.x + c.x) / 3 - cx;
      const fyc = (a.y + b.y + c.y) / 3 - cy;
      const fzc = (a.z + b.z + c.z) / 3 - cz;
      if (nx * fxc + ny * fyc + nz * fzc < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1;
      p.normal(nx / nl, ny / nl, nz / nl);
      p.vertex(a.x, a.y, a.z);
      p.vertex(b.x, b.y, b.z);
      p.vertex(c.x, c.y, c.z);
    }
    p.endShape();
    p.pop();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}

// --- mesh helpers (pure) ----------------------------------------------------

// Octahedron of the given radius: 6 vertices, 8 faces.
function octahedron(r) {
  const verts = [
    [r, 0, 0], [-r, 0, 0], [0, r, 0], [0, -r, 0], [0, 0, r], [0, 0, -r],
  ];
  const faces = [
    [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
    [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
  ];
  return { verts, faces };
}

// Unique edges + per-vertex neighbour lists from a face list.
function buildAdjacency(faces, vCount) {
  const seen = new Set();
  const edges = [];
  const neighbours = Array.from({ length: vCount }, () => []);
  for (const f of faces) {
    for (let e = 0; e < 3; e++) {
      const a = f[e], b = f[(e + 1) % 3];
      const key = a < b ? a + "," + b : b + "," + a;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
        neighbours[a].push(b);
        neighbours[b].push(a);
      }
    }
  }
  return { edges, neighbours };
}

// Split every edge longer than `threshold`, at most one edge per face per pass
// (so both faces of any split edge are free — keeps the mesh watertight).
// Pushes midpoint vertices onto verts/vel and returns a new faces array; if
// nothing split, returns the original `faces` reference unchanged.
function subdivide(verts, vel, faces, threshold) {
  const edgeMap = new Map();
  for (let fi = 0; fi < faces.length; fi++) {
    const f = faces[fi];
    for (let e = 0; e < 3; e++) {
      const a = f[e], b = f[(e + 1) % 3];
      const key = a < b ? a + "," + b : b + "," + a;
      let rec = edgeMap.get(key);
      if (!rec) edgeMap.set(key, (rec = { a: Math.min(a, b), b: Math.max(a, b), faces: [] }));
      rec.faces.push(fi);
    }
  }

  const t2 = threshold * threshold;
  const cands = [];
  for (const rec of edgeMap.values()) {
    const va = verts[rec.a], vb = verts[rec.b];
    const d2 = (va.x - vb.x) ** 2 + (va.y - vb.y) ** 2 + (va.z - vb.z) ** 2;
    if (d2 > t2) cands.push({ rec, d2 });
  }
  if (cands.length === 0) return faces;
  cands.sort((p, q) => q.d2 - p.d2);

  const consumed = new Array(faces.length).fill(false);
  const faceSplit = new Map(); // faceIndex -> {a, b, m}
  for (const { rec } of cands) {
    if (rec.faces.some((fi) => consumed[fi])) continue;
    const va = verts[rec.a], vb = verts[rec.b];
    const m = verts.length;
    verts.push({ x: (va.x + vb.x) / 2, y: (va.y + vb.y) / 2, z: (va.z + vb.z) / 2 });
    vel.push({ x: 0, y: 0, z: 0 });
    for (const fi of rec.faces) { consumed[fi] = true; faceSplit.set(fi, { a: rec.a, b: rec.b, m }); }
  }
  if (faceSplit.size === 0) return faces;

  const out = [];
  for (let fi = 0; fi < faces.length; fi++) {
    const split = faceSplit.get(fi);
    const f = faces[fi];
    if (!split) { out.push(f); continue; }
    const { a, b, m } = split;
    for (let e = 0; e < 3; e++) {
      const u = f[e], v = f[(e + 1) % 3], w = f[(e + 2) % 3];
      if ((u === a && v === b) || (u === b && v === a)) {
        // Replace edge u→v with u→m→v, preserving winding (third vertex w).
        out.push([u, m, w], [m, v, w]);
        break;
      }
    }
  }
  return out;
}
