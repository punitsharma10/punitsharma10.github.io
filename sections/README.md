# Page sections

Every section of the page has its own folder here, with its HTML, CSS and
(where it needs one) JS. To change a section, open its folder — nothing else
needs to change.

| Section (nav)  | Folder         | Files                                                                          |
|----------------|----------------|--------------------------------------------------------------------------------|
| About          | `about/`       | `about.html`, `about.css`, `about.js` (years counter, rotating role)           |
| Experience     | `experience/`  | `experience.html`, `experience.css`, `experience.js` (role durations)          |
| Skills         | `skills/`      | `skills.html`, `skills.css`                                                    |
| Projects       | `projects/`    | `projects.html`, `projects.css`, `projects.js` (image sliders)                 |
| GitHub         | `github/`      | `github.html`, `github.css`, `github.js`, `github-data.js`, `calendar.css`, `calendar.js` |
| Education      | `education/`   | `education.html`, `education.css`                                              |
| Contact        | `contact/`     | `contact.html`, `contact.css`, `contact.js` (form, dropdown, Google Sheet)     |

The chatbot is a feature rather than a section, so it lives in `/chatbot`.

## How the page is put together

`index.html` is **generated** — never edit it. `build.js` takes `layout.html`
(the head, navbar and footer) and replaces each line like

```html
<!-- @include sections/experience/experience.html -->
```

with that section's HTML. GitHub runs this on every push
(`.github/workflows/deploy.yml`) and publishes the result, so you only edit,
commit and push. If a section file is missing the build stops and the live
site stays as it was.

To see a change on your own machine before pushing:

```sh
npm run build    # build index.html once
npm run dev      # rebuild on every save while you edit
```

## Shared files (not in a section folder)

- **`layout.html`** — the page shell: `<head>`, navbar, footer, and the order
  of the sections.
- **`css/styles.css`** — colour tokens (light and dark theme), base styles,
  buttons, the navbar, section headings, the chips used by Skills and
  Experience, the footer, the toast and the scroll reveal.
- **`js/main.js`** — navbar and mobile menu, scrollspy, theme toggle, scroll
  reveal and `window.showToast` (used by Contact and the GitHub calendar).

## Adding a section

1. Create `sections/name/name.html` with `<section id="name" class="section">…</section>`.
2. Add `<!-- @include sections/name/name.html -->` to `layout.html` where it should appear.
3. Add `sections/name/name.css` (and `name.js` if needed) and link them in `layout.html`
   next to the other sections' files.
4. Add a nav link `<a href="#name" class="nav-link">` in `layout.html` — the scrollspy picks it up.
