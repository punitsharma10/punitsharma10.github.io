// ============================================================

// Shared behaviour: navbar, scrollspy, theme, scroll reveal, toast.

// Each page section's own script lives in sections/<name>/<name>.js.

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
