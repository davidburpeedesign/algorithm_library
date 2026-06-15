// Differential Mesh — differential growth lifted to a 3D triangle mesh. The
// surface repels itself and springs hold its edges, while long edges keep
// subdividing — so the membrane gains area faster than it can stay smooth and
// buckles into convoluted, brain-coral-like folds.
import { sketch } from "./sketch.js";

export default {
  id: "differential-mesh",
  title: "Differential Mesh Growth",
  blurb:
    "A closed 3D membrane that grows by subdividing its longest edges while every vertex repels its neighbours. It runs out of room and folds in on itself.",
  tags: ["growth", "3d", "mesh"],

  params: {
    spin:       { value: 0.4, min: 0,    max: 2,  step: 0.05, label: "Spin" },
    growth:     { value: 0.5, min: 0.05, max: 1,  step: 0.05, label: "Growth rate" },
    repulsion:  { value: 0.9, min: 0,    max: 2,  step: 0.05, label: "Repulsion" },
    attraction: { value: 0.6, min: 0,    max: 2,  step: 0.05, label: "Attraction" },
    smoothing:  { value: 0.2, min: 0,    max: 1,  step: 0.05, label: "Smoothing" },
  },

  sketch,
};
