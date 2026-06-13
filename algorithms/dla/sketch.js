// dla/sketch.js — diffusion-limited aggregation on an occupancy grid.
//
// Walkers random-walk until they touch the frozen cluster, then stick. Runs at
// a fixed low resolution (CSS-stretched) so many micro-steps per frame are
// affordable. Cells are tinted by the order they froze, revealing growth rings.
import { sizeOf } from "../../js/engine/lifecycle.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 130 : 220;
  let rows = preview ? 100 : 150;

  let grid;        // Float32: 0 = empty, else freeze-order (1..stuckCount)
  let walkers;     // [{x,y}]
  let stuckCount = 0;

  function emptySpawn() {
    for (let tries = 0; tries < 40; tries++) {
      const x = (Math.random() * COLS) | 0;
      const y = (Math.random() * rows) | 0;
      if (grid[x + y * COLS] === 0) return { x, y };
    }
    return { x: (Math.random() * COLS) | 0, y: 0 };
  }

  function syncWalkers() {
    const target = Math.round(params.walkers);
    while (walkers.length < target) walkers.push(emptySpawn());
    if (walkers.length > target) walkers.length = target;
  }

  function reset() {
    grid = new Float32Array(COLS * rows);
    walkers = [];
    stuckCount = 0;

    if (params.seed === "edge") {
      for (let x = 0; x < COLS; x++) freeze(x, rows - 1);
    } else {
      freeze((COLS / 2) | 0, (rows / 2) | 0);
    }
    syncWalkers();
  }

  function freeze(x, y) {
    stuckCount += 1;
    grid[x + y * COLS] = stuckCount;
  }

  function hasFrozenNeighbour(x, y) {
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= rows) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= COLS) continue;
        if (grid[nx + ny * COLS] !== 0) return true;
      }
    }
    return false;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    rows = Math.max(60, Math.round(COLS * (h / w)));
    p.createCanvas(COLS, rows);
    p.pixelDensity(1);
    p.noSmooth();
    p.canvas.style.imageRendering = "pixelated";
    reset();
  };

  p.draw = () => {
    syncWalkers();

    const steps = Math.round(params.stepsPerFrame);
    const stick = params.sticking;
    const count = walkers.length;
    if (count > 0) {
      for (let s = 0; s < steps; s++) {
        const wk = walkers[s % count];
        // Random 8-direction step, clamped to bounds.
        wk.x = Math.max(0, Math.min(COLS - 1, wk.x + ((Math.random() * 3) | 0) - 1));
        wk.y = Math.max(0, Math.min(rows - 1, wk.y + ((Math.random() * 3) | 0) - 1));

        if (hasFrozenNeighbour(wk.x, wk.y) && Math.random() < stick) {
          freeze(wk.x, wk.y);
          Object.assign(wk, emptySpawn());
        }
      }
    }

    p.loadPixels();
    const px = p.pixels;
    const maxAge = Math.max(1, stuckCount);
    for (let i = 0; i < COLS * rows; i++) {
      const j = i * 4;
      const age = grid[i];
      if (age === 0) {
        px[j] = 12; px[j + 1] = 15; px[j + 2] = 20; px[j + 3] = 255;
      } else {
        const t = age / maxAge; // oldest (core) → newest (tips)
        px[j] = 70 + t * 150;
        px[j + 1] = 230 - t * 60;
        px[j + 2] = 200 + t * 40;
        px[j + 3] = 255;
      }
    }
    // Mark live walkers as faint dots.
    for (const wk of walkers) {
      const j = (wk.x + wk.y * COLS) * 4;
      px[j] = 90; px[j + 1] = 100; px[j + 2] = 120; px[j + 3] = 255;
    }
    p.updatePixels();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
