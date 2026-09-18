// GET /api/page?doc=BP-7-Installation&p=6  -> the extracted text of one page, so the UI can show the cited passage
import corpus from "../../corpus/corpus.json";

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const id = u.searchParams.get("doc") || "";
  const p = parseInt(u.searchParams.get("p") || "0", 10);
  const doc = corpus.find(d => d.id === id);
  const page = doc && doc.pages.find(x => x.page === p);
  if (!page) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { "content-type": "application/json" } });
  return new Response(JSON.stringify({ id, title: doc.title, url: doc.url, page: p, text: page.text }), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=86400", "access-control-allow-origin": "*" },
  });
}
