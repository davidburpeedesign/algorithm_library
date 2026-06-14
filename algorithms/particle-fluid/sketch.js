// particle-fluid/sketch.js — a particle-based 2D liquid.
//
// Pairwise interaction within a radius R: a strong short-range push (so the
// fluid resists compression) minus a gentler mid-range pull (surface tension).
// Velocities are smoothed toward neighbours for viscosity. A uniform spatial
// hash keeps the neighbour search near O(n). Forces are capped, so it stays
// stable across the whole parameter range.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const R = 16;                 // interaction radius
  const MAX_SPEED = 7;
  let parts = [];               // [{x,y,vx,vy}]
  let grid;                     // Map<cellKey, index[]>

  const targetCount = () =>
    Math.round(params.particles * (preview ? 0.45 : 1));

  function makeParticle() {
    return {
      x: p.random(p.width * 0.2, p.width * 0.8),
      y: p.random(p.height * 0.1, p.height * 0.6),
      vx: 0,
      vy: 0,
    };
  }

  function syncPopulation() {
    const target = targetCount();
    while (parts.length < target) parts.push(makeParticle());
    if (parts.length > target) parts.length = target;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    syncPopulation();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
  };

  function buildGrid() {
    grid = new Map();
    for (let i = 0; i < parts.length; i++) {
      const key = ((parts[i].x / R) | 0) + "," + ((parts[i].y / R) | 0);
      let bucket = grid.get(key);
      if (!bucket) grid.set(key, (bucket = []));
      bucket.push(i);
    }
  }

  function interact() {
    const cohesion = params.cohesion;
    const visc = params.viscosity;

    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      const cx = (a.x / R) | 0;
      const cy = (a.y / R) | 0;

      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(gx + "," + gy);
          if (!bucket) continue;
          for (const jdx of bucket) {
            if (jdx <= i) continue; // each unordered pair once
            const b = parts[jdx];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 >= R * R || d2 === 0) continue;

            const d = Math.sqrt(d2);
            const q = 1 - d / R;               // 0 at edge → 1 when coincident
            const nx = dx / d, ny = dy / d;

            // Net radial impulse: repel close, attract mid-range.
            const push = q * q * 1.2;          // short-range repulsion
            const pull = cohesion * q * (1 - q); // mid-range cohesion
            const f = push - pull;
            a.vx += nx * f; a.vy += ny * f;
            b.vx -= nx * f; b.vy -= ny * f;

            // Viscosity: nudge the pair toward a shared velocity.
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            a.vx += rvx * visc * q; a.vy += rvy * visc * q;
            b.vx -= rvx * visc * q; b.vy -= rvy * visc * q;
          }
        }
      }
    }
  }

  function pointerForce() {
    // Stir while dragging: push particles away from the cursor.
    if (!p.mouseIsPressed) return;
    const mx = p.mouseX, my = p.mouseY;
    if (mx < 0 || my < 0 || mx > p.width || my > p.height) return;
    const reach = 60;
    for (const a of parts) {
      const dx = a.x - mx, dy = a.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < reach * reach && d2 > 0) {
        const d = Math.sqrt(d2);
        const f = (1 - d / reach) * 2.5;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
      }
    }
  }

  function integrate() {
    const g = params.gravity;
    const bounce = params.bounce;
    const w = p.width, h = p.height;
    for (const a of parts) {
      a.vy += g;

      // Clamp speed for stability.
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > MAX_SPEED) {
        a.vx = (a.vx / sp) * MAX_SPEED;
        a.vy = (a.vy / sp) * MAX_SPEED;
      }

      a.x += a.vx;
      a.y += a.vy;

      // Walls.
      if (a.x < 2) { a.x = 2; a.vx = -a.vx * bounce; }
      else if (a.x > w - 2) { a.x = w - 2; a.vx = -a.vx * bounce; }
      if (a.y < 2) { a.y = 2; a.vy = -a.vy * bounce; }
      else if (a.y > h - 2) { a.y = h - 2; a.vy = -a.vy * bounce; }
    }
  }

  p.draw = () => {
    syncPopulation();
    buildGrid();
    interact();
    pointerForce();
    integrate();

    p.background(...BG);
    // Overlapping translucent discs read as a connected fluid body.
    p.noStroke();
    p.fill(...ACCENT, 170);
    const r = preview ? 7 : 10;
    for (const a of parts) p.circle(a.x, a.y, r);
  };
}
