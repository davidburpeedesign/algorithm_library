// L-System — Lindenmayer rewriting systems rendered with turtle graphics.
import { sketch } from "./sketch.js";

export default {
  id: "l-system",
  title: "L-System",
  blurb:
    "A string is rewritten by simple production rules, then drawn as a turtle path — the grammar of branching plants and fractal curves.",
  tags: ["lindenmayer", "fractal", "growth"],

  // Static output: redraw whenever a control changes.
  restartOnChange: true,

  params: {
    preset: {
      value: "plant",
      label: "System",
      options: {
        "Fractal Plant": "plant",
        "Koch Curve": "koch",
        "Dragon Curve": "dragon",
        "Sierpinski": "sierpinski",
      },
    },
    iterations: { value: 5, min: 1, max: 8, step: 1, label: "Iterations" },
    weight:     { value: 1.4, min: 0.5, max: 3, step: 0.1, label: "Stroke" },
  },

  sketch,
};
