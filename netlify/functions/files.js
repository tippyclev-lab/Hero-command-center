// ── H.E.R.O. Command Center — File storage (Netlify Blobs) ───────────────────
const { getStore, connectLambda } = require("@netlify/blobs");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ok: false, error: "Malformed request body" });
  }

  const { action, key, data } = payload;
  const store = getStore("member-files");

  try {
    if (action === "upload") {
      if (!data) return json(400, { ok: false, error: "No file data provided" });
      const newKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await store.set(newKey, data);
      return json(200, { ok: true, key: newKey });
    }

    if (action === "get") {
      if (!key) return json(400, { ok: false, error: "No key provided" });
      const value = await store.get(key, { type: "text" });
      if (value == null) return json(404, { ok: false, error: "File not found" });
      return json(200, { ok: true, data: value });
    }

    if (action === "delete") {
      if (!key) return json(400, { ok: false, error: "No key provided" });
      await store.delete(key);
      return json(200, { ok: true });
    }

    return json(400, { ok: false, error: "Unknown action: " + action });
  } catch (e) {
    return json(500, { ok: false, error: e.message });
  }
};
