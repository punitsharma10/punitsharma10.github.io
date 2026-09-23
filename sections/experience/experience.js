// Experience: fills each role's duration from its data-start / data-end.

// ----------------- Role durations -----------------
// Computes "1 yr 5 mos" from data-start / data-end on .xp-date so a
// current role's duration never goes stale the way hard-coded text would.
(function durations() {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function parse(value) {
    if (!value || value === "present") {
      const now = new Date();
      return { y: now.getFullYear(), m: now.getMonth() };
    }
    const [year, month] = value.split("-");
    return { y: Number(year), m: Number(month) - 1 };
  }

  function label(months) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(years + (years === 1 ? " yr" : " yrs"));
    if (rest || !years) parts.push(rest + (rest === 1 ? " mo" : " mos"));
    return parts.join(" ");
  }

  document.querySelectorAll(".xp-date").forEach((dateEl) => {
    const start = parse(dateEl.dataset.start);
    const end = parse(dateEl.dataset.end);
    let months = (end.y - start.y) * 12 + (end.m - start.m);
    // a job spanning Jun 2023 - Jan 2024 reads as 8 months, counting both
    // endpoint months the way a resume does; education spans stay exact
    if (dateEl.dataset.round !== "exact") months += 1;
    if (months < 0) months = 0;

    const out = dateEl.parentElement.querySelector(".xp-duration");
    if (out) out.textContent = label(months);

    // keep the visible range honest if the markup and the data ever drift
    if (dateEl.dataset.end === "present") {
      dateEl.textContent = MONTHS[start.m] + " " + start.y + " — Present";
    }
  });
})();
