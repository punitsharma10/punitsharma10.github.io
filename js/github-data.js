// ============================================================
// GitHub data layer — one resilient source for every GitHub card
// ============================================================
// The cards used to embed third-party *images* (github-readme-stats,
// streak-stats). When one of those services throttles or shuts down it
// answers with an error picture that still loads successfully, so the page
// silently shows "ERROR!!!" and no onerror handler can recover from it.
//
// Everything is built from JSON now, behind three safety nets:
//   1. several independent endpoints, tried in order
//   2. successful payloads cached in localStorage, so a repeat visit within
//      CACHE_FRESH_MS needs no network at all
//   3. a stale cache is served if every endpoint is unreachable
//
// Each request is made once and shared, so main.js and calendar.js no longer
// download the same contribution history twice.

window.ghData = (function () {
  const USER = "punitsharma10";
  const CACHE_FRESH_MS = 6 * 60 * 60 * 1000; // refetch at most every 6 hours
  const REQUEST_TIMEOUT_MS = 9000; // a hung endpoint must not stall the chain

  // ---------------- localStorage cache (never fatal) ----------------
  function readCache(key) {
    try {
      const entry = JSON.parse(localStorage.getItem(key));
      return entry && entry.at && entry.data ? entry : null;
    } catch (e) {
      return null; // unavailable or corrupt — just treat it as a miss
    }
  }

  function writeCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch (e) {
      /* private mode or quota exceeded — caching is optional */
    }
  }

  // ---------------- fetch helpers ----------------
  function getJson(url) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
      });
  }

  // try each source in order; resolve with the first one that works
  function firstWorking(sources) {
    return sources.reduce(
      (chain, source) =>
        chain.catch((err) => {
          if (err && err.__tried) console.warn("GitHub data: " + err.__tried + " unavailable —", err.message);
          return getJson(source.url)
            .then(source.parse)
            .then((data) => Object.assign(data, { source: source.name, stale: false }))
            .catch((cause) => {
              cause.__tried = source.name;
              throw cause;
            });
        }),
      Promise.reject(Object.assign(new Error("start"), { __tried: null }))
    );
  }

  // cache-first, then network, then stale cache
  function loadCached(key, sources) {
    const hit = readCache(key);
    if (hit && Date.now() - hit.at < CACHE_FRESH_MS) {
      return Promise.resolve(Object.assign({}, hit.data, { source: "cache", stale: false }));
    }

    return firstWorking(sources)
      .then((data) => {
        writeCache(key, data);
        return data;
      })
      .catch((err) => {
        if (hit) {
          console.warn("GitHub data: every source failed, showing cached copy —", err.message);
          return Object.assign({}, hit.data, { source: "cache", stale: true });
        }
        throw err;
      });
  }

  // ---------------- contribution history ----------------
  // Normalised shape: { total: { year: count }, contributions: [{date, count, level}] }
  const CONTRIBUTION_SOURCES = [
    {
      name: "jogruber",
      url: "https://github-contributions-api.jogruber.de/v4/" + USER + "?y=all",
      parse: (raw) => ({
        total: raw.total || {},
        contributions: (raw.contributions || []).map((day) => ({
          date: day.date,
          count: Number(day.count) || 0,
          level: Number(day.level) || 0,
        })),
      }),
    },
    {
      // rolling 12 months only, and weeks arrive nested — good enough as a backup
      name: "rschristian",
      url: "https://gh-calendar.rschristian.dev/user/" + USER,
      parse: (raw) => {
        const days = (raw.contributions || []).flat().map((day) => ({
          date: day.date,
          count: Number(day.count) || 0,
          level: Number(day.intensity) || 0,
        }));
        const total = {};
        days.forEach((day) => {
          const year = day.date.slice(0, 4);
          total[year] = (total[year] || 0) + day.count;
        });
        return { total, contributions: days };
      },
    },
  ];

  // ---------------- profile counts ----------------
  const PROFILE_SOURCES = [
    {
      name: "github-api",
      url: "https://api.github.com/users/" + USER,
      parse: (raw) => ({
        public_repos: Number(raw.public_repos) || 0,
        followers: Number(raw.followers) || 0,
        following: Number(raw.following) || 0,
        created_at: raw.created_at || "",
      }),
    },
  ];

  let contributionsPromise = null;
  let profilePromise = null;

  return {
    user: USER,

    // Promise<{ total, contributions, source, stale }>
    contributions() {
      if (!contributionsPromise) {
        contributionsPromise = loadCached("gh:contrib:" + USER, CONTRIBUTION_SOURCES);
      }
      return contributionsPromise;
    },

    // Promise<{ public_repos, followers, following, created_at, source, stale }>
    profile() {
      if (!profilePromise) {
        profilePromise = loadCached("gh:profile:" + USER, PROFILE_SOURCES);
      }
      return profilePromise;
    },

    // days up to today, ascending — the APIs pad the year with future dates
    daysToDate(data) {
      const today = new Date().toISOString().slice(0, 10);
      return (data.contributions || [])
        .filter((day) => day.date <= today)
        .sort((a, b) => (a.date < b.date ? -1 : 1));
    },
  };
})();
