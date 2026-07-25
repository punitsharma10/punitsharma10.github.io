// ============================================================
// Punit Sharma — Portfolio (preview redesign)
// Navigation, theme, sliders, scroll reveal, contact form.
// ============================================================

// ----------------- Navbar: shadow + mobile menu -----------------
const header = document.querySelector("#nav-menu");
const menuBtn = document.querySelector("#menu-icon");
const navbar = document.querySelector(".navbar");
const navOverlay = document.querySelector("#nav-overlay");

const scrollHint = document.querySelector(".scroll-down");

window.addEventListener("scroll", () => {
  header.classList.toggle("shadow", window.scrollY > 0);
  if (scrollHint) scrollHint.classList.toggle("hidden", window.scrollY > 80);
});

function setMenu(open) {
  navbar.classList.toggle("active", open);
  navOverlay.classList.toggle("show", open);
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.querySelector("i").className = open ? "bx bx-x" : "bx bx-menu";
}

menuBtn.addEventListener("click", () => {
  setMenu(!navbar.classList.contains("active"));
});

function closeMenu() {
  if (navbar.classList.contains("active")) setMenu(false);
}

// close the mobile menu when a link is chosen, the backdrop is tapped,
// or the page scrolls
navbar.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
navOverlay.addEventListener("click", closeMenu);
window.addEventListener("scroll", closeMenu, { passive: true });

// ----------------- Scrollspy: highlight active section -----------------
const spyLinks = [...document.querySelectorAll(".nav-link")].filter((a) =>
  a.getAttribute("href").startsWith("#")
);
const spySections = spyLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      spyLinks.forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id)
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
spySections.forEach((s) => spyObserver.observe(s));

// ----------------- Dark / light mode (persisted) -----------------
const darkmode = document.querySelector("#darkmode");
const themeIcon = darkmode.querySelector("i");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.className = theme === "dark" ? "bx bx-sun" : "bx bx-moon";
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    /* storage unavailable — theme just won't persist */
  }
}

let savedTheme = null;
try {
  savedTheme = localStorage.getItem("theme");
} catch (e) {}
applyTheme(savedTheme === "light" ? "light" : "dark");

darkmode.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ----------------- Scroll reveal (replays every time a section returns) -----------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("in", entry.isIntersecting);
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ----------------- Reusable slider (project carousels) -----------------
function initSlider(root) {
  const track = root.querySelector(".slider-track");
  const slides = root.querySelectorAll(".slide");
  const prev = root.querySelector(".slider-prev");
  const next = root.querySelector(".slider-next");
  const dotsWrap = root.querySelector(".slider-dots");
  let active = 0;

  // build one dot per slide
  const dots = [...slides].map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function go(index) {
    active = (index + slides.length) % slides.length;
    track.style.transform = "translateX(-" + active * 100 + "%)";
    dots.forEach((d, i) => d.classList.toggle("active", i === active));
  }

  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));

  // touch swipe
  let startX = null;
  root.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? active + 1 : active - 1);
      startX = null;
    },
    { passive: true }
  );

  go(0);
}
document.querySelectorAll("[data-slider]").forEach(initSlider);

// ----------------- Word-by-word text effect -----------------
// Words flow in one by one; replays each time the section comes back.
function splitWords(el, start, step) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((w, i) => '<span class="intro-word" style="transition-delay:' + (start + i * step) + 'ms">' + w + "</span>")
    .join(" ");
  return start + words.length * step;
}

function watchTyped(container) {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          container.classList.add("typed");
        } else if (!entry.isIntersecting) {
          // fully out of view: reset so it plays again next visit
          container.classList.remove("typed");
        }
      });
    },
    { threshold: [0, 0.3] }
  );
  obs.observe(container);
}

// About intro
const intro = document.getElementById("user-detail-intro");
if (intro) {
  intro.classList.add("wordfx");
  splitWords(intro, 0, 55);
  watchTyped(intro);
}

// ----------------- GitHub stat cards -----------------
// The shared github-readme-stats instance is unreliable — it served "cards are
// rate limited" error images and now answers 503 DEPLOYMENT_PAUSED — and those
// arrive as a *successful* image load, so an onerror fallback never fires.
// The overview card is therefore built from GitHub's own API (CORS-enabled,
// 60 requests/hour per visitor) plus the contributions API the calendar uses.
// If the streak image fails too, an equivalent card is computed locally.
(function () {
  const USER = "punitsharma10";
  const grid = document.getElementById("gh-overview-grid");
  const foot = document.getElementById("gh-overview-foot");
  if (!grid) return;

  const nf = new Intl.NumberFormat("en-US");
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const asJson = (url) =>
    fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))));

  const itemHtml = (value, label) =>
    '<div class="gh-ov-item"><div class="gh-ov-value">' + value +
    '</div><div class="gh-ov-label">' + label + "</div></div>";

  // the streak image can fail before the data lands, so remember and retry
  const streakImg = document.getElementById("github-streak-stats");
  let streakFailed = false;
  let contribData = null;
  if (streakImg) {
    streakImg.addEventListener("error", () => {
      streakFailed = true;
      if (contribData) renderStreakCard(contribData);
    });
  }

  Promise.allSettled([
    asJson("https://api.github.com/users/" + USER),
    asJson("https://github-contributions-api.jogruber.de/v4/" + USER + "?y=all"),
  ]).then(([userRes, contribRes]) => {
    const user = userRes.status === "fulfilled" ? userRes.value : null;
    const contrib = contribRes.status === "fulfilled" ? contribRes.value : null;
    if (!user) console.warn("GitHub API unavailable:", userRes.reason);
    if (!contrib) console.warn("Contributions API unavailable:", contribRes.reason);

    contribData = contrib;
    if (streakFailed && contrib) renderStreakCard(contrib);

    const totals = (contrib && contrib.total) || null;
    const year = new Date().getFullYear();
    const items = [];

    if (totals) {
      const allTime = Object.values(totals).reduce((sum, n) => sum + Number(n || 0), 0);
      items.push([nf.format(allTime), "Total contributions"]);
    }
    if (user) items.push([nf.format(user.public_repos), "Public repositories"]);
    if (totals) items.push([nf.format(Number(totals[year] || 0)), "Contributions in " + year]);
    if (user) items.push([nf.format(user.followers), "Followers"]);

    // both sources down: fall back to the summary-cards mirror
    if (!items.length) {
      const theme =
        document.documentElement.getAttribute("data-theme") === "light" ? "github" : "github_dark";
      grid.innerHTML =
        '<img src="https://github-profile-summary-cards.vercel.app/api/cards/stats?username=' +
        USER + "&theme=" + theme + '" alt="Punit Sharma\'s GitHub statistics" loading="lazy">';
      return;
    }

    grid.innerHTML = items.map((item) => itemHtml(item[0], item[1])).join("");

    if (user && user.created_at) {
      const joined = new Date(user.created_at);
      foot.textContent =
        "On GitHub since " + MONTHS[joined.getMonth()] + " " + joined.getFullYear();
    }
  });

  // locally computed streak card, used only if the streak image fails
  function renderStreakCard(data) {
    if (!streakImg || !streakImg.parentNode) return;

    // the API pads the current year with future dates, so drop anything ahead
    const today = new Date().toISOString().slice(0, 10);
    const days = (data.contributions || [])
      .filter((d) => d.date <= today)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    if (!days.length) return;

    let longest = 0;
    let run = 0;
    days.forEach((d) => {
      if (d.count > 0) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    });

    let i = days.length - 1;
    if (days[i].count === 0) i--; // today may not have contributions yet
    let current = 0;
    while (i >= 0 && days[i].count > 0) {
      current++;
      i--;
    }

    const card = document.createElement("div");
    card.className = "gh-overview-card";
    card.id = "github-streak-stats";
    card.innerHTML =
      '<h3 class="gh-overview-title">Contribution Streak</h3>' +
      '<div class="gh-overview-grid">' +
      itemHtml(nf.format(current), "Current streak") +
      itemHtml(nf.format(longest), "Longest streak") +
      "</div>";
    streakImg.parentNode.replaceChild(card, streakImg);
  }
})();

// ----------------- Toast (form feedback) -----------------
const toast = document.getElementById("toast");
let toastTimer = null;

function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle("error", Boolean(isError));
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4500);
}

// shared with the other scripts (calendar.js) — no native alert() popups
window.showToast = showToast;

// ===== Contact form -> Google Sheet (Excel) =====
// Paste the Google Apps Script Web App URL you deploy (see GOOGLE-SHEET-SETUP.md).
const SHEET_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// ----------------- Contact form: validation + dropdown + submit -----------------
(function () {
  const form = document.getElementById("contact-form");
  const sendBtn = document.getElementById("sendBtn");
  const statusEl = document.getElementById("formStatus");
  const successEl = document.getElementById("formSuccess");

  let submitting = false;      // duplicate-submission guard
  let attemptedSubmit = false; // errors show freely only after first submit try

  // ---------- validation ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s()-]{6,}$/; // lenient: optional +, digits/space/()-

  function setError(control, message) {
    const field = control.closest(".field");
    const errEl = field.querySelector(".field-error");
    const isError = Boolean(message);
    field.classList.toggle("is-error", isError);
    if (errEl) errEl.textContent = message || "";
    return !isError;
  }

  function getError(control) {
    const value = control.value.trim();
    if (control.hasAttribute("required") && !value) return "This field is required.";
    if (control.type === "email" && value && !EMAIL_RE.test(value)) return "Enter a valid email address.";
    if (control.type === "tel" && value && !PHONE_RE.test(value)) return "Enter a valid phone number, or leave it blank.";
    return "";
  }

  function validateField(control) {
    const ok = setError(control, getError(control));
    control.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  // text/email/tel/textarea controls (the dropdown is handled separately)
  const controls = [...form.querySelectorAll("input.field-input, textarea.field-input")];
  const dirty = new WeakSet(); // fields the user has actually typed in

  controls.forEach((control) => {
    control.addEventListener("input", () => {
      dirty.add(control);
      // live-clear an already-visible error as the user fixes it
      if (control.closest(".field").classList.contains("is-error")) validateField(control);
    });
    control.addEventListener("blur", () => {
      // only judge fields the user has engaged with (or after a submit try)
      if (dirty.has(control) || attemptedSubmit) validateField(control);
    });
  });

  // ---------- custom Purpose dropdown ----------
  const purposeInput = document.getElementById("fPurpose"); // hidden input (form value)
  const purposeBtn = document.getElementById("purposeBtn");
  const purposeValue = document.getElementById("purposeValue");
  const purposeMenu = document.getElementById("purposeMenu");
  const purposeField = document.getElementById("purposeField");
  const options = [...purposeMenu.querySelectorAll('[role="option"]')];
  const PURPOSE_PLACEHOLDER = "Select a purpose…";
  let activeIdx = -1;

  function validatePurpose() {
    const message = purposeInput.value ? "" : "Please select a purpose.";
    const errEl = purposeField.querySelector(".field-error");
    purposeField.classList.toggle("is-error", Boolean(message));
    purposeBtn.setAttribute("aria-invalid", String(Boolean(message)));
    if (errEl) errEl.textContent = message;
    return !message;
  }

  function setActive(idx) {
    activeIdx = idx;
    options.forEach((o, i) => o.classList.toggle("is-active", i === idx));
    if (idx >= 0) options[idx].scrollIntoView({ block: "nearest" });
  }

  function openMenu() {
    purposeMenu.hidden = false;
    purposeBtn.setAttribute("aria-expanded", "true");
    const selected = options.findIndex((o) => o.getAttribute("aria-selected") === "true");
    setActive(selected >= 0 ? selected : 0);
    purposeMenu.focus();
  }

  function closeMenu(refocus) {
    purposeMenu.hidden = true;
    purposeBtn.setAttribute("aria-expanded", "false");
    setActive(-1);
    if (refocus) purposeBtn.focus();
  }

  function selectOption(idx) {
    const opt = options[idx];
    if (!opt) return;
    options.forEach((o) => o.removeAttribute("aria-selected"));
    opt.setAttribute("aria-selected", "true");
    purposeInput.value = opt.dataset.value;
    purposeValue.textContent = opt.dataset.value;
    purposeValue.classList.remove("is-placeholder");
    validatePurpose(); // clears any visible error
    closeMenu(true);
  }

  function resetPurpose() {
    options.forEach((o) => o.removeAttribute("aria-selected"));
    purposeInput.value = "";
    purposeValue.textContent = PURPOSE_PLACEHOLDER;
    purposeValue.classList.add("is-placeholder");
  }

  purposeBtn.addEventListener("click", () => {
    purposeMenu.hidden ? openMenu() : closeMenu(true);
  });
  purposeBtn.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key) && purposeMenu.hidden) {
      e.preventDefault();
      openMenu();
    }
  });

  purposeMenu.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(activeIdx + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectOption(activeIdx); }
    else if (e.key === "Escape") { e.preventDefault(); closeMenu(true); }
    else if (e.key === "Tab") { closeMenu(false); }
  });

  options.forEach((opt, i) => {
    opt.addEventListener("click", () => selectOption(i));
    opt.addEventListener("mousemove", () => setActive(i));
  });

  // click outside closes the menu
  document.addEventListener("click", (e) => {
    if (!purposeMenu.hidden && !purposeField.contains(e.target)) closeMenu(false);
  });

  function validateAll() {
    let firstBad = null;
    controls.forEach((control) => {
      if (!validateField(control) && !firstBad) firstBad = control;
    });
    if (!validatePurpose() && !firstBad) firstBad = purposeBtn;
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function showFormError() {
    statusEl.className = "form-status bad";
    statusEl.textContent = "❌ Something went wrong. Please try again later.";
    statusEl.hidden = false;
    form.classList.add("has-status"); // textarea shrinks to absorb the banner
  }

  // ---------- submit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions
    statusEl.hidden = true;
    form.classList.remove("has-status");
    attemptedSubmit = true;

    if (!validateAll()) {
      showToast("Please fix the highlighted fields.", true);
      return;
    }

    // trimmed payload
    const payload = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      purpose: purposeInput.value,
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };

    submitting = true;
    sendBtn.classList.add("is-sending");
    sendBtn.disabled = true;
    sendBtn.querySelector(".send-label").textContent = "Sending…";

    // 1) Save the submission to the Google Sheet (Excel)
    let sheetRequest = Promise.resolve(null);
    if (SHEET_ENDPOINT && !SHEET_ENDPOINT.startsWith("PASTE_")) {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("company", payload.company);
      formData.append("purpose", payload.purpose);
      formData.append("subject", payload.subject);
      formData.append("message", payload.message);

      // no-cors: Apps Script accepts the POST but returns an opaque response
      sheetRequest = fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
    } else {
      console.warn("SHEET_ENDPOINT not set yet — skipping Google Sheet save.");
    }

    // 2) Send the details to my inbox via EmailJS.
    // The template shows purpose/company/subject as dedicated fields.
    const emailData = {
      service_id: "service_9v834wh",
      template_id: "template_x9h8bwc",
      user_id: "vq8LuzjZGXIdvLcXA",
      template_params: {
        // params for the default EmailJS template ({{name}}, {{email}}, {{title}}, {{time}})
        name: payload.name,
        email: payload.email,
        title: payload.subject,
        time: new Date().toLocaleString("en-IN"),
        // richer params — add these to the template to show them as fields
        from_name: payload.name,
        to_name: "Punit",
        from_email: payload.email,
        phone: payload.phone || "—",
        company: payload.company || "—",
        purpose: payload.purpose,
        subject: payload.subject,
        message: payload.message,
      },
    };

    const emailRequest = fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      body: JSON.stringify(emailData),
      headers: {
        "Content-type": "application/json",
      },
    });

    try {
      const [sheetResult, emailResult] = await Promise.allSettled([
        sheetRequest,
        emailRequest,
      ]);

      // fetch only rejects on network errors, so check the HTTP status too
      let emailOk = false;
      if (emailResult.status === "fulfilled") {
        const res = emailResult.value;
        emailOk = res.ok;
        if (!res.ok) {
          const body = await res.text();
          console.error("EmailJS failed:", res.status, body);
        }
      } else {
        console.error("EmailJS request error:", emailResult.reason);
      }

      console.log("Sheet:", sheetResult.status, "| Email ok:", emailOk);

      if (emailOk) {
        // swap the form for the success card — same space, so the
        // panel height stays constant and the left column never shifts
        form.reset();
        resetPurpose();
        attemptedSubmit = false;
        controls.forEach((c) => {
          c.closest(".field").classList.remove("is-error");
          c.removeAttribute("aria-invalid");
        });
        purposeField.classList.remove("is-error");
        form.hidden = true;
        successEl.hidden = false;
        showToast("Message sent — thanks for reaching out!");
      } else {
        showFormError();
        showToast("Couldn't send your message. Please try again later.", true);
      }
    } catch (err) {
      console.error(err);
      showFormError();
    } finally {
      submitting = false;
      sendBtn.classList.remove("is-sending");
      sendBtn.disabled = false;
      sendBtn.querySelector(".send-label").textContent = "Send Message";
    }
  });

  // ---------- "Send another message" returns to a fresh form ----------
  document.getElementById("sendAnother").addEventListener("click", () => {
    successEl.hidden = true;
    form.hidden = false;
    document.getElementById("fName").focus();
  });

  // ---------- Calendly CTA (placeholder for future integration) ----------
  document.querySelector("[data-calendly]").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Calendly booking coming soon — email me for now!");
  });
})();
