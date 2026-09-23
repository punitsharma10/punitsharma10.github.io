// The free model chain. Each Gemini model is tried in order; a busy, retired or
// rate-limited one hands over to the next. Cloudflare Workers AI is the last
// hop. All of it runs on free tiers with no card, so nothing here can bill.

// Most reliable first (measured September 2026: 3.6 Flash answers in 4–7 s,
// 3.8 Flash is often overloaded). Google retires and adds Flash models often:
// when one starts returning 404, drop it here, or override with GEMINI_MODELS.
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
// Workers AI retires models too (llama-3.1-8b-instruct went in May 2026).
// Small, instruction-following models spend the fewest of the 10k free daily
// neurons. Override with the CF_MODELS var.
// (gemma-4-26b-a4b-it was tried and timed out, September 2026.)
const CF_MODELS = ["@cf/meta/llama-3.1-8b-instruct-fp8", "@cf/meta/llama-3.2-3b-instruct"];

// statuses that mean "try the next model", not "the request was bad"
const NEXT = new Set([404, 408, 429, 500, 502, 503, 504]);

const PER_MODEL_MS = 8_000;
// the page gives up at 20 s; stop starting new models well before that
const CHAIN_BUDGET_MS = 15_000;

// A model that just failed with overload or a timeout is skipped for a while,
// so the next visitor does not wait on it again. Per isolate, like the limiter.
const COOLDOWN_MS = 120_000;
const cooling = new Map();
const isCooling = (model, now) => (cooling.get(model) || 0) > now;

export class ModelError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function askGemini(model, { key, system, turns }, thinking = true) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.3,
      // answering from a short record needs no reasoning pass, and thinking
      // tokens would count against the output limit. Gemini 3.x takes
      // thinkingLevel; the older thinkingBudget is a 400 on some of them.
      ...(thinking && { thinkingConfig: { thinkingLevel: "minimal" } }),
    },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(PER_MODEL_MS),
  });
  const json = await res.json().catch(() => ({}));
  // a model that does not know the thinking setting gets one retry without it
  if (res.status === 400 && thinking) return askGemini(model, { key, system, turns }, false);
  if (!res.ok) throw new ModelError(res.status, json.error?.message || `gemini ${res.status}`);
  const cand = json.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("");
  // a blocked or empty completion is worth another model's try
  if (!text.trim()) throw new ModelError(502, `empty completion (${cand?.finishReason || "no candidate"})`);
  return text;
}

async function askWorkersAI(ai, { system, turns }, model) {
  const out = await ai.run(model, {
    messages: [{ role: "system", content: system }, ...turns],
    max_tokens: 400,
    temperature: 0.3,
  });
  // older models answer { response }, newer ones the OpenAI shape
  const text = (typeof out?.response === "string" ? out.response : "") || out?.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new ModelError(502, "workers ai: empty completion");
  return text;
}

// -> { text, model } or throws the last ModelError
export async function askChain(env, prompt, log = () => {}) {
  const models = env.GEMINI_MODELS ? env.GEMINI_MODELS.split(",").map((s) => s.trim()).filter(Boolean) : GEMINI_MODELS;
  let last = new ModelError(503, "no model configured");

  const started = Date.now();
  if (env.GEMINI_API_KEY) {
    // cooling models go last rather than being dropped, in case all of them are
    const ordered = [...models.filter((m) => !isCooling(m, started)), ...models.filter((m) => isCooling(m, started))];
    for (const model of ordered) {
      if (Date.now() - started > CHAIN_BUDGET_MS) break;
      try {
        return { text: await askGemini(model, { key: env.GEMINI_API_KEY, ...prompt }), model };
      } catch (e) {
        last = e instanceof ModelError ? e : new ModelError(504, e?.name === "TimeoutError" ? "timeout" : String(e));
        log(`${model} -> ${last.status} ${last.message.slice(0, 80)}`);
        if (!NEXT.has(last.status)) throw last; // a 400 is our bug; another model will not fix it
        // a spent daily quota will not come back in two minutes: rest that model longer
        const spent = last.status === 429 && /quota/i.test(last.message);
        if ([429, 503, 504].includes(last.status)) cooling.set(model, Date.now() + (spent ? 30 * 60_000 : COOLDOWN_MS));
      }
    }
  }

  if (env.AI) {
    const cfModels = env.CF_MODELS ? env.CF_MODELS.split(",").map((s) => s.trim()).filter(Boolean) : CF_MODELS;
    for (const model of cfModels) {
      try {
        return { text: await askWorkersAI(env.AI, prompt, model), model };
      } catch (e) {
        last = e instanceof ModelError ? e : new ModelError(503, String(e));
        log(`${model} -> ${last.message.slice(0, 80)}`);
      }
    }
  }
  throw last;
}
