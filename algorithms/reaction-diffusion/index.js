// Reaction–Diffusion — the Gray-Scott model of two reacting chemicals.
import { sketch } from "./sketch.js";

export default {
  id: "reaction-diffusion",
  title: "Reaction–Diffusion",
  blurb:
    "Two virtual chemicals feed, react, and diffuse — spontaneously forming the spots and stripes seen on shells and animal coats.",
  tags: ["gray-scott", "morphogenesis", "pattern"],

  params: {
    // Feed/kill are the knobs that select the pattern family (spots, mazes…).
    feed:  { value: 0.036, min: 0.01,  max: 0.09,  step: 0.001, label: "Feed" },
    kill:  { value: 0.062, min: 0.045, max: 0.07,  step: 0.001, label: "Kill" },
    dA:    { value: 1.0,   min: 0.6,   max: 1.2,   step: 0.01,  label: "Diffuse A" },
    dB:    { value: 0.5,   min: 0.3,   max: 0.7,   step: 0.01,  label: "Diffuse B" },
    speed: { value: 8,     min: 1,     max: 16,    step: 1,     label: "Steps/frame" },
  },

  sketch,
};
