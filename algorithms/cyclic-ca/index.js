// Cyclic CA — a Greenberg-Hastings / cyclic cellular automaton (excitable
// media). Cells cycle 0 → 1 → … → N−1 → 0; a cell only advances when enough
// neighbours already hold the next state, so excitation spreads as travelling
// waves that wrap into self-sustaining spirals.
import { sketch } from "./sketch.js";

export default {
  id: "cyclic-ca",
  title: "Cyclic Cellular Automaton",
  blurb:
    "Excitable cells advance to the next state only when enough neighbours lead them there. Random noise organises itself into rotating spiral waves.",
  tags: ["cellular-automaton", "excitable-media", "spirals"],

  params: {
    states:    { value: 14, min: 3, max: 24, step: 1, label: "States" },
    threshold: { value: 4,  min: 1, max: 12, step: 1, label: "Threshold" },
    range:     { value: 2,  min: 1, max: 3,  step: 1, label: "Range" },
    speed:     { value: 1,  min: 1, max: 4,  step: 1, label: "Steps/frame" },
  },

  sketch,
};
