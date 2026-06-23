// Step 5: Validation / Fallback Test
// Mirrors the validateProductCatalog() function in index.html.
// Verifies that malformed records are filtered without throwing.

console.log("Step 5: Validation / Fallback Test\n");

// ── Mirror of validateProductCatalog from index.html ─────────────
function validateProductCatalog(catalog) {
  if (!Array.isArray(catalog)) return [];
  const valid = [];
  for (const product of catalog) {
    if (!product || typeof product !== "object") continue;
    if (!product.slug || typeof product.slug !== "string" || !product.slug.trim()) continue;
    if (!Array.isArray(product.variants) || product.variants.length === 0) continue;
    const validVariants = product.variants.filter((v) => {
      if (!v || typeof v !== "object") return false;
      if (!v.sku || typeof v.sku !== "string" || !v.sku.trim()) return false;
      if (typeof v.priceMinor !== "number" || v.priceMinor < 0) return false;
      if (v.checkoutUrl && !v.checkoutUrl.startsWith("https://")) return false;
      return true;
    });
    if (validVariants.length === 0) continue;
    valid.push({ ...product, variants: validVariants });
  }
  return valid;
}

// ── Test 1: null / undefined / non-array input ────────────────────
console.log("✓ Test 1: Non-array input returns empty array");
if (validateProductCatalog(null).length !== 0) throw new Error("Expected [] for null");
if (validateProductCatalog(undefined).length !== 0) throw new Error("Expected [] for undefined");
if (validateProductCatalog("string").length !== 0) throw new Error("Expected [] for string");
if (validateProductCatalog(42).length !== 0) throw new Error("Expected [] for number");
console.log("  - null, undefined, string, number → []");

// ── Test 2: Empty array passes through ───────────────────────────
console.log("\n✓ Test 2: Empty array passes through");
const empty = validateProductCatalog([]);
if (empty.length !== 0) throw new Error("Expected []");
console.log("  - [] → []");

// ── Test 3: Valid product passes through intact ───────────────────
console.log("\n✓ Test 3: Valid product passes through intact");
const validProduct = {
  slug: "mountain-ash-print",
  title: "Mountain Ash",
  forSale: true,
  variants: [
    { sku: "MASH-8X10", label: "8×10", priceMinor: 25000, active: true, checkoutUrl: "https://square.link/u/abc123" },
  ],
};
const result3 = validateProductCatalog([validProduct]);
if (result3.length !== 1) throw new Error("Expected 1 product");
if (result3[0].variants.length !== 1) throw new Error("Expected 1 variant");
console.log("  - Valid product → retained");

// ── Test 4: Product missing slug is dropped ───────────────────────
console.log("\n✓ Test 4: Product missing slug is dropped");
const noSlug = { title: "No Slug", variants: [{ sku: "X1", priceMinor: 100 }] };
const result4 = validateProductCatalog([noSlug]);
if (result4.length !== 0) throw new Error("Expected empty — no slug");
console.log("  - Missing slug → dropped");

// ── Test 5: Product with no variants is dropped ───────────────────
console.log("\n✓ Test 5: Product with no variants is dropped");
const noVariants = { slug: "no-variants", variants: [] };
const result5 = validateProductCatalog([noVariants]);
if (result5.length !== 0) throw new Error("Expected empty — no variants");
console.log("  - Empty variants array → dropped");

// ── Test 6: Variant missing sku is filtered out ───────────────────
console.log("\n✓ Test 6: Variant missing sku is filtered out");
const noSku = {
  slug: "test-item",
  variants: [
    { label: "No SKU", priceMinor: 100 },
    { sku: "GOOD-SKU", priceMinor: 200 },
  ],
};
const result6 = validateProductCatalog([noSku]);
if (result6.length !== 1) throw new Error("Expected product retained");
if (result6[0].variants.length !== 1) throw new Error("Expected 1 valid variant");
if (result6[0].variants[0].sku !== "GOOD-SKU") throw new Error("Wrong variant kept");
console.log("  - Bad variant filtered, good variant kept");

// ── Test 7: Variant with negative priceMinor is dropped ───────────
console.log("\n✓ Test 7: Variant with negative priceMinor is dropped");
const badPrice = {
  slug: "bad-price",
  variants: [{ sku: "BP-1", priceMinor: -50 }],
};
const result7 = validateProductCatalog([badPrice]);
if (result7.length !== 0) throw new Error("Expected product dropped — all variants invalid");
console.log("  - Negative priceMinor → variant and parent product dropped");

// ── Test 8: Variant with HTTP (not HTTPS) checkoutUrl is dropped ──
console.log("\n✓ Test 8: Insecure checkoutUrl is dropped");
const insecureUrl = {
  slug: "insecure",
  variants: [{ sku: "INS-1", priceMinor: 1000, checkoutUrl: "http://example.com/buy" }],
};
const result8 = validateProductCatalog([insecureUrl]);
if (result8.length !== 0) throw new Error("Expected product dropped — insecure URL");
console.log("  - http:// checkoutUrl → dropped");

// ── Test 9: Mixed catalog — valid and invalid products ────────────
console.log("\n✓ Test 9: Mixed catalog filters correctly");
const mixed = [
  validProduct,
  noSlug,
  noVariants,
  {
    slug: "partial",
    variants: [
      { sku: "P-BAD", priceMinor: -1 },
      { sku: "P-GOOD", priceMinor: 5000 },
    ],
  },
];
const result9 = validateProductCatalog(mixed);
if (result9.length !== 2) throw new Error(`Expected 2 valid products, got ${result9.length}`);
const partial = result9.find((p) => p.slug === "partial");
if (!partial || partial.variants.length !== 1) throw new Error("Expected partial product with 1 valid variant");
console.log(`  - 4 products in → ${result9.length} valid out`);
console.log(`  - 'partial' retained with 1 valid variant`);

// ── Test 10: Real products.json passes validation ─────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(__dirname, "../products.json"), "utf-8"));

console.log("\n✓ Test 10: Real products.json passes validation");
const result10 = validateProductCatalog(products);
if (result10.length !== products.length) {
  throw new Error(`Expected all ${products.length} products to pass, got ${result10.length}`);
}
console.log(`  - All ${products.length} product(s) in products.json are valid`);

console.log("\n✅ All Step 5 tests passed.");
console.log("Validation / fallback behavior is correct and non-crashing.\n");
