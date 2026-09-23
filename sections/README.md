# Page sections

Every section of the page has its own folder here. To change how a section
looks or behaves, open its folder — nothing else needs to change.

| Section (nav)  | Folder         | Files                                                        |
|----------------|----------------|--------------------------------------------------------------|
| About          | `about/`       | `about.css`, `about.js` (years counter, rotating role)        |
| Experience     | `experience/`  | `experience.css`, `experience.js` (role durations)           |
| Skills         | `skills/`      | `skills.css`                                                 |
| Projects       | `projects/`    | `projects.css`, `projects.js` (image sliders)                |
| GitHub         | `github/`      | `github.css`, `github.js`, `github-data.js`, `calendar.css`, `calendar.js` |
| Education      | `education/`   | `education.css`                                              |
| Contact        | `contact/`     | `contact.css`, `contact.js` (form, dropdown, Google Sheet)   |

The chatbot is a feature rather than a section, so it lives in `/chatbot`.

## What is not in a section folder

- **HTML** stays in `index.html`, one `<section id="…">` per folder above.
  Keeping it in the page is what search engines read and what shows before
  any script runs.
- **`css/styles.css`** — shared by every section: colour tokens (light and
  dark theme), base styles, buttons, the navbar, section headings, the chips
  used by Skills and Experience, the footer, the toast and the scroll reveal.
- **`js/main.js`** — shared behaviour: navbar and mobile menu, scrollspy,
  theme toggle, scroll reveal and `window.showToast` (used by Contact and the
  GitHub calendar).

## Adding a section

1. Add the `<section id="name" class="section">` markup to `index.html`.
2. Create `sections/name/name.css` (and `name.js` if it needs a script).
3. Link them in `index.html` next to the other sections' files.
4. Add a nav link `<a href="#name" class="nav-link">` — the scrollspy picks it up.
