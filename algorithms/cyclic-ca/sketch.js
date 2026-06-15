// cyclic-ca/sketch.js — cyclic cellular automaton on a toroidal grid.
//
// Rule (Greenberg-Hastings / Griffeath cyclic CA): a cell in state v looks at
// its Moore neighbourhood of the given range; if at least `threshold` of those
// neighbours are in state (v+1) mod N, the cell advances to (v+1) mod N,
// otherwise it holds. Runs at a fixed low resolution (CSS-stretched, pixelated)
// so the neighbour counting stays cheap.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 110 : 180;
  let rows = preview ? 80 : 120;

  let cur, next; // Uint8Array state grids

  function reset() {
    const n = COLS * rows;
    const states = Math.round(params.states);
    cur = new Uint8Array(n);
    next = new Uint8Array(n);
    for (let i = 0; i < n; i++) cur[i] = (Math.random() * states) | 0;
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

  function step() {
    const states = Math.round(params.states);
    const threshold = Math.round(params.threshold);
    const range = Math.round(params.range);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = x + y * COLS;
        // Normalise in case `states` was just lowered beneath a stale value.
        const v = cur[i] % states;
        const wantsNext = (v + 1) % states;

        let count = 0;
        for (let dy = -range; dy <= range; dy++) {
          const yy = (y + dy + rows) % rows;
          for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue;
            const xx = (x + dx + COLS) % COLS;
            if (cur[xx + yy * COLS] % states === wantsNext) {
              if (++count >= threshold) break;
            }
          }
          if (count >= threshold) break;
        }

        next[i] = count >= threshold ? wantsNext : v;
      }
    }
    [cur, next] = [next, cur];
  }

  p.draw = () => {
    const steps = Math.round(params.speed);
    for (let s = 0; s < steps; s++) step();

    const states = Math.round(params.states);
    p.loadPixels();
    const px = p.pixels;
    for (let i = 0; i < COLS * rows; i++) {
      // Phase within the cycle ramps from background to accent; the wrap from
      // N−1 back to 0 reads as the sharp leading edge of each wave.
      const t = (cur[i] % states) / (states - 1);
      const c = lerpRGB(BG, ACCENT, t);
      const j = i * 4;
      px[j] = c[0]; px[j + 1] = c[1]; px[j + 2] = c[2]; px[j + 3] = 255;
    }
    p.updatePixels();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
