// coral/sketch.js — accretive coral growth on a toroidal-in-x grid.
//
// Each step, every empty cell adjacent to the colony may calcify. Its chance
// combines three biomimetic biases:
//   • curvature — exposed cells (few colony neighbours) grow fastest, so the
//     front fingers out into branches instead of filling solid;
//   • light — cells higher up (toward the surface) grow faster;
//   • a base growth rate.
// Rendered at a fixed low resolution (CSS-stretched, pixelated).
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 110 : 180;
  let rows = preview ? 80 : 120;

  let cur, next; // Uint8Array: 0 empty, 1 coral

  function reset() {
    const n = COLS * rows;
    cur = new Uint8Array(n);
    next = new Uint8Array(n);
    // Seed nucleation points along the seabed (bottom row).
    const seeds = preview ? 5 : 9;
    for (let s = 0; s < seeds; s++) {
      const x = Math.floor(((s + 0.5) / seeds) * COLS + (Math.random() - 0.5) * 6);
      const xx = (x + COLS) % COLS;
      cur[xx + (rows - 1) * COLS] = 1;
    }
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    rows = Math.max(50, Math.round(COLS * (h / w)));
    p.createCanvas(COLS, rows);
    p.pixelDensity(1);
    p.noSmooth();
    p.canvas.style.imageRendering = "pixelated";
    reset();
  };

  // Count colony cells in the Moore neighbourhood (wrapping horizontally only;
  // the seabed and surface are hard boundaries).
  function coralNeighbours(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= rows) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const xx = (x + dx + COLS) % COLS;
        n += cur[xx + yy * COLS];
      }
    }
    return n;
  }

  function step() {
    const growth = params.growth;
    const branch = params.branch;
    const lightBias = params.light;
    next.set(cur);

    for (let y = 0; y < rows; y++) {
      // Height fraction: 1 at the surface (top), 0 at the seabed.
      const h = (rows - 1 - y) / (rows - 1);
      const lightFactor = 0.25 + 0.75 * Math.pow(h, lightBias);
      for (let x = 0; x < COLS; x++) {
        const i = x + y * COLS;
        if (cur[i] !== 0) continue;
        const nb = coralNeighbours(x, y);
        if (nb === 0) continue;

        // Curvature bias: fewer neighbours → more exposed tip → faster.
        const branchFactor = Math.pow(1 / nb, branch);
        const prob = growth * lightFactor * branchFactor;
        if (Math.random() < prob) next[i] = 1;
      }
    }
    [cur, next] = [next, cur];
  }

  p.draw = () => {
    const steps = Math.round(params.speed);
    for (let s = 0; s < steps; s++) step();

    p.loadPixels();
    const px = p.pixels;
    for (let y = 0; y < rows; y++) {
      const h = (rows - 1 - y) / (rows - 1);
      // Base of the colony reads as ink, tips brighten to accent.
      const tip = lerpRGB(INK, ACCENT, 0.3 + 0.7 * h);
      for (let x = 0; x < COLS; x++) {
        const i = x + y * COLS;
        const j = i * 4;
        if (cur[i] !== 0) {
          px[j] = tip[0]; px[j + 1] = tip[1]; px[j + 2] = tip[2];
        } else {
          px[j] = BG[0]; px[j + 1] = BG[1]; px[j + 2] = BG[2];
        }
        px[j + 3] = 255;
      }
    }
    p.updatePixels();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
