// voronoi/sketch.js — a Voronoi diagram that relaxes via Lloyd's algorithm.
//
// Each frame: assign every (low-res) pixel to its nearest seed while
// accumulating per-cell centroids, then nudge each seed toward its centroid.
// The tessellation settles into an even, centroidal packing.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 120 : 200;
  let rows = preview ? 90 : 130;

  let seeds;        // [{x,y}]
  let colors;       // [[r,g,b]] per seed
  let assign;       // Int16Array nearest-seed index per pixel

  function makeColor() {
    // Varied shades of the accent over the background.
    const t = 0.3 + Math.random() * 0.7;
    return lerpRGB(BG, ACCENT, t).map((v) => Math.round(v));
  }

  function syncSeeds() {
    const target = Math.round(params.seeds);
    while (seeds.length < target) {
      seeds.push({ x: Math.random() * COLS, y: Math.random() * rows });
      colors.push(makeColor());
    }
    if (seeds.length > target) {
      seeds.length = target;
      colors.length = target;
    }
  }

  function reset() {
    seeds = [];
    colors = [];
    assign = new Int16Array(COLS * rows);
    syncSeeds();
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
    syncSeeds();
    const n = seeds.length;
    const sumX = new Float32Array(n);
    const sumY = new Float32Array(n);
    const cnt = new Float32Array(n);

    // Assign pixels to nearest seed + accumulate centroids.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        let best = 0, bestD = Infinity;
        for (let k = 0; k < n; k++) {
          const dx = x - seeds[k].x;
          const dy = y - seeds[k].y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = k; }
        }
        const i = x + y * COLS;
        assign[i] = best;
        sumX[best] += x; sumY[best] += y; cnt[best] += 1;
      }
    }

    // Move seeds toward their centroids (Lloyd), plus a little life.
    const relax = params.relax;
    const jit = params.jitter;
    for (let k = 0; k < n; k++) {
      if (cnt[k] > 0) {
        const cx = sumX[k] / cnt[k];
        const cy = sumY[k] / cnt[k];
        seeds[k].x += (cx - seeds[k].x) * relax + (Math.random() - 0.5) * jit;
        seeds[k].y += (cy - seeds[k].y) * relax + (Math.random() - 0.5) * jit;
        seeds[k].x = Math.max(0, Math.min(COLS - 1, seeds[k].x));
        seeds[k].y = Math.max(0, Math.min(rows - 1, seeds[k].y));
      }
    }

    // Render cells, optionally darkening borders.
    const showBorders = params.borders;
    p.loadPixels();
    const px = p.pixels;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = x + y * COLS;
        const k = assign[i];
        const c = colors[k];
        let r = c[0], g = c[1], b = c[2];
        if (
          showBorders &&
          ((x > 0 && assign[i - 1] !== k) ||
            (y > 0 && assign[i - COLS] !== k))
        ) {
          r = INK[0]; g = INK[1]; b = INK[2];
        }
        const j = i * 4;
        px[j] = r; px[j + 1] = g; px[j + 2] = b; px[j + 3] = 255;
      }
    }
    p.updatePixels();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
