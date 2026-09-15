# HPAIR Delegate Portal — Personal Information Form

A multi-step personal information form for HPAIR delegates, built on the provided React + Firebase starter and styled to match [hpair.org](https://www.hpair.org/).

**Live demo:** https://hpair-delegate-portal.vercel.app  
**Repository:** https://github.com/amensk/hpair_deliverable2026

Test account for reviewers: `delegate.test@hpair-demo.com` / `Hpair2026!` (or register your own).

---

## What was built

| Area | Implementation |
| --- | --- |
| **Validation** | Formik + Yup, per step. Validates on change and blur, inline error text with icon, green check on valid fields, `aria-invalid` / `aria-describedby` for screen readers. "Continue" marks the step's fields touched, toasts the error count and focuses the first invalid field. "Submit" stays disabled until every step is valid. |
| **Fields** | Name, preferred name, email (pre-filled from the account), date of birth (16+ check), gender (with self-describe), nationality + optional second nationality, preferred language + other languages, phone with country dial code, WhatsApp flag, full address, emergency contact, occupation, institution, field of study, programme track, LinkedIn (conditional), website, CV upload (PDF/DOC/DOCX ≤ 5 MB, drag-and-drop), motivation statement with character counter, dietary requirements (conditional "other"), accessibility needs, referral source, declarations. |
| **Submission** | CV uploads to Firebase Storage with a live progress bar, then the form writes to Firestore. Distinct loading, success, and error states. Success screen shows a reference ID. If the storage bucket rejects the upload, the form still saves (with the file name) and tells the user clearly. |
| **Responsive** | Two-column shell collapses to one at 960px; grids and stepper collapse at 720px; buttons go full-width on phones. Print stylesheet included. |

### Bonus features

- **Seven UI languages** — English, 简体中文, 日本語, 한국어, Español, हिन्दी, Tiếng Việt. Switch from the header or footer at any time; every label, hint, validation message, option, summary, download and email copy follows, form values are preserved, and the choice is remembered (and auto-detected from the browser on first visit). Dictionaries are code-split so only the active language is downloaded; a test guarantees all seven have identical keys and placeholders.
- **Searchable pickers** — nationality, second nationality, country of residence, dial code and preferred language use an accessible combobox (WAI-ARIA pattern: arrow keys, Enter, Escape, `aria-activedescendant`) with diacritic-insensitive search and flags; "other languages" is a chip-style multi-select capped at six. Country and language names come from the browser's own `Intl.DisplayNames` in the active UI language, so the full ISO 3166 list (all states plus inhabited territories) and 120+ languages are localised for free, with English fallbacks and English keywords for search.

- **Completion meter** — live percentage and per-section "N to go" counts computed from Yup validation of the whole form, not just the current step.
- **Forgot password** — Firebase password-reset email from the sign-in card, with a non-enumerating success message.
- **Resume banner** — a restored draft shows a "Welcome back" bar with Keep going / Start over; drafts can be cleared at any time.
- **Duplicate-submission notice** — delegates who already submitted see the date and are told a second submit creates a separate record.
- **Offline awareness** — a banner appears when the browser goes offline and Submit is held until it reconnects; autosave keeps working.
- **CV preview** — open the attached file in a new tab before submitting; LinkedIn and website URLs are normalised to `https://` on blur.
- **Error boundary** — a render error in any section shows a recoverable message instead of a blank page; the draft survives a reload.

- **Auto-save** — drafts persist to `localStorage` per user (debounced), including the current step. Restored on return with a toast. Files can't be serialised, so the user is prompted to re-attach the CV. "Clear draft" available in the side rail.
- **Keyboard navigation** — `Enter` advances to the next step (except in textareas), focus moves to the step heading on change, stepper items are real buttons, custom checkboxes/radios keep native focus rings.
- **Conditional questions** — LinkedIn URL only when the user says they have one; self-describe gender; "other" dietary requirement.
- **Downloadable summary** — `.txt`, `.json`, and a print-to-PDF view, available on the review step and after submission. Past submissions can be downloaded too.
- **Email a copy** — opens a pre-filled `mailto:` to the delegate's address after submission (opt-in on the review step). See _Trade-offs_ for why this isn't server-sent.
- **Inline notifications** — toast system (success / error / info) plus contextual alerts.
- **Review step** — grouped summary with per-section "Edit" links and "Needs attention" tags.
- **Admin view** (`/admin`) — searchable, filterable table of all submissions with CSV export. Any signed-in user can see it in this demo; see _Trade-offs_.
- **My submissions** — the user's own past submissions, expandable, on the form page.

## Design

The UI is derived from hpair.org's Squarespace theme variables, not approximated:

- **Type:** Poppins — body 400 / 1.5 line-height; headings 500 / 1.2 / −0.02em letter-spacing.
- **Palette:** crimson `#650606` (accent), `#960816` (dark accent), `#d00606` (bright), near-black `#171716`, off-white `#fcfcfc`. The three-red stat band from the homepage is reused as the header stripe and the login panel.
- **Shape:** square corners and square buttons (Poppins 400, 1rem × 1.3rem padding), matching the site's zero-radius buttons. Dark header with the white banner logo, "Log out" styled like the site's white "Delegate Login" box.
- **Icons:** Feather set via `react-icons/fi` (thin, geometric — sits well with Poppins).

All tokens live in `src/index.css`; component styles in `src/App.css`.

## Project structure

```
src/
  App.js                      routes, providers, header/footer
  components/
    MultiStepForm.js          step orchestration, autosave, submit pipeline
    steps/                    PersonalInfoStep, ContactStep, ProfessionalStep, ReviewStep
    SuccessScreen.js          confirmation + downloads + email copy
    SubmissionsList.js        the user's own submissions
    AdminPanel.js             all submissions, search, filter, CSV export
    Login.js                  sign in / register with validation
    ui/                       Field primitives (Formik-bound), Button, Alert, Toast
    layout/                   Header, Footer
  validation/schemas.js       Yup schemas per step + initial values
  services/                   firebaseService (Firestore), storageService (Storage), authService
  hooks/useDraft.js           localStorage autosave
  utils/                      formatting, summary generation (txt/json/print/mailto)
  data/                       countries (with dial codes), languages, option lists
```

## About the Firebase backend

The starter ships wired to the HPAIR Firebase project `hpair-deliv-6443a`. Testing against it on 14 Sep 2026 showed:

| Service | Result for a signed-in user |
| --- | --- |
| Authentication (email/password) | Works |
| Firestore reads and writes | `permission-denied` on every collection |
| Cloud Storage | Bucket not provisioned (preflight fails) |

So no fork of the starter can persist data to that project as shipped. This deployment therefore runs on its own Firebase project, **`hpair-delegate-portal-2683e`**, with Email/Password auth enabled, Firestore in `nam5`, and the rules from `firestore.rules` published. Storage is intentionally not enabled (Google now requires the Blaze plan for it on new projects); CVs are embedded in Firestore instead. The app handles all of this in three layers:

1. **Bring your own project.** All Firebase config reads from `REACT_APP_FIREBASE_*` env vars (see `.env.example`) and falls back to the HPAIR values. The seven variables must be set in Vercel → Settings → Environment Variables (they are in the local, gitignored `.env.local`). After the first deploy, add the Vercel domain under Authentication → Settings → Authorized domains. Ready-to-paste security rules are in `firestore.rules` and `storage.rules`. To recreate from scratch:
   1. [console.firebase.google.com](https://console.firebase.google.com) → Add project (Analytics optional).
   2. Build → Authentication → Get started → Sign-in method → enable **Email/Password**.
   3. Build → Firestore Database → Create database → Start in production mode → Rules tab → paste `firestore.rules` → Publish.
   4. (Optional, needs the Blaze plan on new projects) Build → Storage → Get started → Rules → paste `storage.rules`. Without Storage the app embeds CVs ≤ 600 KB in Firestore automatically.
   5. Project settings → General → Your apps → Web app (`</>`) → register → copy the `firebaseConfig` values into `.env.local` (locally) and into Vercel → Settings → Environment Variables (for the deploy), using the names in `.env.example`. Redeploy.
2. **CV without Storage.** The CV tries Firebase Storage first. If the bucket is unavailable, files up to 600 KB are embedded directly in the Firestore document (base64) and are downloadable from the submissions list and admin table. Larger files fall back to recording the file name.
3. **Honest local fallback.** If Firestore refuses the write, the completed submission is kept in the browser, the confirmation screen says so plainly (amber, not green), the database's message is shown, and the delegate can email or download the copy. Nothing is silently faked and nothing is lost.

## Trade-offs and decisions

- **Email delivery is client-side (`mailto:`).** Sending real email needs a server or the Firebase "Trigger Email" extension, which requires project-owner access to install and an SMTP credential. The `mailto:` approach works with zero backend and never exposes credentials. Wiring the extension is a one-line change: write the summary to a `mail` collection in `handleSubmit`.
- **CV upload degrades gracefully** (Storage → inline base64 → name only), see above. Inline storage is capped at 600 KB because Firestore documents max out at 1 MiB.
- **Inline CVs live in a subcollection** (`formSubmissions/{id}/files/cv`), written in the same atomic batch as the submission. List queries for the delegate and admin views therefore never download file payloads; the file is fetched only when someone clicks Download.
- **Security rules validate shape, not just auth**: field types and length caps, both declarations must be true, the CV payload may not be placed on the parent document, and the child file's owner must match the parent's (`getAfter` because both land in one batch).
- **Performance**: the admin route and the Firebase Storage SDK are code-split and loaded on demand; the hero image is preloaded with `fetchpriority="high"`; static assets get immutable cache headers and the site sends `nosniff`, `X-Frame-Options`, HSTS, and a referrer policy via `vercel.json`.
- **Admin allow-list** — set `REACT_APP_ADMIN_EMAILS` to restrict `/admin` and hide its nav link; left unset for the demo so reviewers can see it.
- **Data stays language-neutral**: the form stores ISO codes (nationality `IN`, language `hi`), never display strings, so a Japanese-speaking delegate and an English-speaking admin see the same record correctly. Older English-name values are still recognised.
- **Tests** — `npm test` runs 47 Jest cases: every step schema (age gate, conditional LinkedIn, CV size/type, declarations), schemas built in another language, summary/formatting utilities, dictionary parity and placeholder checks for all seven locales, the localised country/language data, and React Testing Library specs for the combobox (typing, keyboard selection, mouse selection, clearing, chips, max, Backspace removal).
- **Drafts live in `localStorage`, not Firestore.** Cheaper, instant, and avoids writing half-finished PII to the database. The cost is that drafts are per-device.
- **Per-step Yup schemas** instead of one big schema, so `isValid` means "this step is valid" and the Review step can compute per-section completeness with `isValidSync`.
- **The user's own submissions are fetched with a `where('userId' == uid)` query and sorted client-side**, which avoids needing a composite Firestore index that I can't create on a project I don't own.
- **`/admin` is not role-gated.** The starter had no roles; proper gating needs custom claims or an allow-list in Firestore rules. It's left open so reviewers can see it, and the header labels it plainly.
- **`node_modules` and `build` were removed from git** and added to `.gitignore`. Vercel installs from `package-lock.json` and builds from source, so committing them only bloats the repo and risks stale artifacts.
- **`vercel.json`** adds an SPA rewrite so `/admin` works on a hard refresh.

## Getting started

```bash
npm install
npm start
```

Build for production:

```bash
npm run build
```

## Deploying to Vercel

Import the repo on Vercel; framework preset "Create React App" is detected automatically. `vercel.json` handles client-side routing. No environment variables are required (the Firebase web config is public by design and access is governed by security rules).

## Original brief

<details>
<summary>Expand</summary>

Build a **personal information form application** with the following features:

**Recommended:** form validation (real-time, clear errors, prevent invalid submission); fields including address, CV upload, phone number, nationality, LinkedIn URL, preferred language; form submission with success/error states and confirmation; responsive, accessible design.

**Bonus:** loading states, inline notifications, auto-save, keyboard navigation, email the response, downloadable summary, conditional questions, and at least one additional creative feature.

Submission: deploy to Vercel and submit both the deployment link and the GitHub repository link. Contacts: Christopher Qiu (cqiu@college.harvard.edu) and Ashley Zheng (ashleyzheng@college.harvard.edu).

AI use is permitted; all submitted code is fair game for the interview.

</details>
