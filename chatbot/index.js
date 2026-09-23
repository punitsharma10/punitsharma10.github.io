// ============================================================
// PunitBot — mount point for the chatbot feature.
// The page (layout.html) includes only this file:
//
//   <script src="./chatbot/index.js" defer></script>
//
// It loads the feature's own stylesheet, knowledge and panel, all from this
// folder, so nothing else in the site needs to know the chatbot exists.
// Remove that one line and the feature is gone.
// ============================================================
(function mountPunitBot() {
  const CONFIG = {
    // the Cloudflare Worker that talks to the AI (see worker/)
    endpoint: "https://punitbot.punitsharma10.workers.dev/ask",
  };

  // resolve files next to this script, wherever the folder is served from
  const base = new URL(".", document.currentScript.src).href;
  window.PUNITBOT_ENDPOINT = window.PUNITBOT_ENDPOINT || CONFIG.endpoint;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = base + "chatbot.css";
  document.head.append(css);

  const load = (file) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = base + file;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`chatbot: could not load ${file}`));
      document.body.append(s);
    });

  // the panel reads window.PUNITBOT_KNOWLEDGE, so knowledge goes first
  load("knowledge.js")
    .then(() => load("chatbot.js"))
    .catch((e) => console.warn(e.message));
})();
