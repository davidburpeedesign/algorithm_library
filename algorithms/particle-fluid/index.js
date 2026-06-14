// Particle Fluid — a 2D particle liquid: near-range repulsion keeps it from
// compressing, mid-range cohesion gives it surface tension, gravity pulls it
// down, and it sloshes around its container.
import { sketch } from "./sketch.js";

export default {
  id: "particle-fluid",
  title: "Particle Fluid",
  blurb:
    "Particles repel when crowded and pull together at arm's length — incompressibility plus surface tension. The result pools, sloshes, and splashes like a liquid. Drag to stir.",
  tags: ["fluid", "physics", "particles"],

  params: {
    particles: { value: 600, min: 150, max: 1200, step: 50,   label: "Particles" },
    gravity:   { value: 0.15,min: 0,   max: 0.5,  step: 0.01, label: "Gravity" },
    cohesion:  { value: 0.5, min: 0,   max: 1.5,  step: 0.05, label: "Cohesion" },
    viscosity: { value: 0.04,min: 0,   max: 0.2,  step: 0.01, label: "Viscosity" },
    bounce:    { value: 0.35,min: 0,   max: 0.9,  step: 0.05, label: "Bounce" },
  },

  sketch,
};
