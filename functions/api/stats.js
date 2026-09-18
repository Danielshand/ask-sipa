// GET /api/stats  -> usage numbers for the admin page
import corpus from "../../corpus/corpus.json";

export async function onRequestGet({ env }) {
  const out = { total: 0, today: 0, byManufacturer: {}, recent: [], corpus: [] };
  out.corpus = corpus.map(d => ({ id: d.id, title: d.title, pages: d.pages.length, url: d.url }));
  if (env.ASK_SIPA_KV) {
    const kv = env.ASK_SIPA_KV;
    const day = new Date().toISOString().slice(0, 10);
    out.total = parseInt((await kv.get("count:total")) || "0", 10);
    out.today = parseInt((await kv.get("count:" + day)) || "0", 10);
    out.recent = JSON.parse((await kv.get("recent")) || "[]");
    const list = await kv.list({ prefix: "mfr:" });
    for (const k of list.keys) out.byManufacturer[k.name.slice(4)] = parseInt((await kv.get(k.name)) || "0", 10);
  } else {
    out.note = "KV not bound yet; counts start once ASK_SIPA_KV is attached in Cloudflare.";
  }
  return new Response(JSON.stringify(out), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
