// detail.js — the expanded view: a full-size sketch plus its Tweakpane panel.
//
// One overlay element is created up front and reused; opening a new algorithm
// disposes the previous sketch/pane first so we never leak rAF loops.
import { mountSketch } from "./engine/lifecycle.js";
import { buildControls, defaultsFor } from "./engine/controls.js";

export function createDetail(mountTarget = document.body) {
  const overlay = document.createElement("div");
  overlay.className = "detail";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <div class="detail__dialog">
      <div class="detail__header">
        <div class="detail__heading">
          <h2 class="detail__title"></h2>
          <p class="detail__blurb"></p>
        </div>
        <button class="detail__close" aria-label="Close">&times;</button>
      </div>
      <div class="detail__stage"></div>
      <div class="detail__panel"></div>
    </div>
  `;
  mountTarget.appendChild(overlay);

  const titleEl = overlay.querySelector(".detail__title");
  const blurbEl = overlay.querySelector(".detail__blurb");
  const stageEl = overlay.querySelector(".detail__stage");
  const panelEl = overlay.querySelector(".detail__panel");
  const closeBtn = overlay.querySelector(".detail__close");

  /** @type {{ handle: any, pane: any } | null} */
  let current = null;

  function close() {
    if (current) {
      current.pane?.dispose();
      current.handle?.dispose();
      current = null;
    }
    panelEl.innerHTML = "";
    overlay.dataset.open = "false";
    document.body.style.overflow = "";
  }

  function open(algo) {
    close();
    overlay.dataset.open = "true";
    document.body.style.overflow = "hidden";

    titleEl.textContent = algo.title;
    blurbEl.textContent = algo.blurb ?? "";
    titleEl.setAttribute("aria-label", algo.title);

    // Fresh params each open; the sketch reads this object live.
    const params = defaultsFor(algo);
    const handle = mountSketch(stageEl, algo, params, { preview: false });

    const pane = buildControls(panelEl, algo, params, {
      onChange: () => {
        // Some sketches (static turtle graphics) must be redrawn from scratch;
        // animated ones read params live and need nothing here.
        if (algo.restartOnChange) handle.restart();
      },
      onRestart: () => handle.restart(),
    });

    current = { handle, pane };
  }

  // Dismiss on backdrop click, close button, or Escape.
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.dataset.open === "true") close();
  });

  return { open, close };
}
