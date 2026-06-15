// Space Colonization — the Runions et al. branching algorithm. A cloud of
// attractors "pulls" a growing tree toward unfilled space; branches fork to
// reach competing targets and stop where they have consumed them, the same way
// leaf veins, tree canopies, and river networks find paths through a domain.
import { sketch } from "./sketch.js";

export default {
  id: "space-colonization",
  title: "Space Colonization",
  blurb:
    "A tree grows toward a cloud of attractors, branching to chase competing targets and pruning each one as it arrives — the path-finding rule behind leaf veins and canopies.",
  tags: ["branching", "venation", "pathfinding"],

  params: {
    attractors: { value: 650, min: 100, max: 1500, step: 50, label: "Attractors" },
    influence:  { value: 80,  min: 30,  max: 200,  step: 5,  label: "Influence" },
    kill:       { value: 16,  min: 6,   max: 40,   step: 1,  label: "Kill radius" },
    step:       { value: 6,   min: 2,   max: 14,   step: 1,  label: "Step" },
    speed:      { value: 3,   min: 1,   max: 8,    step: 1,  label: "Iters/frame" },
  },

  sketch,
};
