// Runs the Worker locally on http://localhost:8787 with plain Node — no
// Cloudflare account or wrangler needed. Secrets come from .dev.vars.
// Workers AI (env.AI) only exists on Cloudflare, so locally the chain is Gemini only.
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import worker from "./src/index.js";

const VARS = new URL("./.dev.vars", import.meta.url);
const env = {};
for (const line of fs.readFileSync(VARS, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}
// a signing secret is required; make one on first run and keep it
if (!env.BOT_SECRET) {
  env.BOT_SECRET = crypto.randomBytes(32).toString("base64url");
  fs.appendFileSync(VARS, `BOT_SECRET=${env.BOT_SECRET}\n`);
}

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(`http://localhost:8787${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const out = await worker.fetch(request, env);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  })
  .listen(8787, () => console.log("PunitBot worker on http://localhost:8787/ask"));
