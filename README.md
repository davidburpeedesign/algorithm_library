# Biomimetic Algorithm Library

A grid of nature-inspired algorithms for prototyping design visualizations,
simulations, and data viz. Each tile shows a live preview; clicking it expands
the view with interactive controls.

**Live site:** enable GitHub Pages for this repo (see [Deploying](#deploying)).

---

## Tech stack

The goal is a **zero-build, static** site that drops straight onto GitHub Pages
— no bundler, no CI step, no `node_modules` to ship.

| Concern            | Choice                          | Why |
| ------------------ | ------------------------------- | --- |
| Language           | Modern JavaScript (ES modules)  | Runs natively in the browser; no transpile step. |
| Module resolution  | [Import maps](index.html)       | Bare specifiers (`p5`, `tweakpane`) resolve to a CDN, so there's no bundler. |
| Sketching / render | [p5.js](https://p5js.org) (instance mode) | Fast canvas drawing; instance mode lets many sketches coexist. |
| Controls           | [Tweakpane](https://tweakpane.github.io) | Generates a tidy control panel from a params schema. |
| Layout             | CSS Grid + custom properties    | Responsive card grid; themeable via `css/tokens.css`. |
| Hosting            | GitHub Pages (`.nojekyll`)      | Free static hosting; files served as-is. |

Dependencies load from [esm.sh](https://esm.sh) at runtime, so the only thing
in this repo is source. To pin or self-host them later, swap the URLs in the
import map in `index.html`.

## Project layout

```
/
├── index.html              # import map, app shell, grid mount point
├── css/
│   ├── tokens.css          # design tokens (dark palette, spacing, type)
│   └── app.css             # grid layout + card/detail styles
├── js/
│   ├── main.js             # boots the app
│   ├── registry.js         # lists every algorithm
│   ├── grid.js             # builds the grid, lazy previews (IntersectionObserver)
│   ├── detail.js           # expanded view: full sketch + Tweakpane panel
│   └── engine/
│       ├── lifecycle.js    # mount/dispose + start/stop for p5 sketches
│       └── controls.js     # params schema -> Tweakpane panel
├── algorithms/
│   ├── boids/              # flocking
│   ├── flow-field/         # Perlin-noise flow field
│   ├── physarum/           # slime-mould transport networks
│   ├── ant-colony/         # stigmergic foraging
│   ├── reaction-diffusion/ # Gray-Scott
│   ├── voronoi/            # Lloyd-relaxed tessellation
│   ├── dla/                # diffusion-limited aggregation
│   └── l-system/           # Lindenmayer turtle graphics
├── assets/                 # optional poster thumbnails
└── .nojekyll               # serve files as-is on Pages
```

## Running locally

Because it uses ES modules, open it through a static server (not `file://`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Any static server works (`npx serve`, VS Code Live Server, etc.).

## Adding an algorithm

1. Create `algorithms/<name>/index.js` and `algorithms/<name>/sketch.js`.
2. `sketch.js` exports `sketch(p, ctx)` written in **p5 instance mode**, where
   `ctx = { params, preview, container }`. Read from `ctx.params` each frame so
   control edits apply live. Use `ctx.preview` to run a lighter version in the
   grid.
3. `index.js` default-exports an **Algorithm object**:

   ```js
   import { sketch } from "./sketch.js";
   export default {
     id: "my-algo",
     title: "My Algorithm",
     blurb: "One-line description.",
     tags: ["category"],
     // restartOnChange: true,   // for static sketches that redraw on edit
     params: {
       speed: { value: 1, min: 0, max: 4, step: 0.1, label: "Speed" },
       mode:  { value: "a", options: { A: "a", B: "b" }, label: "Mode" },
     },
     sketch,
   };
   ```

4. Import it in `js/registry.js` and add it to the `algorithms` array.

The params schema fields map directly onto Tweakpane bindings (`min`, `max`,
`step`, `options`, `label`); `value` is the default.

## Deploying

1. Push to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Pick the branch and `/ (root)` folder, save.
4. The `.nojekyll` file ensures Pages serves the `js/` and `algorithms/`
   directories untouched.

## Roadmap

- More algorithms: cellular automata (Lenia / Game of Life), Perlin terrain,
  differential growth, particle-based fluids.
- Optional poster thumbnails in `assets/` for instant grid paint before a
  preview mounts.
- Deep-linking (`#<algorithm-id>`) to open a specific algorithm.
- A "copy params" button to export a tuned configuration.
