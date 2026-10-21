# Sticky Notes App

A responsive, local-first note-taking application built with **React,
TypeScript, and Vite**. The Paper Atelier interface supports creating,
editing, and deleting notes, with browser-local persistence,
keyboard-accessible dialogs, a responsive masonry layout, and optional
native speech-to-text.

> **Project status:** Internship submission candidate, ready with
> documented caveats. This project has not been deployed. See [Quality
> Assurance](#quality-assurance) and [Known
> Limitations](#known-limitations).

## Features

-   **Note management:** Create, edit, and delete notes with
    confirmation and validation.
-   **Local persistence:** Store notes in browser `localStorage`; no
    backend, account, or API key is required.
-   **Responsive masonry layout:** Adapts to available space while
    maintaining a predictable reading and keyboard-navigation order.
-   **Optional voice-to-text:** Start dictation explicitly, review and
    edit the transcript, then save it as a note. Typing remains
    available when speech recognition is unsupported.
-   **Accessibility-focused interactions:** Keyboard-operable controls,
    modal focus management, recovery feedback, reduced-motion support,
    and forced-colors styling.
-   **Data-integrity safeguards:** Validate stored records and preserve
    data when storage is invalid or unavailable.
-   **Automated quality checks:** Unit/component tests, browser
    end-to-end tests, accessibility scans, and contrast checks.

## Tech Stack

-   React
-   TypeScript
-   Vite
-   CSS Modules
-   Vitest and Testing Library
-   Playwright
-   axe accessibility checks

## Requirements

-   **Node.js 24**
-   **npm 11**

Dependency versions are pinned in `package.json` and
`package-lock.json`.

## Getting Started

Clone the repository and enter the project directory:

``` bash
git clone https://github.com/YOUR-USERNAME/sticky-notes-app.git
cd sticky-notes-app
```

Install dependencies and start the development server:

``` bash
npm ci --engine-strict --ignore-scripts
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173/`.

No application environment variables, API keys, or backend services are
required for local development.

### Production build and preview

``` bash
npm run build
npm run preview
```

This serves the production build locally; it does not deploy the
application.

## Available Scripts

  -----------------------------------------------------------------------
  Command                             Purpose
  ----------------------------------- -----------------------------------
  `npm run dev`                       Start the Vite development server

  `npm run typecheck`                 Run TypeScript checks for the app
                                      and tooling

  `npm run lint`                      Run ESLint; warnings are not
                                      permitted

  `npm run format:check`              Check formatting

  `npm run format`                    Format project code and maintained
                                      root documentation

  `npm run test`                      Run unit and component tests once

  `npm run test:watch`                Run unit and component tests in
                                      watch mode

  `npm run build`                     Type-check and create production
                                      assets

  `npm run preview`                   Serve the production build locally

  `npm run test:e2e`                  Run Chromium tests against a
                                      production preview
  -----------------------------------------------------------------------

For browser tests, install the pinned Playwright Chromium browser if it
is not already available:

``` bash
npx playwright install chromium
npm run build
npm run test:e2e
```

The end-to-end script manages its preview server. Avoid running a
separate preview server on the same port at the same time. Some Linux
environments may require browser system libraries.

## How It Works

### Notes and persistence

Notes are stored as a JSON array under the `sticky-notes:notes:v1` key
in browser `localStorage`. Each note contains five fields: `id`,
`title`, `content`, `createdAt`, and `updatedAt`.

The storage layer validates the collection before accepting it. Invalid
or inaccessible storage triggers a recovery state rather than being
silently treated as empty. Retry is read-only; it does not clear,
repair, or overwrite stored data. The app persists changes before
reporting success.

### Editing and deletion

Editing uses a transient draft and persists the proposed collection
before updating the visible saved state. Cancel and Escape protect
against accidental loss of changed edits with a discard confirmation.
Deletion requires confirmation and does not update the collection unless
persistence succeeds.

### Voice-to-text

Speech recognition is an optional browser capability and starts only
when the user chooses **Start dictation**. Review and edit recognized
text before saving. Interim speech is provisional and is not saved;
dictation does not automatically save or restart. Support depends on the
browser, permissions, device, and speech service.

### Project structure

-   `src/app` --- application entry and route selection
-   `src/components/layout` --- layout and presentation components
-   `src/features/notes` --- note types, UI, and workflows
-   `src/services/noteStorage.ts` --- browser storage adapter
-   `docs/` --- project specification and supporting documentation
-   `GATES.md` --- quality gates and verification history
-   `artifacts/phase8/` --- final QA report and review index

## Quality Assurance

The Phase 8 stabilization run reported:

-   **171 unit/component tests passed**
-   **62 Chromium end-to-end tests passed** against a local production
    preview
-   **111 axe scans with zero detected violations**
-   **19 contrast measurements passed**
-   TypeScript checks, lint, formatting, production build,
    dependency-tree checks, and whitespace checks passed
-   `npm audit` reported zero known vulnerabilities at the time of the
    audit
-   No dependency or lockfile changes were made during Phase 8

For detailed command results, evidence, screenshots, and review
boundaries, start with
[`artifacts/phase8/REVIEW-INDEX.md`](artifacts/phase8/REVIEW-INDEX.md)
and
[`artifacts/phase8/FINAL-QA-REPORT.md`](artifacts/phase8/FINAL-QA-REPORT.md).
See [`GATES.md`](GATES.md) for the wider verification history.

Automated tests and accessibility scans provide useful evidence, but do
**not** establish full WCAG conformance or universal browser
compatibility.

## Known Limitations

-   **Local-only storage:** Notes are stored as plaintext JSON in
    browser `localStorage`. They are not encrypted, backed up, or
    synchronized to the cloud. Do not store secrets or sensitive
    information.
-   **Data removal:** Clearing browser/site data can permanently remove
    saved notes. Unsaved drafts are held in memory and can be lost on
    reload or tab/process termination.
-   **Cross-tab concurrency:** The app checks for detected changes
    before writing, but `localStorage` does not provide an atomic
    read-check-write transaction. Truly simultaneous writes can still
    race; automatic synchronization and conflict merging are not
    implemented.
-   **Speech-recognition privacy and support:** Browser speech
    recognition may use a remote service. Real microphone permissions,
    transcription accuracy, vendor connectivity, and vendor
    audio-retention behavior have not been verified.
-   **Manual and platform testing:** The final automated run used the
    available headless Chromium environment. Firefox, WebKit, physical
    mobile devices, manual screen-reader testing, and native Windows
    High Contrast remain unverified.
-   **Deployment configuration:** HTTPS, Content Security Policy,
    security headers, hosting-specific route fallback, and
    deployed-origin smoke tests have not been configured or verified.
    Local preview does not prove production deployment readiness.

## Scope

The current scope covers note creation, editing, deletion, local
persistence, responsive presentation, accessibility-focused
interactions, optional native dictation, and automated quality
assurance.

Authentication, backend services, cloud sync, AI features, search,
themes, and import/export are outside the current scope.

## Contributing and Review

This repository includes project-specific QA evidence. Before proposing
changes, review the relevant scripts and quality gates. Do not run
scripts copied from unrelated projects without inspecting them first.

## License

No license has been specified. Unless a license is added, standard
copyright restrictions apply.
