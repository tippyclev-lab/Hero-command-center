// ── H.E.R.O. Command Center — Airtable proxy ──────────────────────────────────
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

const TABLES = {
  members: "Members",
  candidates: "Candidates",
  activities: "Activities",
  reviews: "Reviews",
  motm: "MOTM",
};

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
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ready: false, error: "Method not allowed" });
  }
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    return json(200, { ready: false, error: "Airtable is not configured yet" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ready: false, error: "Malformed request body" });
  }

  const { action, tableKey, data } = payload;
  const table = TABLES[tableKey];
  if (!table) {
    return json(400, { ready: false, error: "Unknown tableKey: " + tableKey });
  }

  const atHeaders = {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
  const findUrl =
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}` +
    `?filterByFormula=${encodeURIComponent(`{key}="${tableKey}"`)}&maxRecords=1`;

  try {
    if (action === "load") {
      const res = await fetch(findUrl, { headers: atHeaders });
      if (!res.ok) {
        const errText = await res.text();
        return json(200, { ready: true, error: `Airtable error: ${errText}`, data: null });
      }
      const found = await res.json();
      if (found.records && found.records.length > 0 && found.records[0].fields.payload) {
        return json(200, { ready: true, data: JSON.parse(found.records[0].fields.payload) });
      }
      return json(200, { ready: true, data: null });
    }

    if (action === "save") {
      const findRes = await fetch(findUrl, { headers: atHeaders });
      const found = await findRes.json();
      const fields = { key: tableKey, payload: JSON.stringify(data) };

      if (found.records && found.records.length > 0) {
        const updateRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}/${found.records[0].id}`,
          { method: "PATCH", headers: atHeaders, body: JSON.stringify({ fields }) }
        );
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          return json(200, { ready: true, ok: false, error: `Airtable update failed: ${errText}` });
        }
      } else {
        const createRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`,
          { method: "POST", headers: atHeaders, body: JSON.stringify({ fields }) }
        );
        if (!createRes.ok) {
          const errText = await createRes.text();
          return json(200, { ready: true, ok: false, error: `Airtable create failed: ${errText}` });
        }
      }
      return json(200, { ready: true, ok: true });
    }

    return json(400, { ready: true, error: "Unknown action: " + action });
  } catch (e) {
    return json(200, { ready: true, error: e.message });
  }
};
