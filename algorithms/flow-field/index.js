// Perlin Flow Field — particles advected by a smooth noise vector field.
import { sketch } from "./sketch.js";

export default {
  id: "flow-field",
  title: "Perlin Flow Field",
  blurb:
    "A grid of angles sampled from Perlin noise becomes a current; particles drift along it, tracing the invisible flow as ink-like filaments.",
  tags: ["noise", "generative", "vector-field"],

  params: {
    particles: { value: 1200, min: 200, max: 4000, step: 50,   label: "Particles" },
    noiseScale:{ value: 0.0025, min: 0.0005, max: 0.01, step: 0.0005, label: "Field scale" },
    speed:     { value: 1.4,  min: 0.3, max: 4,    step: 0.1,  label: "Speed" },
    drift:     { value: 0.15, min: 0,   max: 1,    step: 0.01, label: "Field drift" },
    fade:      { value: 0.04, min: 0,   max: 0.25, step: 0.01, label: "Trail fade" },
  },

  sketch,
};
