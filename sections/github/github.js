// GitHub: the profile and language stat cards (data from github-data.js).

// ----------------- GitHub stat cards -----------------
// Both cards are rendered from JSON here rather than embedded as third-party
// images: see github-data.js (same folder) for why, and for the fallback/cache chain.
(function () {
  const grid = document.getElementById("gh-overview-grid");
  const foot = document.getElementById("gh-overview-foot");
  const streakBody = document.getElementById("gh-streak-body");
  if (!grid || !window.ghData) return;

  const nf = new Intl.NumberFormat("en-US");
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // "2023-06-25" -> "Jun 25, 2023" (the year is dropped for the current year)
  function shortDate(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    const label = MONTHS_SHORT[Number(month) - 1] + " " + Number(day);
    return Number(year) === new Date().getFullYear() ? label : label + ", " + year;
  }

  function dateRange(from, to) {
    if (!from) return "—";
    return from === to ? shortDate(from) : shortDate(from) + " – " + shortDate(to);
  }

  function failed(el, what) {
    el.innerHTML = '<p class="gh-overview-status">' + what + " couldn't be loaded right now.</p>";
  }

  // ---------------- overview card ----------------
  Promise.allSettled([window.ghData.contributions(), window.ghData.profile()])
    .then(([contribRes, profileRes]) => {
      const contrib = contribRes.status === "fulfilled" ? contribRes.value : null;
      const profile = profileRes.status === "fulfilled" ? profileRes.value : null;

      const totals = contrib && contrib.total;
      const year = new Date().getFullYear();
      const items = [];

      if (totals) {
        const allTime = Object.values(totals).reduce((sum, n) => sum + Number(n || 0), 0);
        items.push([nf.format(allTime), "Total contributions"]);
      }
      if (profile) items.push([nf.format(profile.public_repos), "Public repositories"]);
      if (totals) items.push([nf.format(Number(totals[year] || 0)), "Contributions in " + year]);
      if (profile) items.push([nf.format(profile.followers), "Followers"]);

      if (!items.length) {
        failed(grid, "GitHub stats");
        return;
      }

      grid.innerHTML = items
        .map((item) =>
          '<div class="gh-ov-item"><div class="gh-ov-value">' + item[0] +
          '</div><div class="gh-ov-label">' + item[1] + "</div></div>")
        .join("");

      if (profile && profile.created_at) {
        const joined = new Date(profile.created_at);
        foot.textContent =
          "On GitHub since " + MONTHS_LONG[joined.getMonth()] + " " + joined.getFullYear();
      }
    });

  // ---------------- streak card ----------------
  if (!streakBody) return;

  Promise.all([window.ghData.contributions(), window.ghData.profile().catch(() => null)])
    .then(([contrib, profile]) => {
      const days = window.ghData.daysToDate(contrib);
      if (!days.length) {
        failed(streakBody, "Streak data");
        return;
      }

      // longest run of consecutive active days, and when it happened
      let longest = 0;
      let longestFrom = "";
      let longestTo = "";
      let run = 0;
      let runFrom = "";
      days.forEach((day) => {
        if (day.count > 0) {
          if (run === 0) runFrom = day.date;
          run++;
          if (run > longest) {
            longest = run;
            longestFrom = runFrom;
            longestTo = day.date;
          }
        } else {
          run = 0;
        }
      });

      // current run, walking backwards; today may legitimately be empty still
      let i = days.length - 1;
      if (days[i].count === 0) i--;
      let current = 0;
      let currentFrom = "";
      const currentTo = i >= 0 && days[i].count > 0 ? days[i].date : "";
      while (i >= 0 && days[i].count > 0) {
        currentFrom = days[i].date;
        current++;
        i--;
      }

      const total = days.reduce((sum, day) => sum + day.count, 0);
      // the account creation date is the honest start of the "total" range
      const startedOn = profile && profile.created_at
        ? profile.created_at.slice(0, 10)
        : days[0].date;

      streakBody.innerHTML =
        '<div class="gh-streak-col">' +
          '<div class="gh-streak-num">' + nf.format(total) + "</div>" +
          '<div class="gh-streak-label">Total Contributions</div>' +
          '<div class="gh-streak-sub">' + shortDate(startedOn) + " – Present</div>" +
        "</div>" +
        '<div class="gh-streak-col">' +
          '<div class="gh-streak-ring">' +
            '<span class="gh-streak-fire"><i class="bx bxs-flame"></i></span>' +
            '<span class="gh-streak-ring-num">' + nf.format(current) + "</span>" +
          "</div>" +
          '<div class="gh-streak-label gh-streak-label-accent">Current Streak</div>' +
          '<div class="gh-streak-sub">' + (currentTo ? dateRange(currentFrom, currentTo) : "—") + "</div>" +
        "</div>" +
        '<div class="gh-streak-col">' +
          '<div class="gh-streak-num">' + nf.format(longest) + "</div>" +
          '<div class="gh-streak-label">Longest Streak</div>' +
          '<div class="gh-streak-sub">' + dateRange(longestFrom, longestTo) + "</div>" +
        "</div>";
    })
    .catch(() => failed(streakBody, "Streak data"));
})();
