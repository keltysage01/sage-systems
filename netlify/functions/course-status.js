import { getStore } from "@netlify/blobs";

export const config = { path: "/api/course-status" };

export default async function handler(req) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session");

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (!sessionId) {
    return new Response(JSON.stringify({ ready: false }), { headers });
  }

  try {
    const store = getStore("session-courses");
    const data = await store.get(sessionId, { type: "json" });
    if (!data?.courseId) {
      return new Response(JSON.stringify({ ready: false }), { headers });
    }
    return new Response(JSON.stringify({ ready: true, courseId: data.courseId }), { headers });
  } catch {
    return new Response(JSON.stringify({ ready: false }), { headers });
  }
}
