// ============================================================
// Contact — Redesign Preview v3 (behaviour)
// Send is SIMULATED (no backend). On merge, the marked block is
// replaced with the real EmailJS call from js/main.js.
//
// v3 changes:
//   - custom Purpose dropdown (themed menu; native select popups
//     can't be styled). Full keyboard + ARIA listbox support.
//   - message field stretches so the panel has no dead space.
// ============================================================

(function () {
  const form = document.getElementById("contact-form");
  const sendBtn = document.getElementById("sendBtn");
  const statusEl = document.getElementById("formStatus");
  const successEl = document.getElementById("formSuccess");
  const toast = document.getElementById("toast");

  let submitting = false;      // duplicate-submission guard
  let attemptedSubmit = false; // errors show freely only after first submit try

  // ---------- toast (matches the live site's showToast contract) ----------
  let toastTimer = null;
  function showToast(message, isError) {
    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4500);
  }

  // ---------- validation ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s()-]{6,}$/; // lenient: optional +, digits/space/()- , min length

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
    const field = purposeField;
    const errEl = field.querySelector(".field-error");
    field.classList.toggle("is-error", Boolean(message));
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

    try {
      // ===== PREVIEW: simulated send =====================================
      // On merge this block becomes the real EmailJS fetch from js/main.js
      // (service_icbqhz9 / template_eminqhk) using `payload`. Reminder: the
      // EmailJS *template* must be updated in its dashboard to display the
      // new company / purpose / subject params.
      const willFail = document.getElementById("demo-fail").checked;
      await new Promise((r) => setTimeout(r, 1200));
      const ok = !willFail;
      // ===================================================================

      if (ok) {
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
        console.log("Would send payload:", payload);
      } else {
        statusEl.className = "form-status bad";
        statusEl.innerHTML = "❌ Something went wrong. Please try again later.";
        statusEl.hidden = false;
        form.classList.add("has-status"); // textarea shrinks to absorb the banner
        showToast("Couldn't send your message. Please try again later.", true);
      }
    } catch (err) {
      console.error(err);
      statusEl.className = "form-status bad";
      statusEl.innerHTML = "❌ Something went wrong. Please try again later.";
      statusEl.hidden = false;
      form.classList.add("has-status");
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

  // ---------- PREVIEW-ONLY: theme toggle ----------
  document.getElementById("demo-theme").addEventListener("click", () => {
    const root = document.documentElement;
    root.setAttribute("data-theme", root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
})();
