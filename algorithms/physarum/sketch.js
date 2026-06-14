// physarum/sketch.js — agent-based slime-mould simulation on a trail field.
//
// Runs at a fixed low internal resolution (CSS-stretched, pixelated) so the
// per-pixel diffuse/decay pass and thousands of agents stay cheap.
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, ACCENT, lerpRGB } from "../../js/engine/palette.js";

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  const COLS = preview ? 150 : 260;
  let rows = preview ? 110 : 170;

  let trail, next; // Float32 trail field (current + scratch for blur)
  let agents;      // Float32Array packed [x, y, heading, ...]
  const AGENT_STRIDE = 3;

  const targetAgents = () =>
    Math.round(params.agents * (preview ? 0.35 : 1));

  function spawnAgents() {
    const n = targetAgents();
    agents = new Float32Array(n * AGENT_STRIDE);
    // Seed agents in a disc near the centre, headings pointing outward.
    const cx = COLS / 2, cy = rows / 2;
    const r = Math.min(COLS, rows) * 0.25;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * r;
      const j = i * AGENT_STRIDE;
      agents[j] = cx + Math.cos(a) * rr;
      agents[j + 1] = cy + Math.sin(a) * rr;
      agents[j + 2] = a + Math.PI; // face inward-ish for converging webs
    }
  }

  function reset() {
    trail = new Float32Array(COLS * rows);
    next = new Float32Array(COLS * rows);
    spawnAgents();
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

  function sample(x, y) {
    // Wrapped nearest-cell read of the trail field.
    const ix = ((Math.floor(x) % COLS) + COLS) % COLS;
    const iy = ((Math.floor(y) % rows) + rows) % rows;
    return trail[ix + iy * COLS];
  }

  function stepAgents() {
    const sa = (params.sensorAngle * Math.PI) / 180;
    const sd = params.sensorDist;
    const turn = (params.turnSpeed * Math.PI) / 180;
    const n = agents.length / AGENT_STRIDE;

    for (let i = 0; i < n; i++) {
      const j = i * AGENT_STRIDE;
      let x = agents[j], y = agents[j + 1], h = agents[j + 2];

      // Three sensors: front, front-left, front-right.
      const f = sample(x + Math.cos(h) * sd, y + Math.sin(h) * sd);
      const l = sample(x + Math.cos(h - sa) * sd, y + Math.sin(h - sa) * sd);
      const r = sample(x + Math.cos(h + sa) * sd, y + Math.sin(h + sa) * sd);

      if (f > l && f > r) {
        // keep heading
      } else if (l > r) {
        h -= turn;
      } else if (r > l) {
        h += turn;
      } else {
        h += (Math.random() - 0.5) * 2 * turn;
      }

      x += Math.cos(h);
      y += Math.sin(h);
      // Wrap toroidally.
      x = ((x % COLS) + COLS) % COLS;
      y = ((y % rows) + rows) % rows;

      agents[j] = x;
      agents[j + 1] = y;
      agents[j + 2] = h;

      // Deposit.
      const idx = Math.floor(x) + Math.floor(y) * COLS;
      trail[idx] = Math.min(1, trail[idx] + 0.6);
    }
  }

  function diffuseAndDecay() {
    const decay = params.decay;
    for (let y = 0; y < rows; y++) {
      const ym = (y - 1 + rows) % rows;
      const yp = (y + 1) % rows;
      for (let x = 0; x < COLS; x++) {
        const xm = (x - 1 + COLS) % COLS;
        const xp = (x + 1) % COLS;
        // 3x3 box blur, then decay.
        const sum =
          trail[xm + ym * COLS] + trail[x + ym * COLS] + trail[xp + ym * COLS] +
          trail[xm + y * COLS]  + trail[x + y * COLS]  + trail[xp + y * COLS]  +
          trail[xm + yp * COLS] + trail[x + yp * COLS] + trail[xp + yp * COLS];
        next[x + y * COLS] = (sum / 9) * decay;
      }
    }
    [trail, next] = [next, trail];
  }

  p.draw = () => {
    stepAgents();
    diffuseAndDecay();

    p.loadPixels();
    const px = p.pixels;
    for (let i = 0; i < COLS * rows; i++) {
      const v = Math.min(1, trail[i]);
      const j = i * 4;
      // Trail density ramps from background to accent.
      const c = lerpRGB(BG, ACCENT, v);
      px[j] = c[0]; px[j + 1] = c[1]; px[j + 2] = c[2]; px[j + 3] = 255;
    }
    p.updatePixels();
  };

  p.mousePressed = () => {
    if (!preview) reset();
  };
}
