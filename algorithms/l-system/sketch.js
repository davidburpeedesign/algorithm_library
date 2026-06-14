// l-system/sketch.js — expand an L-system string, then draw it with a turtle.
//
// Output is static, so we expand + measure + draw once per (re)mount and then
// stop the rAF loop. The detail view recreates the sketch on every control
// change (see `restartOnChange`).
import { sizeOf } from "../../js/engine/lifecycle.js";
import { BG, INK, ACCENT, lerpRGB } from "../../js/engine/palette.js";

// Each preset: axiom, production rules, turn angle (deg), and a sane iteration
// cap so high counts don't explode the string length.
const PRESETS = {
  plant: {
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    maxIter: 6,
  },
  koch: {
    axiom: "F",
    rules: { F: "F+F-F-F+F" },
    angle: 90,
    maxIter: 5,
  },
  dragon: {
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    maxIter: 13,
  },
  sierpinski: {
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    maxIter: 7,
  },
};

export function sketch(p, ctx) {
  const { params, preview, container } = ctx;

  function expand(preset, iterations) {
    let s = preset.axiom;
    for (let i = 0; i < iterations; i++) {
      let next = "";
      for (const ch of s) next += preset.rules[ch] ?? ch;
      s = next;
    }
    return s;
  }

  // Walk the string producing line segments; F and G both draw forward.
  function buildSegments(str, angleDeg) {
    const segs = [];
    const angle = (angleDeg * Math.PI) / 180;
    let x = 0, y = 0, heading = -Math.PI / 2; // start pointing up
    const stack = [];

    for (const ch of str) {
      switch (ch) {
        case "F":
        case "G": {
          const nx = x + Math.cos(heading);
          const ny = y + Math.sin(heading);
          segs.push([x, y, nx, ny]);
          x = nx; y = ny;
          break;
        }
        case "+": heading += angle; break;
        case "-": heading -= angle; break;
        case "[": stack.push([x, y, heading]); break;
        case "]": [x, y, heading] = stack.pop(); break;
        default: break; // X, Y, etc. are no-ops for the turtle
      }
    }
    return segs;
  }

  p.setup = () => {
    const { w, h } = sizeOf(container);
    p.createCanvas(w, h);
    p.noLoop(); // static render

    const preset = PRESETS[params.preset] ?? PRESETS.plant;
    const iterations = Math.min(params.iterations, preset.maxIter);
    const str = expand(preset, iterations);
    const segs = buildSegments(str, preset.angle);

    p.background(...BG);
    if (segs.length === 0) return;

    // Fit the path into the canvas with padding.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x1, y1, x2, y2] of segs) {
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    }
    const pad = 18;
    const bw = Math.max(1e-6, maxX - minX);
    const bh = Math.max(1e-6, maxY - minY);
    const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
    const offX = (w - bw * scale) / 2 - minX * scale;
    const offY = (h - bh * scale) / 2 - minY * scale;

    p.strokeWeight(preview ? 1 : params.weight);
    for (let i = 0; i < segs.length; i++) {
      const [x1, y1, x2, y2] = segs[i];
      // Gradient along the path: ink base → accent tips.
      const t = i / segs.length;
      const c = lerpRGB(INK, ACCENT, t);
      p.stroke(c[0], c[1], c[2], 230);
      p.line(
        offX + x1 * scale, offY + y1 * scale,
        offX + x2 * scale, offY + y2 * scale
      );
    }
  };

  p.windowResized = () => {
    const { w, h } = sizeOf(container);
    p.resizeCanvas(w, h);
    p.redraw();
  };
}
