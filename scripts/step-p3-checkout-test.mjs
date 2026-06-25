/**
 * P3 Step 2: Checkout function live sandbox test
 *
 * Calls the Square sandbox API directly (mirrors checkout.mjs logic)
 * to verify credentials, location ID, and API shape are correct.
 *
 * Requires SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in .env
 * Run: node scripts/step-p3-checkout-test.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.sandbox if present, otherwise .env ─────────────────
// Use .env.sandbox for sandbox credentials so tests never hit production.
const sandboxEnvPath = path.join(__dirname, "../.env.sandbox");
const defaultEnvPath = path.join(__dirname, "../.env");
const envPath = fs.existsSync(sandboxEnvPath) ? sandboxEnvPath : defaultEnvPath;
if (fs.existsSync(envPath)) {
  console.log(`Loading credentials from ${path.basename(envPath)}`);
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

// ── Safety guard: refuse to run against production ────────────────
if ((process.env.SQUARE_ENVIRONMENT ?? "sandbox") === "production") {
  console.error("ERROR: SQUARE_ENVIRONMENT=production. This test must not run against production.");
  console.error("Create a .env.sandbox file with sandbox credentials to run this test.");
  process.exit(1);
}

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const environment = process.env.SQUARE_ENVIRONMENT ?? "sandbox";

console.log("P3 Step 2: Checkout Function Sandbox Test\n");

// ── Test 1: Env vars present ───────────────────────────────────────
console.log("✓ Test 1: Env vars present");
if (!accessToken) throw new Error("SQUARE_ACCESS_TOKEN not set");
if (!locationId) throw new Error("SQUARE_LOCATION_ID not set");
console.log(`  - SQUARE_ACCESS_TOKEN: set (${accessToken.slice(0, 8)}...)`);
console.log(`  - SQUARE_LOCATION_ID: ${locationId}`);
console.log(`  - SQUARE_ENVIRONMENT: ${environment}`);

// ── Test 2: Square API reachable and credentials valid ─────────────
console.log("\n✓ Test 2: Call Square Create Payment Link (sandbox)");

const baseUrl = environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";

const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const res = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
  method: "POST",
  headers: {
    "Square-Version": "2026-05-20",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    idempotency_key: idempotencyKey,
    quick_pay: {
      name: "Mountain Ash Flowerlet — 8×10 signed print",
      price_money: {
        amount: 25000, // $250.00
        currency: "USD",
      },
      location_id: locationId,
    },
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error("  Square API error:", JSON.stringify(data, null, 2));
  throw new Error(`Square API returned ${res.status}: ${data?.errors?.[0]?.detail ?? res.statusText}`);
}

const checkoutUrl = data?.payment_link?.url;
const orderId = data?.payment_link?.order_id;

if (!checkoutUrl) throw new Error("No payment_link.url in response");
console.log(`  - Status: ${res.status} OK`);
console.log(`  - Checkout URL: ${checkoutUrl}`);
console.log(`  - Order ID: ${orderId}`);

// ── Test 3: URL is HTTPS Square link ──────────────────────────────
console.log("\n✓ Test 3: Returned URL is an HTTPS Square link");
if (!checkoutUrl.startsWith("https://")) throw new Error("checkoutUrl is not HTTPS");
if (!checkoutUrl.includes("square")) throw new Error("checkoutUrl does not appear to be a Square URL");
console.log("  - HTTPS: yes");
console.log("  - Domain: Square ✓");

console.log("\n✅ All P3 Step 2 tests passed.");
console.log("Square sandbox credentials and API are working correctly.");
console.log(`\nOpen this URL to see the sandbox payment page:\n  ${checkoutUrl}\n`);
