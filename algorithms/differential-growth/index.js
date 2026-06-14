// Differential Growth — a node chain that grows, repels itself, and meanders.
import { sketch } from "./sketch.js";

export default {
  id: "differential-growth",
  title: "Differential Growth",
  blurb:
    "A chain of nodes attracts its neighbours, repels everything nearby, and inserts new nodes as it stretches — buckling into coral- and brain-like folds.",
  tags: ["growth", "morphogenesis", "curve"],

  params: {
    maxNodes:   { value: 600, min: 100, max: 1200, step: 50,   label: "Max nodes" },
    repelRadius:{ value: 14,  min: 6,   max: 30,   step: 1,    label: "Repel radius" },
    repel:      { value: 0.7, min: 0,   max: 2,    step: 0.05, label: "Repulsion" },
    attract:    { value: 0.5, min: 0,   max: 2,    step: 0.05, label: "Attraction" },
    align:      { value: 0.25,min: 0,   max: 1,    step: 0.05, label: "Smoothing" },
    growth:     { value: 0.5, min: 0.05,max: 1,    step: 0.05, label: "Growth rate" },
  },

  sketch,
};
