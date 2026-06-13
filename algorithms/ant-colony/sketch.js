// ant-colony/sketch.js — stigmergic foraging on two pheromone fields.
//
// Searching ants follow the "to-food" trail and lay a "to-home" trail;
// ants carrying food do the reverse. Both fields evaporate, so only paths
// that keep getting reinforced survive — short routes win.
import { sizeOf } from "../../js/engine/lifecycle.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 150 : 230;
  let rows = preview ? 110 : 150;

  let foodPher, homePher; // Float32 fields
  let ants;               // [{x,y,dir,hasFood,strength}]
  let nest;               // {x,y}
  let foods;              // [{x,y,r,amount}]

  const targetAnts = () => Math.round(params.ants * (preview ? 0.5 : 1));

  function makeAnt() {
    return {
      x: nest.x,
      y: nest.y,
      dir: Math.random() * Math.PI * 2,
      hasFood: false,
      strength: 1,
    };
  }

  function syncAnts() {
    const target = targetAnts();
    while (ants.length < target) ants.push(makeAnt());
    if (ants.length > target) ants.length = target;
  }

  function reset() {
    foodPher = new Float32Array(COLS * rows);
    homePher = new Float32Array(COLS * rows);
    nest = { x: COLS * 0.5, y: rows * 0.5 };
    // A few food caches around the arena.
    foods = [
      { x: COLS * 0.18, y: rows * 0.25, r: 6, amount: 6000 },
      { x: COLS * 0.82, y: rows * 0.30, r: 6, amount: 6000 },
      { x: COLS * 0.30, y: rows * 0.82, r: 6, amount: 6000 },
      { x: COLS * 0.78, y: rows * 0.78, r: 6, amount: 6000 },
    ];
    ants = [];
    syncAnts();
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    rows = Math.max(70, Math.round(COLS * (h / w)));
    p.createCanvas(COLS, rows);
    p.pixelDensity(1);
    p.noSmooth();
    p.canvas.style.imageRendering = "pixelated";
    reset();
  };

  function senseField(field, x, y) {
    const ix = Math.max(0, Math.min(COLS - 1, x | 0));
    const iy = Math.max(0, Math.min(rows - 1, y | 0));
    return field[ix + iy * COLS];
  }

  function stepAnts() {
    const sa = (params.sensorAngle * Math.PI) / 180;
    const sd = params.sensorDist;
    const wander = params.wander;

    for (const a of ants) {
      // Follow the field that leads to the ant's current goal.
      const target = a.hasFood ? homePher : foodPher;

      const fx = a.x + Math.cos(a.dir) * sd;
      const fy = a.y + Math.sin(a.dir) * sd;
      const lx = a.x + Math.cos(a.dir - sa) * sd;
      const ly = a.y + Math.sin(a.dir - sa) * sd;
      const rx = a.x + Math.cos(a.dir + sa) * sd;
      const ry = a.y + Math.sin(a.dir + sa) * sd;

      const f = senseField(target, fx, fy);
      const l = senseField(target, lx, ly);
      const r = senseField(target, rx, ry);

      if (f >= l && f >= r) {
        // stay
      } else if (l > r) {
        a.dir -= sa * 0.5;
      } else {
        a.dir += sa * 0.5;
      }
      a.dir += (Math.random() - 0.5) * wander;

      a.x += Math.cos(a.dir);
      a.y += Math.sin(a.dir);

      // Reflect off the arena walls.
      if (a.x < 0 || a.x >= COLS) { a.dir = Math.PI - a.dir; a.x = Math.max(0, Math.min(COLS - 1, a.x)); }
      if (a.y < 0 || a.y >= rows) { a.dir = -a.dir; a.y = Math.max(0, Math.min(rows - 1, a.y)); }

      // Deposit onto the trail the ant is *building* (opposite of its goal).
      a.strength *= 0.992;
      const idx = (a.x | 0) + (a.y | 0) * COLS;
      const deposit = a.hasFood ? foodPher : homePher;
      deposit[idx] = Math.min(1, deposit[idx] + a.strength * 0.3);

      // Reaching food / nest flips the ant's goal and refreshes its trail.
      if (!a.hasFood) {
        for (const fd of foods) {
          if (fd.amount > 0 && dist2(a.x, a.y, fd.x, fd.y) < fd.r * fd.r) {
            a.hasFood = true;
            a.strength = 1;
            a.dir += Math.PI;
            fd.amount -= 1;
            break;
          }
        }
      } else if (dist2(a.x, a.y, nest.x, nest.y) < 16) {
        a.hasFood = false;
        a.strength = 1;
        a.dir += Math.PI;
      }
    }
  }

  function evaporate() {
    const e = params.evaporation;
    for (let i = 0; i < foodPher.length; i++) {
      foodPher[i] *= e;
      homePher[i] *= e;
    }
  }

  p.draw = () => {
    syncAnts();
    stepAnts();
    evaporate();

    p.loadPixels();
    const px = p.pixels;
    for (let i = 0; i < COLS * rows; i++) {
      const fp = Math.min(1, foodPher[i]);
      const hp = Math.min(1, homePher[i]);
      const j = i * 4;
      // food trail → teal, home trail → violet, blended over dark.
      px[j] = 14 + hp * 150;
      px[j + 1] = 18 + fp * 200;
      px[j + 2] = 24 + fp * 120 + hp * 120;
      px[j + 3] = 255;
    }
    // Nest (white), food (amber while stocked).
    paintDisc(px, nest.x, nest.y, 2, [240, 240, 245]);
    for (const fd of foods) {
      if (fd.amount > 0) paintDisc(px, fd.x, fd.y, 2, [240, 200, 120]);
    }
    // Ants.
    for (const a of ants) {
      const j = ((a.x | 0) + (a.y | 0) * COLS) * 4;
      if (a.hasFood) { px[j] = 250; px[j + 1] = 210; px[j + 2] = 130; }
      else { px[j] = 220; px[j + 1] = 225; px[j + 2] = 235; }
      px[j + 3] = 255;
    }
    p.updatePixels();
  };

  function paintDisc(px, cx, cy, r, rgb) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = (cx | 0) + dx, y = (cy | 0) + dy;
        if (x < 0 || y < 0 || x >= COLS || y >= rows) continue;
        const j = (x + y * COLS) * 4;
        px[j] = rgb[0]; px[j + 1] = rgb[1]; px[j + 2] = rgb[2]; px[j + 3] = 255;
      }
    }
  }

  function dist2(x1, y1, x2, y2) {
    const dx = x1 - x2, dy = y1 - y2;
    return dx * dx + dy * dy;
  }

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
