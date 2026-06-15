// registry.js — the single source of truth for which algorithms exist.
//
// To add an algorithm: create algorithms/<name>/{index.js,sketch.js}, then
// import its default export and add it to the array below.
import boids from "../algorithms/boids/index.js";
import reactionDiffusion from "../algorithms/reaction-diffusion/index.js";
import lSystem from "../algorithms/l-system/index.js";
import physarum from "../algorithms/physarum/index.js";
import antColony from "../algorithms/ant-colony/index.js";
import voronoi from "../algorithms/voronoi/index.js";
import dla from "../algorithms/dla/index.js";
import flowField from "../algorithms/flow-field/index.js";
import differentialGrowth from "../algorithms/differential-growth/index.js";
import chladni from "../algorithms/chladni/index.js";
import particleFluid from "../algorithms/particle-fluid/index.js";
import cyclicCa from "../algorithms/cyclic-ca/index.js";
import coral from "../algorithms/coral/index.js";
import delaunayCloud from "../algorithms/delaunay-cloud/index.js";
import differentialMesh from "../algorithms/differential-mesh/index.js";
import spaceColonization from "../algorithms/space-colonization/index.js";

/** @type {object[]} */
export const algorithms = [
  boids,
  flowField,
  physarum,
  antColony,
  particleFluid,
  reactionDiffusion,
  voronoi,
  differentialGrowth,
  chladni,
  cyclicCa,
  coral,
  spaceColonization,
  delaunayCloud,
  differentialMesh,
  dla,
  lSystem,
];
