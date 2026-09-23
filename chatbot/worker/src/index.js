// PunitBot's backend: one Cloudflare Worker, one route.
//   POST /ask  { messages: [{ role, content, sig? }] }  ->  { answer, sources, sig, model }
// Order of checks: origin, per-address allowance, message shape and content,
// then the model chain, then the answer checks. Message text is never logged.
import { askChain } from "./models.js";
import { hasOverride, REMINDER, RULES, RECORD, SYSTEM, TITLES } from "./prompt.js";
import { LIMITS, leaksPrompt, parseSources, sign, tidy, trimLength, unknownNumbers, validate } from "./guards.js";
import K from "./knowledge.js";

const LINES = {
  origin: "PunitBot only answers from the portfolio page.",
  invalid: "That message could not be sent. Keep it short, plain text, no links.",
  tooFast: "One question at a time. Try again in a moment.",
  quota: `That is the limit for now. Email me at ${K.email} to keep talking.`,
  resting: `I am taking a short break. Email me at ${K.email}.`,
  unverified: `I could not verify part of that against my record. Email me at ${K.email} for the exact detail.`,
  decline: `I can only answer from my record. Email me at ${K.email} for anything else.`,
};

const DEFAULT_ORIGINS = "https://punitsharma10.github.io,http://localhost:8080";

// ---------------- per-address allowance ----------------
// Kept in the isolate's memory: soft, since isolates recycle, but it stops one
// script from draining the free daily quota, which is its only job.
const LIMIT = { perHour: 20, perDay: 60, minGapMs: 1500 };
const hits = new Map();

function allow(ip, now) {
  let h = hits.get(ip);
  if (!h || now - h.day >= 86_400_000) h = { day: now, hour: now, dayCount: 0, hourCount: 0, last: 0 };
  if (now - h.hour >= 3_600_000) Object.assign(h, { hour: now, hourCount: 0 });
  hits.set(ip, h);
  if (h.dayCount >= LIMIT.perDay || h.hourCount >= LIMIT.perHour) return "quota";
  if (now - h.last < LIMIT.minGapMs) return "gap";
  h.dayCount++;
  h.hourCount++;
  h.last = now;
  if (hits.size > 5000) hits.delete(hits.keys().next().value); // bound memory
  return "ok";
}

// ---------------- helpers ----------------
function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-punitbot",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (status, data, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });

// "not in my record" style answers always carry the email, even if the model forgot it
function ensureEmail(answer) {
  const needs = /not in my record|only (cover|answer)|directly by email|discuss that directly/i.test(answer) && !answer.includes(K.email);
  if (!needs) return answer;
  const body = answer.trim();
  return `${/[.!?]$/.test(body) ? body : `${body}.`} Email me at ${K.email}.`;
}

// ---------------- handler ----------------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim());
    const okOrigin = allowed.includes(origin);
    const h = okOrigin ? cors(origin) : {};

    if (url.pathname !== "/ask") return json(404, { error: "not found" });
    if (req.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: h });
    if (req.method !== "POST") return json(405, { error: "method not allowed" }, h);
    // the custom header forces a CORS preflight, so other sites cannot post from a browser
    if (!okOrigin || req.headers.get("x-punitbot") !== "1") return json(403, { error: LINES.origin }, h);

    const secret = env.BOT_SECRET;
    if (!secret) return json(503, { error: LINES.resting }, h);

    const t0 = Date.now();
    const ip = req.headers.get("cf-connecting-ip") || "local";
    const gate = allow(ip, t0);
    if (gate !== "ok") return json(429, { error: gate === "gap" ? LINES.tooFast : LINES.quota }, h);

    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: LINES.invalid }, h);
    }
    const v = await validate(body, secret);
    if (!v.ok) return json(400, { error: LINES.invalid }, h);

    const last = v.turns[v.turns.length - 1];
    const turns = hasOverride(last.content) ? [...v.turns.slice(0, -1), { ...last, content: last.content + REMINDER }] : v.turns;

    let reply;
    try {
      reply = await askChain(env, { system: SYSTEM, turns }, (m) => console.log(`chain ${m}`));
    } catch (e) {
      console.log(`ask failed ${e.status} ${Date.now() - t0}ms`);
      // 503 tells the page to answer from its own FAQ instead
      return json(503, { error: LINES.resting }, h);
    }

    // ---- answer checks ----
    const flags = [];
    let answer;
    let sources = [];
    if (leaksPrompt(reply.text, RULES)) {
      answer = LINES.decline;
      flags.push("leak");
    } else {
      const parsed = parseSources(reply.text, TITLES);
      const userText = v.turns.filter((t) => t.role === "user").map((t) => t.content).join("\n");
      const bad = unknownNumbers(parsed.body, `${RECORD}\n${userText}`);
      if (bad.length) {
        answer = LINES.unverified;
        flags.push(`number:${bad.join("|")}`);
      } else {
        answer = ensureEmail(trimLength(tidy(parsed.body)));
        sources = parsed.sources;
      }
    }

    console.log(`ask ok ${reply.model} ${Date.now() - t0}ms flags=${flags.join(",") || "none"}`);
    const sig = await sign(answer.slice(0, LIMITS.maxAssistantChars), secret);
    return json(200, { answer, sources, sig, model: reply.model }, h);
  },
};
