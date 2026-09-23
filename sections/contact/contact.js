// Contact: form validation, the purpose dropdown and submit to the Google Sheet.
// Uses window.showToast from js/main.js.

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
