// ===== Custom GitHub contribution calendar with year filter + date-range popup =====
// Data source: jogruber's contributions API (CORS-friendly, no token needed).

(function () {
  const USERNAME = "punitsharma10";
  const API = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=all`;

  const RANGE_OPT = "__range"; // dropdown value that opens the popup
  const CUSTOM_OPT = "__custom"; // dynamic option showing the chosen range

  const yearSelect = document.getElementById("gh-year-select");
  const popup = document.getElementById("gh-range-popup");
  const fromInput = document.getElementById("gh-from");
  const toInput = document.getElementById("gh-to");
  const applyBtn = document.getElementById("gh-range-apply");
  const cancelBtn = document.getElementById("gh-range-cancel");
  const statsEl = document.getElementById("gh-stats");
  const calEl = document.getElementById("gh-calendar");

  let allDays = []; // [{date:'YYYY-MM-DD', count, level}], sorted ascending
  let lastYear = null; // remember last year selection for cancel
  let currentFrom = "";
  let currentTo = ""; // remember current range so we can redraw on resize

  // Calendar pickers (click a date) that also allow typing manually.
  // Shown as dd/mm/yyyy, while the underlying value stays Y-m-d for filtering.
  const fpOpts = {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    allowInput: true,
    disableMobile: true,
  };
  const fpFrom = flatpickr(fromInput, fpOpts);
  const fpTo = flatpickr(toInput, fpOpts);

  // "2023-08-03" -> "03/08/2023" (dd/mm/yyyy)
  function toMDY(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  // ---- Fetch all contributions once ----
  fetch(API)
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      allDays = (data.contributions || []).sort((a, b) =>
        a.date < b.date ? -1 : 1
      );
      if (!allDays.length) {
        renderNoData("", "");
        return;
      }
      buildDropdown();
      const years = yearList();
      // default to the current year, otherwise the newest year with data
      const currentYear = String(new Date().getFullYear());
      const def = years.includes(currentYear) ? currentYear : years[0];
      lastYear = def;
      yearSelect.value = def;
      applyYear(def);
    })
    .catch((err) => {
      console.error("Calendar load failed:", err);
      calEl.innerHTML =
        '<p class="gh-status">Couldn\'t load contributions right now.</p>';
    });

  function yearList() {
    const set = new Set(allDays.map((d) => d.date.slice(0, 4)));
    return [...set].sort().reverse(); // newest first
  }

  function buildDropdown() {
    yearSelect.innerHTML = "";
    yearList().forEach((y) => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    });
    const rangeOpt = document.createElement("option");
    rangeOpt.value = RANGE_OPT;
    rangeOpt.textContent = "📅 Date range…";
    yearSelect.appendChild(rangeOpt);
  }

  // ---- Filtering ----
  function applyYear(year) {
    lastYear = year;
    render(`${year}-01-01`, `${year}-12-31`);
  }

  function render(from, to) {
    currentFrom = from;
    currentTo = to;
    const days = allDays.filter((d) => d.date >= from && d.date <= to);
    const hasData = days.some((d) => d.count > 0);

    if (!days.length || !hasData) {
      renderNoData(from, to);
      return;
    }
    renderStats(days, from, to);
    renderHeatmap(days);
  }

  // ---- No-data screen (inside the border) ----
  function renderNoData(from, to) {
    statsEl.innerHTML = "";
    const range = from && to ? `${toMDY(from)} → ${toMDY(to)}` : "this selection";
    calEl.innerHTML = `
      <div class="gh-nodata">
        <div class="gh-nodata-icon">📭</div>
        <div class="gh-nodata-title">No data found</div>
        <div class="gh-nodata-sub">No contributions recorded for ${range}.</div>
      </div>`;
  }

  // ---- Stats ----
  function renderStats(days, from, to) {
    const total = days.reduce((s, d) => s + d.count, 0);
    const activeDays = days.filter((d) => d.count > 0).length;
    const best = days.reduce(
      (m, d) => (d.count > m.count ? d : m),
      { count: 0, date: "" }
    );

    let longest = 0,
      run = 0,
      longestEnd = "";
    for (const d of days) {
      if (d.count > 0) {
        run++;
        if (run > longest) {
          longest = run;
          longestEnd = d.date; // last day of the longest streak so far
        }
      } else {
        run = 0;
      }
    }

    const cards = [
      {
        label: "Total contributions",
        value: total,
        sub: `${toMDY(from)} → ${toMDY(to)}`,
      },
      { label: "Active days", value: activeDays, sub: `of ${days.length} days` },
      { label: "Best day", value: best.count, sub: toMDY(best.date) || "—" },
      {
        label: "Longest streak",
        value: longest,
        sub: longest > 0 ? `ends ${toMDY(longestEnd)}` : "—",
      },
    ];

    statsEl.innerHTML = cards
      .map(
        (c) => `
        <div class="gh-stat-card">
          <div class="gh-stat-label">${c.label}</div>
          <div class="gh-stat-value">${c.value}</div>
          <div class="gh-stat-sub">${c.sub}</div>
        </div>`
      )
      .join("");
  }

  // ---- Heatmap ----
  function renderHeatmap(days) {
    const grid = document.createElement("div");
    grid.className = "gh-grid";

    const firstDow = new Date(days[0].date + "T00:00:00").getDay();

    // size cells so the grid fills the available width (no empty right gap)
    const columns = Math.ceil((firstDow + days.length) / 7);
    const gap = 3;
    const labelW = 34; // gutter for the Mon/Wed/Fri labels
    const avail = (calEl.clientWidth || 900) - labelW;
    let cell = Math.floor((avail - (columns - 1) * gap) / columns);
    cell = Math.max(11, Math.min(cell, 26));

    const wrap = document.createElement("div");
    wrap.className = "gh-cal-wrap";
    wrap.style.setProperty("--gh-cell", cell + "px");

    // month labels along the top (like GitHub's graph)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = document.createElement("div");
    months.className = "gh-months";
    let lastMonth = -1;
    let lastLabelCol = -10;
    days.forEach((d, i) => {
      const m = parseInt(d.date.slice(5, 7), 10) - 1;
      if (m !== lastMonth) {
        lastMonth = m;
        const col = Math.floor((firstDow + i) / 7);
        // skip labels that would overlap the previous one
        if (col - lastLabelCol >= 3 && col < columns - 1) {
          const span = document.createElement("span");
          span.textContent = monthNames[m];
          span.style.left = col * (cell + gap) + "px";
          months.appendChild(span);
          lastLabelCol = col;
        }
      }
    });

    // weekday labels down the left
    const wdays = document.createElement("div");
    wdays.className = "gh-wdays";
    ["", "Mon", "", "Wed", "", "Fri", ""].forEach((t) => {
      const s = document.createElement("span");
      s.textContent = t;
      wdays.appendChild(s);
    });

    for (let i = 0; i < firstDow; i++) {
      const pad = document.createElement("div");
      pad.className = "gh-day";
      pad.style.visibility = "hidden";
      grid.appendChild(pad);
    }

    days.forEach((d) => {
      const cell = document.createElement("div");
      cell.className = "gh-day";
      cell.setAttribute("data-level", d.level);
      cell.title = `${d.count} contribution${d.count === 1 ? "" : "s"} on ${toMDY(d.date)}`;
      grid.appendChild(cell);
    });

    const body = document.createElement("div");
    body.className = "gh-body";
    body.appendChild(wdays);
    body.appendChild(grid);

    wrap.appendChild(months);
    wrap.appendChild(body);

    calEl.innerHTML = "";
    calEl.appendChild(wrap);

    const legend = document.createElement("div");
    legend.className = "gh-legend";
    legend.innerHTML =
      'Less <span class="gh-day" data-level="0"></span>' +
      '<span class="gh-day" data-level="1"></span>' +
      '<span class="gh-day" data-level="2"></span>' +
      '<span class="gh-day" data-level="3"></span>' +
      '<span class="gh-day" data-level="4"></span> More';
    calEl.appendChild(legend);
  }

  // ---- Dropdown / popup behaviour ----
  yearSelect.addEventListener("change", () => {
    if (yearSelect.value === RANGE_OPT) {
      openPopup();
    } else if (yearSelect.value !== CUSTOM_OPT) {
      applyYear(yearSelect.value);
    }
  });

  function openPopup() {
    // sensible defaults for the inputs
    if (lastYear) {
      if (!fromInput.value) fpFrom.setDate(`${lastYear}-01-01`, true);
      if (!toInput.value) fpTo.setDate(`${lastYear}-12-31`, true);
    }
    popup.hidden = false;
  }

  function closePopup() {
    popup.hidden = true;
  }

  cancelBtn.addEventListener("click", () => {
    closePopup();
    // restore the dropdown to the last valid year
    if (lastYear) yearSelect.value = lastYear;
  });

  applyBtn.addEventListener("click", () => {
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to || from > to) {
      // styled site toast instead of the native alert popup
      if (window.showToast) {
        window.showToast("Please pick a valid range (From must be on or before To).", true);
      }
      return;
    }
    closePopup();
    setCustomOption(`${from} → ${to}`);
    render(from, to);
  });

  // adds/updates a dropdown option that shows the chosen custom range
  function setCustomOption(label) {
    let opt = yearSelect.querySelector(`option[value="${CUSTOM_OPT}"]`);
    if (!opt) {
      opt = document.createElement("option");
      opt.value = CUSTOM_OPT;
      yearSelect.insertBefore(opt, yearSelect.firstChild);
    }
    opt.textContent = label;
    yearSelect.value = CUSTOM_OPT;
  }

  // redraw the heatmap to fit when the window is resized
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (!currentFrom || !currentTo) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(currentFrom, currentTo), 150);
  });

  // close popup when clicking outside it
  document.addEventListener("click", (e) => {
    if (popup.hidden) return;
    // ignore clicks inside the flatpickr calendar (it's appended to <body>)
    if (e.target.closest && e.target.closest(".flatpickr-calendar")) return;
    const wrap = document.querySelector(".gh-filter-wrap");
    if (wrap && !wrap.contains(e.target)) {
      closePopup();
      if (lastYear) yearSelect.value = lastYear;
    }
  });
})();
