import { getStore } from "@netlify/blobs";
import crypto from "crypto";

export default async function handler(req) {
  const store = getStore("hotspots");

  // GET — return stored hotspots
  if (req.method === "GET") {
    const data = await store.get("data");
    return new Response(data || "[]", {
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

    const { password, hotspots } = body;
    if (!password || !Array.isArray(hotspots)) {
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

    await store.set("data", JSON.stringify(hotspots));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = { path: "/api/hotspots" };
