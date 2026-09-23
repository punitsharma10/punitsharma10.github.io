// Checks on the way in (the visitor's messages) and on the way out (the
// model's answer). All pure, so each rule can be tested on its own.

export const LIMITS = { maxMessages: 10, maxChars: 500, maxAssistantChars: 1200, maxTotal: 5000, keepTurns: 5 };

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const URL_RE = /https?:\/\/|www\./i;

// ---------------- signing ----------------
// Earlier answers come back from the browser as history. Each one carries the
// HMAC this Worker issued for it, so a visitor cannot plant words in "my" mouth.
const enc = new TextEncoder();
const keys = new Map();

async function hmacKey(secret) {
  if (!keys.has(secret)) {
    keys.set(secret, crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]));
  }
  return keys.get(secret);
}

export async function sign(value, secret) {
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------------- input ----------------
const mostlySymbols = (text) => (text.match(/\p{L}/gu) || []).length < text.replace(/\s/g, "").length / 2;

// -> { ok: true, turns } or { ok: false, reason }
export async function validate(body, secret) {
  const fail = (reason) => ({ ok: false, reason });
  const raw = body && Array.isArray(body.messages) ? body.messages : null;
  if (!raw || raw.length < 1 || raw.length > LIMITS.maxMessages) return fail("shape");

  const turns = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return fail("shape");
    const text = m.content.replace(CONTROL, "").trim();
    if (!text) return fail("shape");
    if (m.role === "user") {
      if (text.length > LIMITS.maxChars) return fail("shape");
      turns.push({ role: "user", content: text });
      continue;
    }
    // an unsigned or altered answer is dropped, and its question with it (below)
    const kept = text.slice(0, LIMITS.maxAssistantChars);
    if (typeof m.sig !== "string" || m.sig !== (await sign(kept, secret))) continue;
    turns.push({ role: "assistant", content: kept });
  }

  // keep only the last of any run of same-role turns, so roles alternate
  const alt = [];
  for (const t of turns) {
    if (alt.length && alt[alt.length - 1].role === t.role) alt[alt.length - 1] = t;
    else alt.push(t);
  }
  if (!alt.length || alt[alt.length - 1].role !== "user") return fail("shape");

  const last = alt[alt.length - 1].content;
  if (last.length < 2 || URL_RE.test(last) || mostlySymbols(last)) return fail("content");

  const kept = alt.slice(-LIMITS.keepTurns);
  while (kept.length && kept[0].role !== "user") kept.shift();
  if (kept.reduce((n, t) => n + t.content.length, 0) > LIMITS.maxTotal) return fail("shape");
  return { ok: true, turns: kept };
}

// ---------------- output ----------------
export function parseSources(answer, titles) {
  const lines = answer.trimEnd().split("\n");
  const byLower = new Map(titles.map((t) => [t.toLowerCase(), t]));
  const pick = (list) => [
    ...new Set(
      list
        .split(/[,;]/)
        .map((s) => byLower.get(s.trim().replace(/\.$/, "").toLowerCase()))
        .filter(Boolean)
    ),
  ];
  const idx = lines.findLastIndex((l) => /^\s*sources?\s*:/i.test(l));
  if (idx >= 0) {
    return { body: lines.slice(0, idx).join("\n").trim(), sources: pick(lines[idx].replace(/^\s*sources?\s*:/i, "")) };
  }
  // smaller models sometimes put it at the end of the last sentence instead
  const inline = answer.match(/\s*\bsources?\s*:\s*([^\n]*)\s*$/i);
  if (inline) return { body: answer.slice(0, inline.index).trim(), sources: pick(inline[1]) };
  return { body: answer.trim(), sources: [] };
}

const words = (t) => t.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").split(/\s+/).filter(Boolean);

// true when the answer repeats any 12-word run of the rules
export function leaksPrompt(answer, rules, run = 12) {
  const r = words(rules);
  const hay = ` ${words(answer).join(" ")} `;
  for (let i = 0; i + run <= r.length; i++) if (hay.includes(` ${r.slice(i, i + run).join(" ")} `)) return true;
  return false;
}

const NUM = /\d[\d,.]*\d|\d/g;
const normNum = (n) => n.replace(/[,.]+$/, "").replace(/,/g, "");

// numbers of two or more digits that appear nowhere in what the model was given
export function unknownNumbers(answer, known) {
  const knownSet = new Set((known.match(NUM) || []).map(normNum));
  return [...new Set((answer.match(NUM) || []).map(normNum))].filter((n) => n.replace(/\D/g, "").length >= 2 && !knownSet.has(n));
}

// plain text only: strip markdown the model sometimes adds anyway
export const tidy = (s) =>
  s
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*]\s+/gm, "- ")
    .trim();

export function trimLength(s, max = 1200) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > max / 4 ? cut.slice(0, end + 1) : cut.trimEnd();
}
