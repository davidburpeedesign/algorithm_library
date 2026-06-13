// DLA — Diffusion-Limited Aggregation: dendritic growth from random walkers.
import { sketch } from "./sketch.js";

export default {
  id: "dla",
  title: "Diffusion-Limited Aggregation",
  blurb:
    "Particles random-walk until they touch the cluster, then freeze. Coral, frost, and mineral dendrites all grow by this rule.",
  tags: ["growth", "fractal", "random-walk"],

  params: {
    walkers:  { value: 12,  min: 2,  max: 40,  step: 1,  label: "Walkers" },
    sticking: { value: 1.0, min: 0.1, max: 1,  step: 0.05, label: "Stickiness" },
    stepsPerFrame: { value: 600, min: 100, max: 3000, step: 100, label: "Steps/frame" },
    seed:     { value: "center", label: "Seed", options: { Center: "center", "Bottom edge": "edge" } },
  },

  sketch,
};
