import { getStore } from "@netlify/blobs";
import crypto from "crypto";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isOptionalString(value) {
  return value === undefined || typeof value === "string";
}

function isOptionalStringArray(value) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isPercent(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function validateHotspots(hotspots) {
  if (!Array.isArray(hotspots)) {
    return ["hotspots must be an array"];
  }

  const errors = [];

  hotspots.forEach((hotspot, idx) => {
    const prefix = `hotspots[${idx}]`;
    if (!isObject(hotspot)) {
      errors.push(`${prefix} must be an object`);
      return;
    }

    if (!isPercent(hotspot.x)) errors.push(`${prefix}.x must be a number between 0 and 100`);
    if (!isPercent(hotspot.y)) errors.push(`${prefix}.y must be a number between 0 and 100`);
    if (!isPercent(hotspot.w)) errors.push(`${prefix}.w must be a number between 0 and 100`);
    if (!isPercent(hotspot.h)) errors.push(`${prefix}.h must be a number between 0 and 100`);

    if (typeof hotspot.tooltip !== "string" || hotspot.tooltip.trim() === "") {
      errors.push(`${prefix}.tooltip must be a non-empty string`);
    }

    if (!isOptionalString(hotspot.subject)) errors.push(`${prefix}.subject must be a string`);
    if (!isOptionalString(hotspot.magnification)) {
      errors.push(`${prefix}.magnification must be a string`);
    }
    if (!isOptionalStringArray(hotspot.lighting)) {
      errors.push(`${prefix}.lighting must be an array of strings`);
    }
    if (!isOptionalStringArray(hotspot.tags)) {
      errors.push(`${prefix}.tags must be an array of strings`);
    }
    if (!isOptionalString(hotspot.notes)) errors.push(`${prefix}.notes must be a string`);
    if (!isOptionalString(hotspot.price)) errors.push(`${prefix}.price must be a string`);
    if (!isOptionalString(hotspot.link)) errors.push(`${prefix}.link must be a string`);
  });

  return errors;
}

export default async function handler(req) {
  const store = getStore("hotspots");

  // GET — return stored hotspots, fall back to static file
  if (req.method === "GET") {
    const data = await store.get("data");
    if (!data) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/hotspots.json" },
      });
    }
    return new Response(data, {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST — verify password and save hotspots
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password, hotspots, validate } = body;
    if (!password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");
    if (hash !== process.env.EDITOR_PASSWORD_HASH) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // validate-only: just confirm the password, don't save
    if (validate) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(hotspots)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationErrors = validateHotspots(hotspots);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid hotspots payload",
          details: validationErrors.slice(0, 20),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await store.set("data", JSON.stringify(hotspots));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = { path: "/api/hotspots" };
