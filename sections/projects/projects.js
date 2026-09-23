// Projects: the image slider on each project card (markup: [data-slider]).

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
