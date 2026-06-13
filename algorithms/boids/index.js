// Boids — Craig Reynolds' flocking model (separation, alignment, cohesion).
import { sketch } from "./sketch.js";

export default {
  id: "boids",
  title: "Boids",
  blurb:
    "Emergent flocking from three local rules — separation, alignment, and cohesion. No leader, no global plan.",
  tags: ["flocking", "swarm", "agents"],

  params: {
    count:        { value: 160, min: 20,  max: 400, step: 1,    label: "Count" },
    perception:   { value: 48,  min: 16,  max: 120, step: 1,    label: "Perception" },
    separation:   { value: 1.6, min: 0,   max: 3,   step: 0.05, label: "Separation" },
    alignment:    { value: 1.0, min: 0,   max: 3,   step: 0.05, label: "Alignment" },
    cohesion:     { value: 0.9, min: 0,   max: 3,   step: 0.05, label: "Cohesion" },
    maxSpeed:     { value: 3.2, min: 1,   max: 6,   step: 0.1,  label: "Max speed" },
    trail:        { value: 0.18, min: 0,  max: 0.6, step: 0.01, label: "Trail" },
  },

  sketch,
};
