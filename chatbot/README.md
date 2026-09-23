# PunitBot — portfolio chatbot

A self-contained feature. The site loads it with one line in `index.html`:

```html
<script src="./chatbot/index.js" defer></script>
```

Delete that line and the chatbot is gone; nothing else in the site depends on it.

## Folder

```
chatbot/
├── index.js            mount point: loads the CSS, the knowledge and the panel; holds the Worker URL
├── chatbot.js          the chat panel (UI, typing effect, source chips, FAQ fallback)
├── chatbot.css         panel styles (reuses the site's colour tokens)
├── knowledge.js        GENERATED from knowledge/ — do not edit
├── build.js            regenerates knowledge.js and worker/src/knowledge.js
├── knowledge/
│   ├── profile.md      what the bot knows: one "## Title {#section-id}" per page section
│   └── faq.md          ready answers + keywords, used by the AI and by the offline fallback
└── worker/             the backend (Cloudflare Worker, free plan)
    ├── src/index.js    POST /ask: origin check, rate limit, validation, answer checks
    ├── src/models.js   free model chain: Gemini models, then Cloudflare Workers AI
    ├── src/prompt.js   the rules the AI follows
    ├── src/guards.js   input/output checks, history signing
    ├── wrangler.toml   Worker config (name: punitbot)
    ├── dev.mjs         run the Worker locally on :8787
    ├── test-live.mjs   behaviour tests against the local Worker
    └── .dev.vars       SECRETS (Gemini key, signing secret) — git-ignored, never commit
```

## How a question is answered

Page → `https://punitbot.punitsharma10.workers.dev/ask` → Gemini 3.6 Flash → 3.8 Flash →
3.5 Flash-Lite → Flash-Lite-latest → Cloudflare Llama 3.1 8B → Llama 3.2 3B.
If every model is down, the page answers from `faq.md` on its own. All free tiers, no card.

## Common changes

**Update what the bot knows** (new job, new project, new FAQ answer):

```sh
# 1. edit chatbot/knowledge/profile.md or chatbot/knowledge/faq.md
node chatbot/build.js                  # 2. regenerate the knowledge files
cd chatbot/worker && npx wrangler deploy   # 3. give the AI the new record
# 4. commit and push the site as usual (the page's FAQ fallback updates with it)
```

**Change suggested questions or the look:** `chatbot.js` (`STARTERS`) and `chatbot.css`.

**Change how the AI behaves:** `worker/src/prompt.js`, then `npx wrangler deploy`.

**A Gemini model stopped working (404):** remove it from `GEMINI_MODELS` in
`worker/src/models.js`, then `npx wrangler deploy`.

**Replace the Gemini key:** put the new key in `worker/.dev.vars`, then
`cd chatbot/worker && npx wrangler secret put GEMINI_API_KEY` and paste it when asked.

**Test the Worker locally:** `cd chatbot/worker && node dev.mjs`, then in `index.js`
point `endpoint` at `http://localhost:8787/ask` (switch it back before pushing).

**Watch live logs:** `cd chatbot/worker && npx wrangler tail punitbot`.
