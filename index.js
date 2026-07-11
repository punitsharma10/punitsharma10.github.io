let header = document.querySelector("header");
let menu = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  header.classList.toggle("shadow", window.scrollY > 0);
});

menu.onclick = () => {
  navbar.classList.toggle("active");
};
window.onscroll = () => {
  navbar.classList.remove("active");
};

// Dark Mode / light mode
let darkmode = document.querySelector("#darkmode");

darkmode.onclick = () => {
  if (darkmode.classList.contains("bx-sun")) {
    darkmode.classList.replace("bx-sun", "bx-moon");
    document.body.classList.add("active");
  } else {
    darkmode.classList.replace("bx-moon", "bx-sun");
    document.body.classList.remove("active");
  }
};

const resume = document.getElementById("resume-button-1");
resume.onclick = (e) => {
    window.open("./Media/Punit-Sharma-Resume.pdf")
}

const containerResume = document.getElementById("resume-button-2");
containerResume.onclick = (e) => {
    window.open("./Media/Punit-Sharma-Resume.pdf")
}
                          

const inputs = document.querySelectorAll(".input");

function focusFunc() {
  let parent = this.parentNode;
  parent.classList.add("focus");
}

function blurFunc() {
  let parent = this.parentNode;
  if (this.value == "") {
    parent.classList.remove("focus");
  }
}

inputs.forEach((input) => {
  input.addEventListener("focus", focusFunc);
  input.addEventListener("blur", blurFunc);
});


// ===== Contact form -> Google Sheet (Excel) =====
// Paste the Google Apps Script Web App URL you deploy (see setup steps).
const SHEET_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactPhone = document.getElementById("contactPhone");
const contactMessage = document.getElementById("contactMessage");

const contactSubmit = document.getElementById("contactSubmit");
contactSubmit.onclick = async (e) => {
  e.preventDefault();

  if (!contactName.value || !contactEmail.value) {
    alert("Please enter at least your name and email.");
    return;
  }

  const phoneValue = contactPhone ? contactPhone.value : "";

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
      alert("Thanks for reaching out! Your details have been recorded.");
      contactName.value = "";
      contactEmail.value = "";
      if (contactPhone) contactPhone.value = "";
      contactMessage.value = "";
    } else {
      alert("Sorry, the message couldn't be sent. Please try again later.");
    }
  } catch (err) {
    console.log(err);
    alert("Something went wrong. Please try again later.");
  }
};