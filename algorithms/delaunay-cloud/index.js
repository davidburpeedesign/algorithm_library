// Delaunay Cloud — a drifting 3D particle cloud, retriangulated every frame.
// Points wander inside a rotating cube; their projected positions are Delaunay-
// triangulated (Bowyer-Watson) and the long-in-3D edges are culled, so only
// genuine spatial neighbours connect into a shimmering mesh.
import { sketch } from "./sketch.js";

export default {
  id: "delaunay-cloud",
  title: "Delaunay Cloud",
  blurb:
    "A 3D swarm of points, retriangulated every frame. Nearby particles knit into a Delaunay mesh that flexes and reconnects as the cloud drifts and turns.",
  tags: ["3d", "delaunay", "particles"],

  params: {
    points:   { value: 130, min: 30,  max: 260, step: 10,   label: "Points" },
    spin:     { value: 0.4, min: 0,   max: 2,   step: 0.05, label: "Spin" },
    drift:    { value: 0.5, min: 0,   max: 2,   step: 0.05, label: "Drift" },
    linkDist: { value: 0.5, min: 0.2, max: 1,   step: 0.05, label: "Link range" },
    showPoints: { value: true, label: "Show points" },
  },

  sketch,
};
