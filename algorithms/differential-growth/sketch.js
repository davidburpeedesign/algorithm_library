// differential-growth/sketch.js — a self-avoiding, growing node chain.
//
// Each node is pulled toward its two chain neighbours (attraction), pushed away
// from any node within a radius (repulsion), and smoothed toward the midpoint
// of its neighbours. Edges that stretch past a threshold get a new node, so the
// closed loop lengthens and buckles into organic folds.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  let nodes = [];           // [{x, y}]
  const desiredEdge = 9;    // target spacing between adjacent nodes
  let grid;                 // spatial hash for neighbour queries
  let cellSize = 16;

  function reset() {
    const { w, h } = sizeOf(container);
    nodes = [];
    // Seed a small ring in the centre.
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.08;
    const seed = 12;
    for (let i = 0; i < seed; i++) {
      const a = (i / seed) * Math.PI * 2;
      nodes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
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
  };

  // --- spatial hashing for O(n) neighbour lookups ---
  function rebuildGrid(radius) {
    cellSize = Math.max(8, radius);
    grid = new Map();
    for (let i = 0; i < nodes.length; i++) {
      const key = cellKey(nodes[i].x, nodes[i].y);
      let bucket = grid.get(key);
      if (!bucket) grid.set(key, (bucket = []));
      bucket.push(i);
    }
  }
  function cellKey(x, y) {
    return ((x / cellSize) | 0) + "," + ((y / cellSize) | 0);
  }
  function forEachNear(x, y, fn) {
    const cx = (x / cellSize) | 0;
    const cy = (y / cellSize) | 0;
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const bucket = grid.get(gx + "," + gy);
        if (bucket) for (const idx of bucket) fn(idx);
      }
    }
  }

  function grow() {
    const n = nodes.length;
    const maxNodes = Math.round(params.maxNodes * (preview ? 0.5 : 1));
    if (n >= maxNodes) return;

    // Insert a midpoint on edges that have stretched too far. Add a little
    // randomness so growth doesn't happen uniformly (that's what buckles it).
    const rate = params.growth;
    for (let i = 0; i < nodes.length && nodes.length < maxNodes; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % nodes.length];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d > desiredEdge * 1.8 && Math.random() < rate) {
        nodes.splice(i + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        i++;
      }
    }
  }

  p.draw = () => {
    p.background(...BG);
    const n = nodes.length;
    if (n < 3) return;

    const radius = params.repelRadius;
    rebuildGrid(radius);

    const repel = params.repel;
    const attract = params.attract;
    const align = params.align;
    const w = p.width, h = p.height;

    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      let fx = 0, fy = 0;

      // Repulsion from nearby nodes.
      forEachNear(node.x, node.y, (j) => {
        if (j === i) return;
        const dx = node.x - nodes[j].x;
        const dy = node.y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < radius * radius) {
          const d = Math.sqrt(d2);
          const f = (radius - d) / radius;
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
      });
      fx *= repel;
      fy *= repel;

      // Attraction toward the two chain neighbours at the desired spacing.
      const prev = nodes[(i - 1 + n) % n];
      const nxt = nodes[(i + 1) % n];
      for (const nb of [prev, nxt]) {
        const dx = nb.x - node.x;
        const dy = nb.y - node.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - desiredEdge) / d;
        fx += dx * f * attract * 0.5;
        fy += dy * f * attract * 0.5;
      }

      // Smoothing toward the midpoint of the neighbours.
      const mx = (prev.x + nxt.x) / 2;
      const my = (prev.y + nxt.y) / 2;
      fx += (mx - node.x) * align;
      fy += (my - node.y) * align;

      let x = node.x + fx;
      let y = node.y + fy;
      // Keep inside the canvas with a soft margin.
      x = Math.max(4, Math.min(w - 4, x));
      y = Math.max(4, Math.min(h - 4, y));
      next[i] = { x, y };
    }
    nodes = next;

    grow();

    // Draw the closed loop.
    p.noFill();
    p.stroke(...ACCENT);
    p.strokeWeight(preview ? 1 : 1.4);
    p.beginShape();
    for (const nd of nodes) p.vertex(nd.x, nd.y);
    p.endShape(p.CLOSE);
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
