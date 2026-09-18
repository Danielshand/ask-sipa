// POST /api/installer  { name, phone, email, company, mfr, lang }
// Stores an installer contact so the manufacturer can follow through (Bryan's item 6 and 7). Demo only: nothing is sent yet.
export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const clean = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const rec = {
    t: Date.now(),
    name: clean(b.name, 80),
    phone: clean(b.phone, 30),
    email: clean(b.email, 120),
    company: clean(b.company, 80),
    mfr: clean(b.mfr, 40),
    lang: b.lang === "es" ? "es" : "en",
  };
  if (!rec.name || (!rec.phone && !rec.email)) return new Response("Need a name and a phone or email", { status: 400 });
  if (env.ASK_SIPA_KV) {
    try {
      const list = JSON.parse((await env.ASK_SIPA_KV.get("installers")) || "[]");
      list.unshift(rec);
      await env.ASK_SIPA_KV.put("installers", JSON.stringify(list.slice(0, 1000)));
    } catch {}
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } });
}
