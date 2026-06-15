// space-colonization/sketch.js — Runions space-colonization branching.
//
// Each iteration: every attractor pulls on its nearest tree node within the
// influence radius; nodes that are pulled grow one step toward the average of
// their attractors, forking where targets diverge. Attractors inside the kill
// radius of the tree are consumed. A spatial hash keeps the nearest-node search
// near O(attractors). Branch thickness is derived from how many leaves a node
// feeds, so trunks read heavier than twigs.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  let nx, ny, par;   // node arrays: position + parent index (-1 for root)
  let attractors;    // [{x, y}]
  let cell;          // spatial-hash cell size (= influence)

  const targetAttractors = () =>
    Math.round(params.attractors * (preview ? 0.5 : 1));

  function reset() {
    const { w, h } = sizeOf(container);
    nx = [w / 2];
    ny = [h * 0.96];
    par = [-1];

    attractors = [];
    const count = targetAttractors();
    // Scatter through an elliptical canopy in the upper region.
    const cxp = w / 2, cyp = h * 0.42;
    const rxp = w * 0.46, ryp = h * 0.42;
    let guard = 0;
    while (attractors.length < count && guard < count * 20) {
      guard++;
      const ang = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random());
      const x = cxp + Math.cos(ang) * rxp * rr;
      const y = cyp + Math.sin(ang) * ryp * rr;
      if (x > 2 && x < w - 2 && y > 2 && y < h * 0.9) attractors.push({ x, y });
    }
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    reset();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
    reset();
  };

  function buildHash() {
    cell = params.influence;
    const grid = new Map();
    for (let i = 0; i < nx.length; i++) {
      const key = ((nx[i] / cell) | 0) + "," + ((ny[i] / cell) | 0);
      let b = grid.get(key);
      if (!b) grid.set(key, (b = []));
      b.push(i);
    }
    return grid;
  }

  // Nearest node to (x,y) within `radius`; null if none.
  function nearestNode(grid, x, y, radius) {
    const cx = (x / cell) | 0, cy = (y / cell) | 0;
    const reach = Math.max(1, Math.ceil(radius / cell));
    let best = -1, bestD2 = radius * radius;
    for (let gx = cx - reach; gx <= cx + reach; gx++) {
      for (let gy = cy - reach; gy <= cy + reach; gy++) {
        const b = grid.get(gx + "," + gy);
        if (!b) continue;
        for (const i of b) {
          const dx = nx[i] - x, dy = ny[i] - y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) { bestD2 = d2; best = i; }
        }
      }
    }
    return best < 0 ? null : { idx: best, d2: bestD2 };
  }

  function iterate() {
    if (attractors.length === 0) return;
    const influence = params.influence;
    const kill = params.kill;
    const step = params.step;

    let grid = buildHash();
    const base = nx.length;
    const dirX = new Float64Array(base);
    const dirY = new Float64Array(base);
    const cnt = new Int32Array(base);

    for (const a of attractors) {
      const near = nearestNode(grid, a.x, a.y, influence);
      if (!near) continue;
      const i = near.idx;
      const dx = a.x - nx[i], dy = a.y - ny[i];
      const d = Math.hypot(dx, dy) || 1;
      dirX[i] += dx / d; dirY[i] += dy / d; cnt[i]++;
    }

    let grew = false;
    for (let i = 0; i < base; i++) {
      if (cnt[i] === 0) continue;
      const d = Math.hypot(dirX[i], dirY[i]) || 1;
      nx.push(nx[i] + (dirX[i] / d) * step);
      ny.push(ny[i] + (dirY[i] / d) * step);
      par.push(i);
      grew = true;
    }

    // Bootstrap: if nothing was in range, extend the single closest node.
    if (!grew) {
      let bi = -1, bj = -1, bd2 = Infinity;
      for (let j = 0; j < attractors.length; j++) {
        for (let i = 0; i < nx.length; i++) {
          const dx = attractors[j].x - nx[i], dy = attractors[j].y - ny[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < bd2) { bd2 = d2; bi = i; bj = j; }
        }
      }
      if (bi >= 0) {
        const dx = attractors[bj].x - nx[bi], dy = attractors[bj].y - ny[bi];
        const d = Math.hypot(dx, dy) || 1;
        nx.push(nx[bi] + (dx / d) * step);
        ny.push(ny[bi] + (dy / d) * step);
        par.push(bi);
      } else {
        return;
      }
    }

    // Consume attractors reached by the (now extended) tree.
    grid = buildHash();
    attractors = attractors.filter((a) => {
      const near = nearestNode(grid, a.x, a.y, kill);
      return !near; // within kill radius → reached → drop
    });
  }

  // Leaves fed per node → trunk thickness (parent index < child index, so a
  // single reverse pass accumulates counts toward the root).
  function leafWeights() {
    const n = nx.length;
    const hasChild = new Uint8Array(n);
    for (let i = 1; i < n; i++) hasChild[par[i]] = 1;
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = hasChild[i] ? 0 : 1;
    for (let i = n - 1; i >= 1; i--) w[par[i]] += w[i];
    return w;
  }

  p.draw = () => {
    const iters = Math.round(params.speed);
    for (let s = 0; s < iters; s++) iterate();

    p.background(...BG);

    // Remaining attractors as faint ink specks.
    p.stroke(INK[0], INK[1], INK[2], 45);
    p.strokeWeight(1.5);
    for (const a of attractors) p.point(a.x, a.y);

    // Branches, thicker near the trunk, tinted ink→accent toward the tips.
    const w = leafWeights();
    const maxW = Math.max(1, w[0]);
    for (let i = 1; i < nx.length; i++) {
      const t = 1 - Math.min(1, w[i] / maxW); // 0 at trunk → 1 at twigs
      const c = lerpRGB(lerpRGB(INK, ACCENT, 0.5), ACCENT, t);
      p.stroke(c[0], c[1], c[2]);
      p.strokeWeight(Math.min(6, 0.6 + Math.pow(w[i], 0.25)) * (preview ? 0.7 : 1));
      p.line(nx[par[i]], ny[par[i]], nx[i], ny[i]);
    }
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
