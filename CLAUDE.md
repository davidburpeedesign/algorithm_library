# CLAUDE.md

Guidance for working in this repository. Read this before adding features or
algorithms.

## What this is

A **biomimetic algorithm pattern library**: a responsive grid of nature-inspired
algorithms for prototyping design visualizations, simulations, and data viz.
Each grid tile shows a live preview; clicking it opens an expanded view with an
interactive control panel. Hosted on **GitHub Pages**.

## Core principle: zero build

This is a **static, no-build site**. There is no bundler, transpiler, package
manager, or CI build step, and there must not be one. Source files run in the
browser exactly as written.

- Third-party modules resolve through the **import map** in `index.html`
  (bare specifiers `p5` and `tweakpane` → esm.sh CDN URLs).
- Do **not** introduce `node_modules`, a `package.json` build, or a framework.
- If a dependency must be pinned or self-hosted, change the import map URL — do
  not add a build step.

## Tech stack & dependencies

| Concern        | Choice |
| -------------- | ------ |
| Language       | Modern JavaScript, ES modules (browser-native) |
| Rendering      | [p5.js](https://p5js.org) `@1.9.4`, **instance mode only** |
| Controls       | [Tweakpane](https://tweakpane.github.io) `@4.0.5` (`addBinding` API) |
| Layout/theme   | CSS Grid + custom properties |
| Fonts          | Intel One Mono (Google Fonts) |
| Hosting        | GitHub Pages, served as-is via `.nojekyll` |

## Project structure

```
index.html              import map, app shell, #app mount, font + CSS links
css/tokens.css          design tokens (palette, spacing, type) — mirrors palette.js
css/app.css             grid layout, card + detail styles, Tweakpane theme
js/
  main.js               boots the app; hash router (deep linking)
  registry.js           imports + lists every algorithm (single source of truth)
  grid.js               builds cards; IntersectionObserver lazy previews
  detail.js             expanded overlay; route-driven, idempotent
  engine/
    lifecycle.js        mountSketch (mount/pause/resume/restart/dispose), sizeOf
    controls.js         params schema -> Tweakpane panel; defaultsFor
    palette.js          shared colour scheme (BG/INK/ACCENT + lerpRGB)
algorithms/<id>/
  index.js              default-exports the Algorithm object
  sketch.js             exports sketch(p, ctx) — the p5 instance-mode sketch
assets/                 optional poster thumbnails
.nojekyll               serve files untouched on Pages
```

## Key features

- **Grid + live previews** — each card mounts a reduced sketch lazily via
  `IntersectionObserver`; offscreen previews pause to keep rAF loops down.
- **Detail view** — full sketch plus a Tweakpane panel generated from the
  algorithm's params schema.
- **Deep linking** — the URL hash is the single source of truth for the open
  algorithm (e.g. `#physarum`). Cards/close button only mutate the hash; one
  `hashchange` handler in `main.js` reflects it into the overlay. Reloads,
  shared links, and back/forward all work.

## The Algorithm contract

`algorithms/<id>/index.js` default-exports:

```js
import { sketch } from "./sketch.js";
export default {
  id: "my-algo",            // must match the directory name; used in the URL hash
  title: "My Algorithm",
  blurb: "One-line description shown on the card and detail header.",
  tags: ["category", "..."],
  // restartOnChange: true, // ONLY for static sketches that must redraw on edit
  params: {
    speed: { value: 1, min: 0, max: 4, step: 0.1, label: "Speed" },
    mode:  { value: "a", options: { A: "a", B: "b" }, label: "Mode" },
    on:    { value: true, label: "Toggle" },
  },
  sketch,
};
```

- The **params schema** maps directly onto Tweakpane bindings: `value` is the
  default; `min`/`max`/`step`/`options`/`label` pass straight through.
- `sketch(p, ctx)` is **p5 instance mode**, where
  `ctx = { params, preview, container }`.

## Conventions for sketches

1. **Read params live.** Read from `ctx.params` every frame so Tweakpane edits
   apply without recreating the sketch. Only set `restartOnChange: true` for
   genuinely static output (e.g. L-System turtle graphics).
2. **Scale for previews.** Use `ctx.preview` to run lighter work in the grid
   (fewer agents/particles, smaller grids).
3. **Size from the container.** Call `sizeOf(ctx.container)` in `setup()` (p5's
   `p.canvas` does not exist yet there) and again in `windowResized()`.
4. **Colours come from the palette only.** Import `BG`, `INK`, `ACCENT`,
   `lerpRGB` from `js/engine/palette.js`. Never hardcode hex/HSB in a sketch.
   - `ACCENT` = the algorithmic content; density/intensity ramps go
     `BG → ACCENT` (via `lerpRGB`).
   - `INK` = supplementary structure (frames, outlines, seeds, borders, nests,
     food markers, idle agents).
5. **Heavy grid-field sims** (reaction-diffusion, physarum, ant-colony, voronoi,
   dla): create the canvas at a **fixed low internal resolution**, set
   `p.pixelDensity(1)`, `p.noSmooth()`, and
   `p.canvas.style.imageRendering = "pixelated"`, then write to `p.pixels`. CSS
   stretches the small canvas to fill the card/stage.
6. **Neighbour-heavy agent sims** (boids, differential-growth, particle-fluid):
   use a uniform **spatial hash** (cell ≈ interaction radius) and cap per-step
   speed so the system stays stable across the parameter range.
7. **Interaction.** `p.mousePressed` typically re-seeds (guarded by
   `if (!preview)`); the detail panel always has a **Restart** button.

## Style guidelines

- **Indent** 2 spaces; **double quotes**; **semicolons**; trailing commas in
  multiline literals.
- **Naming** camelCase for identifiers; algorithm `id` and directory name are
  kebab-case and must match.
- **Comments explain _why_**, not _what_. Keep a file's top-of-module comment
  describing the algorithm and any performance trick. Match the comment density
  and idiom of the surrounding files.
- **JSDoc** the shared engine helpers (`lifecycle.js`, `controls.js`,
  `palette.js`) and any non-obvious params.
- Prefer small, dependency-free helpers over new libraries. No frameworks.
- Keep the page chrome palette in `css/tokens.css` in sync with
  `js/engine/palette.js` (and the Tweakpane theme block in `css/app.css`).

## Adding an algorithm (checklist)

1. Create `algorithms/<id>/index.js` and `algorithms/<id>/sketch.js`.
2. Follow the conventions above (live params, preview scaling, palette).
3. Import the default export in `js/registry.js` and add it to the
   `algorithms` array (array order = grid order).
4. Update the algorithm list in `README.md`.

## Local dev & deploy

- Serve over HTTP (ES modules don't load from `file://`):
  `python3 -m http.server 8000` → http://localhost:8000
- Deploy: GitHub Pages, "Deploy from a branch", root folder; `.nojekyll`
  keeps `js/` and `algorithms/` untouched.
- **Validation:** `node --check <file>` catches syntax errors. Full visual
  behaviour can only be confirmed in a browser, since p5/Tweakpane load from
  the CDN at runtime.

## Git / workflow preferences

- Commit messages: concise imperative subject, then a body explaining the
  change. Keep unrelated changes in separate commits.
- Push incrementally; open a PR per logical change and let the maintainer
  review and merge. Do not create a PR unless asked.
