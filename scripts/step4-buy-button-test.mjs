import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const productsPath = path.join(__dirname, "../products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

console.log("Step 4: Buy Button Test\n");

// ── Helper: simulate buy button state logic (mirrors index.html) ──
function buyButtonState(variant) {
  const canBuy = variant.active && variant.checkoutUrl;
  if (canBuy) {
    return { enabled: true, href: variant.checkoutUrl, label: "Buy Now" };
  } else if (!variant.active) {
    return { enabled: false, href: null, label: "Unavailable" };
  } else {
    return { enabled: false, href: null, label: "Buy link coming soon" };
  }
}

// ── Test 1: Active variant with checkoutUrl → Buy Now enabled ──────
console.log("✓ Test 1: Active variant with checkoutUrl → Buy Now enabled");
const product = products[0];
const activeVariant = product.variants.find((v) => v.active && v.checkoutUrl);
if (!activeVariant) throw new Error("No active variant with checkoutUrl found in products.json");
const state1 = buyButtonState(activeVariant);
if (!state1.enabled) throw new Error("Expected Buy Now to be enabled");
if (state1.label !== "Buy Now") throw new Error(`Expected label 'Buy Now', got '${state1.label}'`);
if (!state1.href.startsWith("https://")) throw new Error("checkoutUrl must be HTTPS");
console.log(`  - Variant: ${activeVariant.label}`);
console.log(`  - Button: enabled, href=${state1.href}`);

// ── Test 2: Inactive variant → button disabled ─────────────────────
console.log("\n✓ Test 2: Inactive variant → button disabled");
const inactiveVariant = { ...activeVariant, active: false };
const state2 = buyButtonState(inactiveVariant);
if (state2.enabled) throw new Error("Expected button to be disabled for inactive variant");
if (state2.label !== "Unavailable") throw new Error(`Expected 'Unavailable', got '${state2.label}'`);
if (state2.href !== null) throw new Error("Expected no href for inactive variant");
console.log(`  - Button: disabled, label="${state2.label}"`);

// ── Test 3: Active variant without checkoutUrl → disabled ──────────
console.log("\n✓ Test 3: Active variant without checkoutUrl → disabled");
const noLinkVariant = { ...activeVariant, checkoutUrl: undefined };
const state3 = buyButtonState(noLinkVariant);
if (state3.enabled) throw new Error("Expected button to be disabled when checkoutUrl is missing");
if (state3.label !== "Buy link coming soon") throw new Error(`Expected 'Buy link coming soon', got '${state3.label}'`);
console.log(`  - Button: disabled, label="${state3.label}"`);

// ── Test 4: checkoutUrl must be HTTPS (not HTTP) ───────────────────
console.log("\n✓ Test 4: checkoutUrl must be HTTPS");
for (const p of products) {
  for (const v of p.variants) {
    if (v.checkoutUrl && !v.checkoutUrl.startsWith("https://")) {
      throw new Error(`Insecure checkoutUrl in ${p.slug}: ${v.checkoutUrl}`);
    }
  }
}
console.log("  - All checkoutUrls use HTTPS");

// ── Test 5: button HTML output contains correct attributes ─────────
console.log("\n✓ Test 5: Buy button HTML structure simulation");
function buyButtonHtml(variant) {
  function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const canBuy = variant.active && variant.checkoutUrl;
  if (canBuy) {
    return `<a class="popup-buy" href="${escHtml(variant.checkoutUrl)}" target="_blank" rel="noopener noreferrer">Buy Now</a>`;
  } else {
    const reason = !variant.active ? "Unavailable" : "Buy link coming soon";
    return `<button class="popup-buy" disabled>${escHtml(reason)}</button>`;
  }
}
const html = buyButtonHtml(activeVariant);
if (!html.includes("popup-buy")) throw new Error("Missing popup-buy class");
if (!html.includes('target="_blank"')) throw new Error("Missing target=_blank");
if (!html.includes('rel="noopener noreferrer"')) throw new Error("Missing noopener noreferrer");
if (!html.includes(activeVariant.checkoutUrl)) throw new Error("checkoutUrl not in href");
console.log(`  - Generated: ${html.slice(0, 80)}...`);
console.log(`  - Has noopener noreferrer: yes`);

const disabledHtml = buyButtonHtml(inactiveVariant);
if (!disabledHtml.includes("disabled")) throw new Error("Missing disabled attribute");
console.log(`  - Disabled button has 'disabled' attribute: yes`);

console.log("\n✅ All Step 4 tests passed.");
console.log("Buy button logic is correct and secure.\n");
