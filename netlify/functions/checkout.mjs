/**
 * POST /api/checkout
 *
 * Creates a Square-hosted payment link for a single hotspot item.
 *
 * Request body: { subject: string, priceMinor: number, currency?: string }
 *   subject    — item name displayed on the Square checkout page
 *   priceMinor — price in cents (integer ≥ 1)
 *   currency   — ISO 4217 code, defaults to "USD"
 *
 * Response (200): { checkoutUrl: string }
 * Response (4xx): { error: string }
 * Response (502): { error: string }  — Square API failure
 */
export default async function handler(req, context) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse and validate request body ─────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { subject, priceMinor, currency = "USD" } = body ?? {};

  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return new Response(JSON.stringify({ error: "subject is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!Number.isInteger(priceMinor) || priceMinor < 1) {
    return new Response(JSON.stringify({ error: "priceMinor must be a positive integer (cents)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Env vars ─────────────────────────────────────────────────────
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT ?? "sandbox";

  if (!accessToken || !locationId) {
    console.error("[checkout] Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const baseUrl = environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";

  // ── Call Square Create Payment Link API ──────────────────────────
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let squareRes;
  try {
    squareRes = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Square-Version": "2026-05-20",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: subject.trim(),
          price_money: {
            amount: priceMinor,
            currency,
          },
          location_id: locationId,
        },
      }),
    });
  } catch (err) {
    console.error("[checkout] Square API fetch failed:", err);
    return new Response(JSON.stringify({ error: "Failed to reach Square API" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const squareData = await squareRes.json();

  if (!squareRes.ok) {
    const errDetail = squareData?.errors?.[0]?.detail ?? squareRes.statusText;
    console.error("[checkout] Square API error:", squareData);
    return new Response(JSON.stringify({ error: `Square error: ${errDetail}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const checkoutUrl = squareData?.payment_link?.url;
  if (!checkoutUrl) {
    console.error("[checkout] Square response missing payment_link.url:", squareData);
    return new Response(JSON.stringify({ error: "No checkout URL in Square response" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ checkoutUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { path: "/api/checkout" };
