// chladni/sketch.js — grains migrating to the nodal lines of a vibrating plate.
//
// Displacement of the plate is the classic two-mode standing wave. Each grain
// is kicked in proportion to the local |amplitude|, so it wanders across
// antinodes and stalls where the plate is still — tracing the nodal curves.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  // Packed grains: [x, y, vx, vy] with positions in plate space [0,1].
  let grains;
  const STRIDE = 4;
  let count = 0;

  const targetCount = () =>
    Math.round(params.particles * (preview ? 0.4 : 1));

  function spawn() {
    count = targetCount();
    grains = new Float32Array(count * STRIDE);
    for (let i = 0; i < count; i++) {
      const j = i * STRIDE;
      grains[j] = Math.random();
      grains[j + 1] = Math.random();
      grains[j + 2] = 0;
      grains[j + 3] = 0;
    }
  }

  // Plate displacement for modes (m, n); nodal lines are where this is 0.
  function amplitude(x, y) {
    const m = params.m, n = params.n;
    return (
      Math.sin(Math.PI * m * x) * Math.sin(Math.PI * n * y) -
      Math.sin(Math.PI * n * x) * Math.sin(Math.PI * m * y)
    );
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    spawn();
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
  };

  p.draw = () => {
    if (count !== targetCount()) spawn();

    p.background(...BG);

    const damp = 1 - params.settle; // higher "settling" → stronger damping
    const vib = params.vibration;
    const w = p.width, h = p.height;

    p.stroke(...ACCENT);
    p.strokeWeight(preview ? 1.2 : 1.5);

    for (let i = 0; i < count; i++) {
      const j = i * STRIDE;
      let x = grains[j], y = grains[j + 1];
      let vx = grains[j + 2], vy = grains[j + 3];

      const mag = Math.abs(amplitude(x, y));
      // Random kick scaled by local amplitude; velocity damps toward rest.
      vx = vx * damp + (Math.random() - 0.5) * mag * vib * 0.06;
      vy = vy * damp + (Math.random() - 0.5) * mag * vib * 0.06;
      x += vx;
      y += vy;

      // Reflect off the plate edges.
      if (x < 0) { x = 0; vx = -vx; } else if (x > 1) { x = 1; vx = -vx; }
      if (y < 0) { y = 0; vy = -vy; } else if (y > 1) { y = 1; vy = -vy; }

      grains[j] = x; grains[j + 1] = y;
      grains[j + 2] = vx; grains[j + 3] = vy;

      p.point(x * w, y * h);
    }
  };

  p.mousePressed = () => {
    if (!preview) spawn();
  };
}
