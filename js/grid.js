// grid.js — builds the card grid and lazily mounts/pauses live previews.
//
// Previews are real (small) instances of each sketch. To keep dozens of rAF
// loops from running at once, an IntersectionObserver mounts a preview the
// first time its card scrolls into view and pauses it whenever it leaves.
import { mountSketch } from "./engine/lifecycle.js";
import { defaultsFor } from "./engine/controls.js";

/**
 * @param {HTMLElement} root - element to render the grid into (#app).
 * @param {object[]} algorithms
 * @param {(algo: object) => void} onOpen - called when a card is activated.
 */
export function buildGrid(root, algorithms, onOpen) {
  const grid = document.createElement("div");
  grid.className = "grid";

  // Map each card element -> a controller that can mount/pause its preview.
  const controllers = new WeakMap();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const ctl = controllers.get(entry.target);
        if (!ctl) continue;
        if (entry.isIntersecting) ctl.ensure();
        else ctl.pause();
      }
    },
    { rootMargin: "120px" }
  );

  for (const algo of algorithms) {
    const card = renderCard(algo);
    const previewEl = card.querySelector(".card__preview");

    // Previews get their own params copy so they never share state with the
    // detail view's controls.
    const previewParams = defaultsFor(algo);
    let handle = null;

    controllers.set(card, {
      ensure() {
        if (!handle) {
          handle = mountSketch(previewEl, algo, previewParams, { preview: true });
        } else {
          handle.resume();
        }
      },
      pause() {
        handle?.pause();
      },
    });

    const open = () => onOpen(algo);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    io.observe(card);
    grid.appendChild(card);
  }

  root.appendChild(grid);
  root.setAttribute("aria-busy", "false");
}

function renderCard(algo) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${algo.title}`);

  const tags = (algo.tags ?? [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  card.innerHTML = `
    <div class="card__preview"></div>
    <div class="card__body">
      <h2 class="card__title">${escapeHtml(algo.title)}</h2>
      <p class="card__blurb">${escapeHtml(algo.blurb ?? "")}</p>
      <div class="tags">${tags}</div>
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
