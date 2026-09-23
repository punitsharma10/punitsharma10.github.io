// ============================================================
// About (hero) — the years counter and the rotating "I build …" phrase.
// Loaded by index.html with defer; markup is <section id="about" class="hero">.
// ============================================================
(function hero() {
  // whole years since the first full-time role (Jun 2023), so it never goes stale
  const yearsEl = document.getElementById("hero-years");
  if (yearsEl) {
    const start = new Date(2023, 5, 1);
    const years = Math.floor((Date.now() - start) / (365.25 * 864e5));
    yearsEl.textContent = String(Math.max(1, years));
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // typewriter over a few phrases; the first one is already in the HTML
  const rotator = document.getElementById("role-rotator");
  const phrases = ["full-stack products", "AI-powered features", "real-time systems", "scalable REST APIs"];
  if (rotator && !reduced) {
    let i = 0;
    let text = phrases[0];
    let deleting = true;
    const tick = () => {
      if (deleting) {
        text = text.slice(0, -1);
        if (!text) {
          deleting = false;
          i = (i + 1) % phrases.length;
        }
      } else {
        text = phrases[i].slice(0, text.length + 1);
        if (text === phrases[i]) {
          deleting = true;
          rotator.textContent = text;
          setTimeout(tick, 2200);
          return;
        }
      }
      rotator.textContent = text;
      setTimeout(tick, deleting ? 35 : 70);
    };
    setTimeout(tick, 2600);
  }
})();
