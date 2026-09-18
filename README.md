# Ask SIPA (concept demo)

Plain-English answers from SIPA Best Practices with page citations, voice input, a one-line embed for manufacturer sites, printable QR signs, and a usage page.

Built as a no-strings demo for the SIPA Best Practices project (Bryan Walsh, Jeremy Dieken, Jonathan Early, Sept 2026). Not an official SIPA product.

## How it works

1. `corpus/corpus.json` holds the text of 15 public SIPA documents (Need to Know, Builder BP-7 and BP-9, Design BP-3/5/7, installation guidelines, prescriptive method, BEST lessons 1-5, 7, 9), page by page. `corpus/build_corpus.py` rebuilds it from the PDFs in `corpus/pdf/` (PDFs are kept out of the repo; they are all public at the URLs listed in corpus.json).
2. `functions/api/ask.js` is a Cloudflare Pages Function. It sends the whole corpus to Claude as a cached system prompt (about 85k tokens, so caching makes each question cost cents) and streams the answer back. Answers must cite `[DOC-ID p.N]`; if the documents do not cover the question the model says so and the question is logged as a gap.
3. `public/index.html` is the chat. `embed.js` is the manufacturer widget. `qr.html` prints signs. `admin.html` shows usage from Cloudflare KV.

## Deploy (Cloudflare Pages, about 10 minutes)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > pick the repo. Build command: none. Output directory: `public`. Deploy.
3. Project > Settings > Variables and Secrets > add secret `ANTHROPIC_API_KEY`.
4. Optional: Workers & Pages > KV > create namespace `ask-sipa-usage`; then Project > Settings > Bindings > KV namespace, variable name `ASK_SIPA_KV`. Redeploy.
5. Open the `*.pages.dev` URL. Custom domain later (for example ask.sips.org).

## Run locally

```
npm i -g wrangler
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
wrangler pages dev public
```

## Adding documents

Drop a PDF in `corpus/pdf/`, add a line to the `docs` list in `corpus/build_corpus.py` (id, title, source, public URL), run `python3 corpus/build_corpus.py` from the `corpus/` folder, regenerate `public/docs.js` (see `make_docs.py`), commit, push. Cloudflare redeploys.

## What production adds (not in the demo)

SIPA domain, staff upload panel (no developer needed to add a PDF), full Builder BP-1 to BP-10 set and the 27 connection details, per-manufacturer overlays, Spanish toggle, dashboard exports, photo questions, BEST course quiz coach.
