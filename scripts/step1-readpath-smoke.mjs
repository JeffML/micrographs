import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readJsonArray(relativePath) {
  const filePath = path.join(root, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${relativePath} must be a JSON array.`);
  }
  return parsed;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const gallery = readJsonArray("gallery-items.json");
const products = readJsonArray("products.json");

assert(gallery.length > 0, "gallery-items.json must contain at least one item.");
assert(products.length > 0, "products.json must contain at least one product.");

for (const item of gallery) {
  assert(typeof item.slug === "string" && item.slug.trim(), "Each gallery item requires a non-empty slug.");
  assert(typeof item.title === "string" && item.title.trim(), "Each gallery item requires a non-empty title.");
}

for (const product of products) {
  assert(typeof product.slug === "string" && product.slug.trim(), "Each product requires a non-empty slug.");
  assert(Array.isArray(product.variants), "Each product requires a variants array.");
  for (const variant of product.variants) {
    assert(typeof variant.sku === "string" && variant.sku.trim(), "Each variant requires a non-empty sku.");
    assert(
      typeof variant.checkoutUrl === "string" && variant.checkoutUrl.startsWith("https://"),
      "Each variant requires an https checkoutUrl.",
    );
  }
}

console.log("Step 1 read-path smoke test passed.");
