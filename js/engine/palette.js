// palette.js — the single shared colour scheme for every sketch.
//
// Keep this in sync with css/tokens.css so the canvases and the page chrome
// read as one design language.
//   bg     — page/canvas background
//   ink    — text, frames, outlines, supplementary graphics
//   accent — the algorithmic content itself
export const BG = [34, 34, 34];      // #222222
export const INK = [228, 227, 223];  // #E4E3DF
export const ACCENT = [228, 132, 132]; // #E48484

/**
 * Linear blend between two RGB arrays.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} t - 0 → a, 1 → b
 * @returns {[number, number, number]}
 */
export function lerpRGB(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
