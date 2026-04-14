import { getStore } from "@netlify/blobs";
import crypto from "crypto";

export default async function handler(req) {
  const store = getStore("hotspots");

  // GET — serve stored image, fall back to static frames.jpg
  if (req.method === "GET") {
    const blob = await store.get("image", { type: "arrayBuffer" });
    if (!blob) {
      // No uploaded image yet — redirect to the static file
      return new Response(null, {
        status: 302,
        headers: { Location: "/frames.jpg" },
      });
    }
    const meta = await store.getMetadata("image");
    const contentType = meta?.metadata?.contentType || "image/jpeg";
    return new Response(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  }

  // POST — verify password and store image
  if (req.method === "POST") {
    const authHeader = req.headers.get("x-editor-password") || "";
    const hash = crypto.createHash("sha256").update(authHeader).digest("hex");
    if (hash !== process.env.EDITOR_PASSWORD_HASH) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "image/jpeg";
    const buffer = await req.arrayBuffer();
    if (buffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await store.set("image", buffer, { metadata: { contentType } });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = { path: "/api/image" };
