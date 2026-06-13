// main.js — boots the app: build the grid, wire up the detail overlay.
import { algorithms } from "./registry.js";
import { buildGrid } from "./grid.js";
import { createDetail } from "./detail.js";

const appEl = document.getElementById("app");
const detail = createDetail(document.body);

buildGrid(appEl, algorithms, (algo) => detail.open(algo));
