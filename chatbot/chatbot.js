// ============================================================
// PunitBot — the portfolio assistant
// Talks to the AI endpoint when one is configured; otherwise, or when the
// endpoint fails, answers from the FAQ in the page so it never goes dark.
// Loaded by index.js after knowledge.js, which sets window.PUNITBOT_KNOWLEDGE.
// ============================================================
(function punitBot() {
  const K = window.PUNITBOT_KNOWLEDGE;
  if (!K) return;

  const CFG = {
    endpoint: window.PUNITBOT_ENDPOINT || "", // set once the Worker is deployed
    email: K.email,
    charsPerSecond: 45,
    minGapMs: 1500, // one question at a time
    maxChars: 500,
    timeoutMs: 20000,
    store: "punitbot-thread",
    nudgeKey: "punitbot-nudged",
  };

  const STARTERS = [
    { icon: "bx-buildings", text: "What do you build at OmnisAI?" },
    { icon: "bx-brain", text: "What is your AI and LLM experience?" },
    { icon: "bx-trophy", text: "Why should I hire you?" },
    { icon: "bx-envelope", text: "How can I contact you?" },
  ];

  const URL_RE = /https?:\/\/|www\./i;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // section title -> page anchor, for the source chips
  const anchors = new Map(K.sections.map((s) => [s.title, s.anchor]));

  // ----------------- markup -----------------
  const launch = el("button", {
    class: "pbot-launch",
    type: "button",
    "aria-haspopup": "dialog",
    "aria-expanded": "false",
    "aria-controls": "pbot",
    html:
      '<span class="pbot-launch-icon"><i class="bx bx-bot"></i></span>' +
      '<span class="pbot-launch-label">Ask PunitBot</span>',
  });
  launch.setAttribute("aria-label", "Ask PunitBot, Punit's AI assistant");

  const nudge = el("div", {
    class: "pbot-nudge",
    role: "status",
    html:
      "<p>👋 Hi! I am Punit's AI. Ask me about his experience, projects or skills.</p>" +
      '<button type="button" aria-label="Dismiss">×</button>',
  });

  const panel = el("div", {
    class: "pbot",
    id: "pbot",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "pbot-name",
    html: `
      <header class="pbot-head">
        <span class="pbot-avatar"><img src="./Punit.png" alt="" width="42" height="42"></span>
        <div class="pbot-title">
          <b id="pbot-name">PunitBot <span class="pbot-tag">AI</span></b>
          <span>Answers from Punit's record</span>
        </div>
        <button type="button" class="pbot-icon-btn" data-act="reset" aria-label="Start a new chat" title="New chat"><i class="bx bx-refresh"></i></button>
        <button type="button" class="pbot-icon-btn" data-act="close" aria-label="Close chat" title="Close"><i class="bx bx-x"></i></button>
      </header>
      <div class="pbot-list" aria-live="polite"></div>
      <form class="pbot-form" novalidate>
        <label for="pbot-input" class="pbot-sr">Your question</label>
        <textarea id="pbot-input" rows="1" maxlength="${CFG.maxChars}" placeholder="Ask about my work…"></textarea>
        <button type="submit" class="pbot-send" aria-label="Send" disabled><i class="bx bxs-send"></i></button>
      </form>
      <div class="pbot-foot">
        <span class="pbot-hint" aria-live="polite"></span>
        <span>Or email <a href="mailto:${CFG.email}">${CFG.email}</a></span>
      </div>`,
  });
  panel.hidden = true;

  document.body.append(nudge, launch, panel);

  const list = panel.querySelector(".pbot-list");
  const form = panel.querySelector(".pbot-form");
  const input = panel.querySelector("textarea");
  const sendBtn = panel.querySelector(".pbot-send");
  const hint = panel.querySelector(".pbot-hint");

  // ----------------- state -----------------
  let msgs = loadThread(); // { role: "user"|"bot", text, sources?, sig?, error? }
  let busy = false;
  let lastSent = 0;

  // ----------------- open / close -----------------
  function open() {
    panel.hidden = false;
    document.body.classList.add("pbot-open");
    launch.setAttribute("aria-expanded", "true");
    hideNudge(true);
    render();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    panel.hidden = true;
    document.body.classList.remove("pbot-open");
    launch.setAttribute("aria-expanded", "false");
    launch.focus();
  }

  launch.addEventListener("click", open);
  panel.querySelector('[data-act="close"]').addEventListener("click", close);
  panel.querySelector('[data-act="reset"]').addEventListener("click", () => {
    msgs = [];
    saveThread();
    render();
    input.focus();
  });

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return close();
    if (e.key !== "Tab") return;
    // keep Tab inside the dialog
    const f = [...panel.querySelectorAll("button:not(:disabled), textarea, a[href]")];
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // a one-time nudge a few seconds in, once per tab
  function hideNudge(forever) {
    nudge.classList.remove("show");
    if (forever) safe(() => sessionStorage.setItem(CFG.nudgeKey, "1"));
  }
  nudge.querySelector("p").addEventListener("click", open);
  nudge.querySelector("button").addEventListener("click", () => hideNudge(true));
  if (!safe(() => sessionStorage.getItem(CFG.nudgeKey))) {
    setTimeout(() => {
      if (panel.hidden) nudge.classList.add("show");
      setTimeout(() => hideNudge(false), 9000);
    }, 5000);
  }

  // ----------------- composer -----------------
  const grow = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    // a scrollbar only once the question is taller than the field allows
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden";
  };

  input.addEventListener("input", () => {
    grow();
    sendBtn.disabled = busy || !input.value.trim();
    hint.textContent = "";
  });

  input.addEventListener("keydown", (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
  });

  // ----------------- asking -----------------
  async function ask(text) {
    const q = text.trim();
    if (!q || busy) return;
    if (q.length < 2) return;
    if (URL_RE.test(q)) {
      hint.textContent = "Please ask without links.";
      return;
    }
    if (Date.now() - lastSent < CFG.minGapMs) {
      hint.textContent = "One question at a time.";
      return;
    }
    lastSent = Date.now();
    hint.textContent = "";

    const history = historyFor(msgs);
    msgs.push({ role: "user", text: q });
    input.value = "";
    grow();
    setBusy(true);
    render();

    let reply = null;
    if (CFG.endpoint) reply = await askRemote(history, q);
    if (!reply) {
      // no endpoint, or it failed: answer from the FAQ after a human-feeling pause
      await wait(reduced ? 0 : 550 + Math.random() * 450);
      reply = { role: "bot", ...localAnswer(q), local: true };
    }

    msgs.push(reply);
    saveThread();
    setBusy(false);
    render(msgs.length - 1);
  }

  async function askRemote(history, q) {
    try {
      const res = await fetch(CFG.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-punitbot": "1" },
        body: JSON.stringify({ messages: [...history, { role: "user", content: q }] }),
        signal: AbortSignal.timeout(CFG.timeoutMs),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.answer) return { role: "bot", text: json.answer, sources: json.sources || [], sig: json.sig };
      // a rate-limit message is worth showing as-is; anything else falls back to the FAQ
      if (res.status === 429 && json.error) return { role: "bot", text: json.error, error: true };
    } catch {
      // network error or timeout: fall through to the local answer
    }
    return null;
  }

  // The last two complete question/answer pairs, for follow-up questions.
  // Only answers the server signed go back, so the history cannot be forged.
  function historyFor(all) {
    const pairs = [];
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i];
      const b = all[i + 1];
      if (a.role === "user" && b.role === "bot" && b.sig && !b.error) {
        pairs.push({ role: "user", content: a.text }, { role: "assistant", content: b.text, sig: b.sig });
      }
    }
    return pairs.slice(-4);
  }

  // ----------------- local FAQ matcher -----------------
  const norm = (s) =>
    " " +
    s
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9.+#]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " ";

  function localAnswer(q) {
    const text = norm(q);
    let best = null;
    let bestScore = 0;
    for (const f of K.faq) {
      let score = 0;
      for (const k of f.keywords) {
        const kk = norm(k);
        if (kk.trim() && text.includes(kk)) {
          // phrases are stronger evidence than single words
          const words = kk.trim().split(" ").length;
          score += words > 1 ? 2 + words : 2;
        }
      }
      // a greeting only wins when nothing else matched
      if (f.id === "greeting") score = Math.min(score, 1);
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }
    if (!best) {
      return {
        text: `I only answer questions about my work: experience, projects, skills, education or how to reach me. For anything else, email me at ${CFG.email}.`,
        sources: [],
      };
    }
    if (best.todo) {
      return { text: `That is not in my record yet. Email me at ${CFG.email} and I will answer directly.`, sources: [] };
    }
    return { text: best.answer, sources: best.sources };
  }

  // ----------------- rendering -----------------
  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b || !input.value.trim();
  }

  // `animateIndex` is the one new bot answer that types itself out
  function render(animateIndex = -1) {
    list.textContent = "";

    if (!msgs.length) {
      const hello = el("div", {
        class: "pbot-hello",
        html:
          '<i class="bx bx-bot"></i><h3>Hi, I am PunitBot</h3>' +
          "<p>Punit's AI. I answer questions about his work from his record and show where each answer comes from.</p>",
      });
      const starters = el("div", { class: "pbot-starters" });
      for (const s of STARTERS) {
        const b = el("button", { type: "button", html: `<i class="bx ${s.icon}"></i>` });
        b.append(s.text);
        b.addEventListener("click", () => ask(s.text));
        starters.append(b);
      }
      list.append(hello, starters);
    }

    msgs.forEach((m, i) => {
      const box = el("div", { class: `pbot-msg ${m.role}${m.error ? " error" : ""}` });
      const p = el("p");
      box.append(p);
      list.append(box);

      if (m.role === "user" || m.error) {
        p.textContent = m.text;
        return;
      }

      const finish = () => {
        p.innerHTML = linkify(m.text);
        box.append(sourcesFor(m));
        scrollDown();
      };

      if (i === animateIndex && !reduced) {
        typeOut(p, m.text, finish);
        // click an answer to skip the typing
        box.addEventListener("click", () => p.dispatchEvent(new Event("skip")), { once: true });
      } else {
        finish();
      }
    });

    if (busy) {
      const box = el("div", { class: "pbot-msg bot", role: "status", "aria-label": "Thinking" });
      box.append(el("p", { class: "pbot-dots", html: "<i></i><i></i><i></i>" }));
      list.append(box);
    }

    scrollDown();
  }

  function typeOut(p, text, done) {
    let n = 0;
    const visible = document.createElement("span");
    visible.setAttribute("aria-hidden", "true");
    const caret = el("i", { class: "pbot-caret" });
    // screen readers get the whole answer at once
    const sr = el("span", { class: "pbot-sr" });
    sr.textContent = text;
    p.append(visible, caret, sr);

    // Driven by elapsed time, not tick count: browsers slow timers down in a
    // background window, and a tick-counted effect would crawl there.
    const started = performance.now();
    const timer = setInterval(() => {
      const next = Math.min(text.length, Math.floor(((performance.now() - started) / 1000) * CFG.charsPerSecond));
      if (next === n) return;
      if (Math.floor(next / 30) !== Math.floor(n / 30)) scrollDown();
      n = next;
      visible.textContent = text.slice(0, n);
      if (n >= text.length) stop();
    }, 1000 / CFG.charsPerSecond);

    function stop() {
      clearInterval(timer);
      done();
    }
    p.addEventListener("skip", stop, { once: true });
  }

  function sourcesFor(m) {
    const row = el("div", { class: "pbot-sources" });
    const srcs = (m.sources || []).filter((s) => anchors.has(s));
    if (!srcs.length) return row;
    row.append(el("small", { html: "Source:" }));
    for (const s of srcs) {
      const chip = el("button", { type: "button", class: "pbot-chip", html: '<i class="bx bx-link-alt"></i>' });
      chip.append(s);
      chip.setAttribute("aria-label", `Go to the ${s} section`);
      chip.addEventListener("click", () => {
        const target = document.getElementById(anchors.get(s));
        if (!target) return;
        // on a phone the sheet covers the page, so step out of the way first
        if (window.matchMedia("(max-width: 560px)").matches) close();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
      row.append(chip);
    }
    return row;
  }

  function scrollDown() {
    list.scrollTop = list.scrollHeight;
  }

  // ----------------- helpers -----------------
  function el(tag, attrs = {}) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    return node;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // escape first, then turn email addresses into mail links
  function linkify(s) {
    return escapeHtml(s).replace(/[\w.+-]+@[\w-]+\.[\w.]+[a-z]/gi, (m) => `<a href="mailto:${m}">${m}</a>`);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function safe(fn) {
    try {
      return fn();
    } catch {
      return null;
    }
  }

  function loadThread() {
    return safe(() => JSON.parse(sessionStorage.getItem(CFG.store))) || [];
  }

  function saveThread() {
    safe(() => sessionStorage.setItem(CFG.store, JSON.stringify(msgs.slice(-24))));
  }
})();
