// Coral — accretive coral growth on a 2D grid. Empty cells touching the colony
// calcify with a probability biased toward exposed tips (curvature) and toward
// the light above, so the structure propagates upward into branching forms.
import { sketch } from "./sketch.js";

export default {
  id: "coral",
  title: "Coral Growth",
  blurb:
    "A colony accretes cell by cell: exposed tips calcify faster than sheltered crevices, and growth reaches for the light — so it branches upward like a reef.",
  tags: ["growth", "accretion", "branching"],

  params: {
    growth: { value: 0.2, min: 0.02, max: 0.6, step: 0.02, label: "Growth" },
    branch: { value: 1.7, min: 0.5,  max: 3,   step: 0.1,  label: "Branchiness" },
    light:  { value: 1.3, min: 0,    max: 3,   step: 0.1,  label: "Light bias" },
    speed:  { value: 1,   min: 1,    max: 4,   step: 1,    label: "Steps/frame" },
  },

  sketch,
};
