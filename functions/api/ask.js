// POST /api/ask  { messages: [{role, content}], mfr?: string }
// Streams plain text back. Grounded on corpus/corpus.json, sent as a cached system prompt.
import corpus from "../../corpus/corpus.json";

const MODEL_DEFAULT = "claude-sonnet-4-5";

function buildCorpusText() {
  const parts = [];
  for (const doc of corpus) {
    parts.push(`<document id="${doc.id}" title="${doc.title}" source="${doc.source}">`);
    for (const p of doc.pages) {
      parts.push(`<page doc="${doc.id}" n="${p.page}">\n${p.text}\n</page>`);
    }
    parts.push(`</document>`);
  }
  return parts.join("\n");
}

const INSTRUCTIONS = `You are Ask SIPA, a jobsite helper for builders and installers working with structural insulated panels (SIPs). You answer ONLY from the SIPA documents provided below (Best Practices brochures, Need to Know, installation guidelines, BEST lessons, prescriptive method).

Rules:
1. Answer in plain, direct language an installer can use on site. Short paragraphs or a short numbered list. No fluff.
2. Every factual statement must be backed by a citation in this exact form: [DOC-ID p.N], where DOC-ID is the doc attribute and N is the n attribute of the <page> tag that actually contains the words you are relying on (every page tag carries both). Example: [BP-7-Installation p.6]. Put the citation right after the sentence it supports. Before writing a citation, look at the page tag surrounding the text and copy its document id and page number exactly. Never cite a page from memory.
3. When you quote, quote short phrases (under 15 words) exactly as they appear on that page, inside quotation marks. If you are paraphrasing, do not use quotation marks.
4. Only if the documents contain nothing useful on the question: say so in one sentence, output the token [[NO_ANSWER]] on its own line, and suggest the closest topic the documents DO cover. Never output [[NO_ANSWER]] when you have given a substantive answer. Never guess and never invent a citation.
5. Always defer to the panel manufacturer's specifications, engineered shop drawings, and local code when they are stricter. Say this in one short line when the topic is structural, fire, sealant, fastening, plumbing, or electrical.
6. Do not give advice that would void a manufacturer warranty. If a practice is a "don't" in the documents, say so clearly.
7. Keep answers under 200 words unless the user asks for detail. Do not use markdown headings (no lines starting with #). Use bold for short labels and plain numbered or dashed lists.
8. If the user writes in Spanish, answer in Spanish, keeping the same citation form.`;

let cachedSystem = null;
function systemBlocks() {
  if (!cachedSystem) {
    cachedSystem = [
      { type: "text", text: INSTRUCTIONS },
      { type: "text", text: "SIPA DOCUMENTS:\n" + buildCorpusText(), cache_control: { type: "ephemeral" } },
    ];
  }
  return cachedSystem;
}

async function logUsage(env, question, mfr, noAnswer) {
  if (!env.ASK_SIPA_KV) return;
  try {
    const kv = env.ASK_SIPA_KV;
    const day = new Date().toISOString().slice(0, 10);
    const total = parseInt((await kv.get("count:total")) || "0", 10) + 1;
    const dayCount = parseInt((await kv.get("count:" + day)) || "0", 10) + 1;
    await kv.put("count:total", String(total));
    await kv.put("count:" + day, String(dayCount));
    if (mfr) {
      const m = parseInt((await kv.get("mfr:" + mfr)) || "0", 10) + 1;
      await kv.put("mfr:" + mfr, String(m));
    }
    const recent = JSON.parse((await kv.get("recent")) || "[]");
    recent.unshift({ t: Date.now(), q: question.slice(0, 200), mfr: mfr || "", noAnswer: !!noAnswer });
    await kv.put("recent", JSON.stringify(recent.slice(0, 200)));
  } catch (e) {
    // logging must never break an answer
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response("Server is missing ANTHROPIC_API_KEY", { status: 500 });
  }
  let body;
  try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const messages = (body.messages || [])
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response("Need a user message", { status: 400 });
  }
  const mfr = typeof body.mfr === "string" ? body.mfr.slice(0, 40).replace(/[^\w .-]/g, "") : "";

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || MODEL_DEFAULT,
      max_tokens: 800,
      temperature: 0,
      stream: true,
      system: systemBlocks(),
      messages,
    }),
  });

  if (!upstream.ok) {
    const txt = await upstream.text();
    return new Response("Upstream error: " + txt.slice(0, 300), { status: 502 });
  }

  const question = messages[messages.length - 1].content;
  let full = "";
  const decoder = new TextDecoder();
  let buf = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      const enc = new TextEncoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") {
              full += ev.delta.text;
              controller.enqueue(enc.encode(ev.delta.text));
            }
          } catch {}
        }
      }
      controller.close();
      await logUsage(env, question, mfr, full.includes("[[NO_ANSWER]]"));
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}
