import { getStore } from "@netlify/blobs";

export const config = { path: "/api/update-kb" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { secret, content, key = "tools-kb" } = await req.json();
  if (!secret || secret !== process.env.KB_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!content || typeof content !== "string") {
    return new Response("Missing content", { status: 400 });
  }
  const store = getStore("knowledge-base");
  await store.set(key, content);
  return new Response(JSON.stringify({ ok: true, key, length: content.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
