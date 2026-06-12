import fs from "node:fs";
import path from "node:path";
import { createProductIndex, findProductForHotspot } from "./commerce-mapping.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const hotspots = readJson("hotspots.json");
const products = readJson("products.json");
const index = createProductIndex(products);

const first = hotspots[0];
const firstMatch = findProductForHotspot(first, index);
assert(firstMatch, "Expected first hotspot to resolve to a product.");
assert(firstMatch.product.slug === "mountain-ash-print", "Expected first hotspot to map to mountain-ash-print.");

const unknown = { tooltip: "No Such Item", subject: "Definitely Missing" };
const unknownMatch = findProductForHotspot(unknown, index);
assert(unknownMatch === null, "Expected unknown hotspot to produce no mapping result.");

const explicit = { slug: "mountain-ash-print" };
const explicitMatch = findProductForHotspot(explicit, index);
assert(explicitMatch && explicitMatch.matchedBy === "exact", "Expected explicit slug to match exactly.");

console.log("Step 2 mapping test passed.");
