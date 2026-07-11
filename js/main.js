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

// ----------------- GitHub stat cards: rate-limit fallback -----------------
// The shared github-readme-stats instance often returns 503 (rate limited).
// If a card fails to load, swap it for the summary-cards mirror service.
(function () {
  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  const fallbacks = {
    "github-stats-card": () =>
      "https://github-profile-summary-cards.vercel.app/api/cards/stats?username=punitsharma10&theme=" +
      (isLight() ? "github" : "github_dark"),
  };
  Object.keys(fallbacks).forEach((id) => {
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener("error", () => {
      const fallback = fallbacks[id]();
      if (img.src !== fallback) img.src = fallback;
    });
  });
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

// ----------------- Contact form: floating labels -----------------
const inputs = document.querySelectorAll(".input");

function focusFunc() {
  this.parentNode.classList.add("focus");
}

function blurFunc() {
  if (this.value === "") this.parentNode.classList.remove("focus");
}

inputs.forEach((input) => {
  input.addEventListener("focus", focusFunc);
  input.addEventListener("blur", blurFunc);
});

// ===== Contact form -> Google Sheet (Excel) =====
// Paste the Google Apps Script Web App URL you deploy (see GOOGLE-SHEET-SETUP.md).
const SHEET_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactPhone = document.getElementById("contactPhone");
const contactMessage = document.getElementById("contactMessage");

const contactSubmit = document.getElementById("contactSubmit");
contactSubmit.onclick = async (e) => {
  e.preventDefault();

  if (!contactName.value || !contactEmail.value) {
    showToast("Please enter at least your name and email.", true);
    return;
  }

  const phoneValue = contactPhone ? contactPhone.value : "";

  contactSubmit.value = "Sending…";
  contactSubmit.disabled = true;

  // 1) Save the submission to the Google Sheet (Excel)
  let sheetRequest = Promise.resolve(null);
  if (SHEET_ENDPOINT && !SHEET_ENDPOINT.startsWith("PASTE_")) {
    const formData = new FormData();
    formData.append("name", contactName.value);
    formData.append("email", contactEmail.value);
    formData.append("phone", phoneValue);
    formData.append("message", contactMessage.value);

    // no-cors: Apps Script accepts the POST but returns an opaque response
    sheetRequest = fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
  } else {
    console.warn("SHEET_ENDPOINT not set yet — skipping Google Sheet save.");
  }

  // 2) Also send the details to my inbox via EmailJS
  const emailData = {
    service_id: "service_icbqhz9",
    template_id: "template_eminqhk",
    user_id: "ta-WWGEIz_7x47NNm",
    template_params: {
      from_name: contactName.value,
      to_name: "Punit",
      message: contactMessage.value,
      from_email: contactEmail.value,
      phone: phoneValue,
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
      showToast("Thanks for reaching out! Your details have been recorded.");
      contactName.value = "";
      contactEmail.value = "";
      if (contactPhone) contactPhone.value = "";
      contactMessage.value = "";
      inputs.forEach((input) => input.parentNode.classList.remove("focus"));
    } else {
      showToast("Sorry, the message couldn't be sent. Please try again later.", true);
    }
  } catch (err) {
    console.log(err);
    showToast("Something went wrong. Please try again later.", true);
  } finally {
    contactSubmit.value = "Send";
    contactSubmit.disabled = false;
  }
};
