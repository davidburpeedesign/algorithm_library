// Chladni Cymatics — sand on a vibrating plate gathering at the nodal lines.
import { sketch } from "./sketch.js";

export default {
  id: "chladni",
  title: "Chladni Cymatics",
  blurb:
    "A plate driven at a resonant frequency stands still only along its nodal lines. Sand jitters everywhere else and settles into those curves — Chladni's figures.",
  tags: ["standing-wave", "resonance", "vibration"],

  params: {
    m:          { value: 3,   min: 1,   max: 8,    step: 1,    label: "Mode m" },
    n:          { value: 4,   min: 1,   max: 8,    step: 1,    label: "Mode n" },
    vibration:  { value: 1.0, min: 0.2, max: 3,    step: 0.1,  label: "Vibration" },
    particles:  { value: 6000,min: 1000,max: 16000,step: 500,  label: "Grains" },
    settle:     { value: 0.9, min: 0.5, max: 0.99, step: 0.01, label: "Settling" },
  },

  sketch,
};
