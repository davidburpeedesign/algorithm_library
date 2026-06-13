// Voronoi Growth — cells relax toward their centroids (Lloyd's algorithm).
import { sketch } from "./sketch.js";

export default {
  id: "voronoi",
  title: "Voronoi Growth",
  blurb:
    "Seed points claim their nearest territory, then drift toward each cell's centre of mass. The mosaic settles into the even packing seen in foam and cells.",
  tags: ["voronoi", "lloyd", "tessellation"],

  params: {
    seeds:   { value: 28,  min: 6,   max: 70,  step: 1,    label: "Cells" },
    relax:   { value: 0.06,min: 0,   max: 0.3, step: 0.01, label: "Relax speed" },
    jitter:  { value: 0.15,min: 0,   max: 1,   step: 0.05, label: "Jitter" },
    borders: { value: true, label: "Borders" },
  },

  sketch,
};
