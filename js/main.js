// main.js — boots the app and routes the open algorithm via the URL hash.
//
// Deep linking: the location hash (e.g. #physarum) is the single source of
// truth for which detail view is open. Cards and the close button only change
// the hash; a single hashchange handler reflects that into the overlay, so
// reloads, shared links, and the browser back/forward button all just work.
import { algorithms } from "./registry.js";
import { buildGrid } from "./grid.js";
import { createDetail } from "./detail.js";

const appEl = document.getElementById("app");
const byId = new Map(algorithms.map((a) => [a.id, a]));

const detail = createDetail(document.body, {
  // Closing the overlay clears the hash, which routes back to the grid.
  onDismiss: () => setHash(""),
});

function currentId() {
  return decodeURIComponent(location.hash.replace(/^#/, ""));
}

function setHash(id) {
  if (id) {
    location.hash = encodeURIComponent(id);
  } else if (location.hash) {
    // Drop the hash without piling up history entries.
    history.replaceState(null, "", location.pathname + location.search);
    syncFromHash();
  }
}

function syncFromHash() {
  const algo = byId.get(currentId());
  if (algo) detail.open(algo);
  else detail.close();
}

// Card clicks just navigate; the hashchange handler does the opening.
buildGrid(appEl, algorithms, (algo) => setHash(algo.id));

window.addEventListener("hashchange", syncFromHash);
syncFromHash(); // honour a deep link present on first load
