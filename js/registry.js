// registry.js — the single source of truth for which algorithms exist.
//
// To add an algorithm: create algorithms/<name>/{index.js,sketch.js}, then
// import its default export and add it to the array below.
import boids from "../algorithms/boids/index.js";
import reactionDiffusion from "../algorithms/reaction-diffusion/index.js";
import lSystem from "../algorithms/l-system/index.js";

/** @type {object[]} */
export const algorithms = [
  boids,
  reactionDiffusion,
  lSystem,
];
