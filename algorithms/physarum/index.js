// Physarum — slime-mould transport networks from sense-and-deposit agents.
import { sketch } from "./sketch.js";

export default {
  id: "physarum",
  title: "Physarum",
  blurb:
    "Thousands of agents deposit a trail, then steer toward the strongest scent ahead. The trail diffuses and decays — and transport networks emerge.",
  tags: ["slime-mould", "agents", "stigmergy"],

  params: {
    agents:     { value: 4000, min: 500, max: 12000, step: 100, label: "Agents" },
    sensorAngle:{ value: 30,   min: 5,   max: 90,    step: 1,   label: "Sensor angle" },
    sensorDist: { value: 9,    min: 3,   max: 24,    step: 1,   label: "Sensor dist" },
    turnSpeed:  { value: 28,   min: 4,   max: 80,    step: 1,   label: "Turn speed" },
    decay:      { value: 0.92, min: 0.80,max: 0.99,  step: 0.01,label: "Trail decay" },
  },

  sketch,
};
