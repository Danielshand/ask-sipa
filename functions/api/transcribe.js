// POST /api/transcribe  (multipart: audio=<blob>, lang=en|es)  -> { text }
// Server-side speech-to-text using OpenAI. Works on every browser and inside embeds,
// unlike the browser's built-in recognition. Returns 501 if no OPENAI_API_KEY so the page can fall back.
export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY) return new Response(JSON.stringify({ fallback: true }), { status: 501, headers: { "content-type": "application/json" } });
  let form;
  try { form = await request.formData(); } catch { return new Response("Bad form", { status: 400 }); }
  const audio = form.get("audio");
  const lang = form.get("lang") === "es" ? "es" : "en";
  if (!audio || typeof audio === "string") return new Response("No audio", { status: 400 });
  if (audio.size > 8 * 1024 * 1024) return new Response("Audio too large", { status: 413 });

  const out = new FormData();
  const t = (audio.type || "").toLowerCase();
  const ext = t.includes("mp4") || t.includes("m4a") ? "m4a" : t.includes("mpeg") || t.includes("mp3") ? "mp3" : t.includes("ogg") ? "ogg" : t.includes("wav") ? "wav" : "webm";
  out.append("file", audio, "question." + ext);
  out.append("model", env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe");
  out.append("language", lang);
  out.append("prompt", lang === "es"
    ? "Pregunta de un instalador de paneles SIP (paneles estructurales aislados). Términos: SIP, OSB, solera, espiga, sellador, ducto eléctrico."
    : "A jobsite question from a SIP (structural insulated panel) installer. Terms: SIP, OSB, spline, sill plate, top plate, sealant, electrical chase, shop drawings, HVAC.");

  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "authorization": "Bearer " + env.OPENAI_API_KEY },
    body: out,
  });
  if (!r.ok) return new Response("STT error: " + (await r.text()).slice(0, 200), { status: 502 });
  const j = await r.json();
  return new Response(JSON.stringify({ text: (j.text || "").trim() }), { headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" } });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } });
}
