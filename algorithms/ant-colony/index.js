// Ant Colony — stigmergic foraging with home + food pheromone trails.
import { sketch } from "./sketch.js";

export default {
  id: "ant-colony",
  title: "Ant Colony",
  blurb:
    "Ants wander from the nest, drop pheromone, and follow each other's trails. With no central plan, the colony converges on short paths to food.",
  tags: ["stigmergy", "foraging", "swarm"],

  params: {
    ants:        { value: 280, min: 50,  max: 600,  step: 10,   label: "Ants" },
    evaporation: { value: 0.985, min: 0.95, max: 0.999, step: 0.001, label: "Evaporation" },
    sensorAngle: { value: 35,  min: 10,  max: 80,   step: 1,    label: "Sensor angle" },
    sensorDist:  { value: 7,   min: 3,   max: 16,   step: 1,    label: "Sensor dist" },
    wander:      { value: 0.25,min: 0,   max: 1,    step: 0.05, label: "Wander" },
  },

  sketch,
};
