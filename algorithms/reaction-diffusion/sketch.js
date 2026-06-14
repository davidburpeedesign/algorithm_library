// reaction-diffusion/sketch.js — Gray-Scott on a typed-array grid.
//
// The canvas is created at simulation resolution and stretched to fill its
// container via CSS (nearest-neighbour), which keeps the per-pixel update cheap
// while still looking crisp.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  // Grid resolution (cells). Previews run a smaller field.
  const COLS = preview ? 90 : 170;
  let rows = preview ? 68 : 110;

  let a, b, a2, b2; // Float32 buffers: current + next for both chemicals.

  function seed() {
    const n = COLS * rows;
    a = new Float32Array(n).fill(1);
    b = new Float32Array(n).fill(0);
    a2 = new Float32Array(n);
    b2 = new Float32Array(n);

    // Drop a few squares of chemical B to nucleate the pattern.
    const blobs = preview ? 2 : 5;
    for (let k = 0; k < blobs; k++) {
      const cx = Math.floor(p.random(COLS * 0.2, COLS * 0.8));
      const cy = Math.floor(p.random(rows * 0.2, rows * 0.8));
      const s = preview ? 4 : 6;
      for (let y = cy - s; y < cy + s; y++) {
        for (let x = cx - s; x < cx + s; x++) {
          if (x <= 0 || y <= 0 || x >= COLS - 1 || y >= rows - 1) continue;
          b[x + y * COLS] = 1;
        }
      }
    }
  }

  p.setup = () => {
    // Keep the simulation's aspect ratio close to the container's.
    const { w, h } = sizeOf(container);
    rows = Math.max(40, Math.round(COLS * (h / w)));
    p.createCanvas(COLS, rows);
    p.pixelDensity(1);
    p.noSmooth();
    // Stretch the low-res canvas to fill the card/stage.
    p.canvas.style.imageRendering = "pixelated";
    seed();
  };

  function step() {
    const { dA, dB, feed, kill } = params;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const i = x + y * COLS;
        const lapA = laplace(a, i);
        const lapB = laplace(b, i);
        const av = a[i];
        const bv = b[i];
        const reaction = av * bv * bv;
        a2[i] = av + (dA * lapA - reaction + feed * (1 - av));
        b2[i] = bv + (dB * lapB + reaction - (kill + feed) * bv);
      }
    }
    // Swap buffers.
    [a, a2] = [a2, a];
    [b, b2] = [b2, b];
  }

  // 3x3 Laplacian kernel (center -1, edges 0.2, corners 0.05).
  function laplace(grid, i) {
    return (
      grid[i] * -1 +
      (grid[i - 1] + grid[i + 1] + grid[i - COLS] + grid[i + COLS]) * 0.2 +
      (grid[i - COLS - 1] + grid[i - COLS + 1] + grid[i + COLS - 1] + grid[i + COLS + 1]) * 0.05
    );
  }

  p.draw = () => {
    const steps = Math.round(params.speed);
    for (let s = 0; s < steps; s++) step();

    p.loadPixels();
    const px = p.pixels;
    for (let i = 0; i < COLS * rows; i++) {
      // Patterns (high chemical B) are the content → accent; substrate → bg.
      const t = 1 - Math.max(0, Math.min(1, a[i] - b[i]));
      const c = lerpRGB(BG, ACCENT, t);
      const j = i * 4;
      px[j] = c[0]; px[j + 1] = c[1]; px[j + 2] = c[2]; px[j + 3] = 255;
    }
    p.updatePixels();
  };

  // Re-seed on click for quick exploration in the detail view.
  p.mousePressed = () => {
    if (!preview) seed();
  };
}
