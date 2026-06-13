// controls.js — turn an algorithm's params schema into a Tweakpane panel.
//
// A params schema is a plain object:
//   {
//     count: { value: 150, min: 10, max: 500, step: 1, label: "Boids" },
//     mode:  { value: "plant", options: { Plant: "plant", Koch: "koch" } },
//   }
// `value` is the default; the rest is passed through to Tweakpane bindings.
import { Pane } from "tweakpane";

/**
 * Build a fresh live params object from a schema's defaults.
 * @param {object} algo
 * @returns {Record<string, any>}
 */
export function defaultsFor(algo) {
  const out = {};
  for (const [key, spec] of Object.entries(algo.params ?? {})) {
    out[key] = spec.value;
  }
  return out;
}

/**
 * Render a Tweakpane panel bound to a live params object.
 *
 * @param {HTMLElement} container
 * @param {object} algo
 * @param {Record<string, any>} params - the SAME object the sketch reads.
 * @param {{ onChange?: (key:string, value:any)=>void, onRestart?: ()=>void }} [handlers]
 * @returns {Pane}
 */
export function buildControls(container, algo, params, handlers = {}) {
  const { onChange, onRestart } = handlers;
  const pane = new Pane({ container });

  for (const [key, spec] of Object.entries(algo.params ?? {})) {
    const opts = { label: spec.label ?? key };
    if (spec.options !== undefined) opts.options = spec.options;
    if (spec.min !== undefined) opts.min = spec.min;
    if (spec.max !== undefined) opts.max = spec.max;
    if (spec.step !== undefined) opts.step = spec.step;

    const binding = pane.addBinding(params, key, opts);
    binding.on("change", (ev) => onChange?.(key, ev.value));
  }

  if (onRestart) {
    pane.addBlade({ view: "separator" });
    pane.addButton({ title: "Restart" }).on("click", () => onRestart());
  }

  return pane;
}
