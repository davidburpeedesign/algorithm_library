// lifecycle.js — shared mount/dispose + start/stop helpers for p5 sketches.
//
// Every algorithm exposes a `sketch(p, ctx)` function written in p5 instance
// mode. This module is the single place that knows how to instantiate, pause,
// resume, restart, and tear one down — so the grid and detail views don't have
// to repeat that bookkeeping.
import p5 from "p5";

/**
 * Mount an algorithm's sketch into a container element.
 *
 * @param {HTMLElement} container - element the canvas is appended to.
 * @param {object} algo - an Algorithm object (see algorithms/ * /index.js).
 * @param {object} params - live params object; sketches read from it directly,
 *   so Tweakpane edits take effect without recreating the sketch.
 * @param {{ preview?: boolean }} [opts]
 * @returns {{ pause(): void, resume(): void, restart(): void, dispose(): void }}
 */
export function mountSketch(container, algo, params, opts = {}) {
  const preview = opts.preview ?? false;
  let instance = null;

  // `container` is handed to the sketch via ctx so it can measure its parent in
  // setup() — at that point p.canvas does not exist yet.
  const ctx = { params, preview, container };
  const create = () => {
    instance = new p5((p) => algo.sketch(p, ctx), container);
  };

  create();

  return {
    pause() {
      try { instance?.noLoop(); } catch { /* sketch already gone */ }
    },
    resume() {
      try { instance?.loop(); } catch { /* sketch already gone */ }
    },
    restart() {
      instance?.remove();
      create();
    },
    dispose() {
      instance?.remove();
      instance = null;
    },
  };
}

/**
 * Current pixel size of an element, with a sensible fallback for the brief
 * window before layout settles.
 * @param {HTMLElement} el
 * @returns {{ w: number, h: number }}
 */
export function sizeOf(el, fallback = { w: 320, h: 240 }) {
  return {
    w: el?.clientWidth || fallback.w,
    h: el?.clientHeight || fallback.h,
  };
}
