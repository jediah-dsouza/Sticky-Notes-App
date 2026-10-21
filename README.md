# Sticky Notes App

Paper Atelier local-first notes, built with React, TypeScript and Vite. Create, edit, safely delete and reload notes in an ordered responsive masonry layout; optional native voice-to-text enhances the same composer. **The final internship candidate is ready with documented caveats; see Phase 8 below.** No deployment has been performed.

## Setup

Use Node 24 and npm 11. Dependencies are pinned exactly in package.json and package-lock.json.

```bash
npm ci --engine-strict --ignore-scripts
npm run dev
```

No application environment variables, backend or API keys are required. Open the local URL printed by Vite. For a production preview, run `npm run build` then `npm run preview`.

For browser tests only, provision the pinned Playwright browser with `npx playwright install chromium` if it is not already available, then run `npm run build` and `npm run test:e2e`. This downloads development tooling, not an app dependency, and is not required for normal startup. Linux hosts may need browser system libraries; do not install system packages without authorization. This audit used the existing installed Chrome/cache shim, without installing anything.

## Commands

- `npm run dev`: local development server.
- `npm run typecheck`: application and tooling TypeScript checks, no output.
- `npm run lint`: ESLint, no warnings permitted.
- `npm run format:check`: formatting check; source documents are excluded to preserve supplied copies.
- `npm run format`: format project code and maintained root documentation.
- `npm run test`: unit/component tests once.
- `npm run test:watch`: interactive unit/component tests.
- `npm run build`: type-check and generate production assets.
- `npm run preview`: serve the production build locally.
- `npm run test:e2e`: Chromium tests against the production preview. Run build first.

Do not run scripts copied from another project without inspecting them first.

## Application architecture

`src/app` mounts React and selects `/` or the not-found view from the pathname. Ordinary links use full navigation; a router is unnecessary for the current route inventory. `components/layout` owns presentation only. CSS Modules consume global Paper Atelier tokens. System sans-serif and Georgia are the approved initial fallbacks: no remote fonts or third-party scripts load.

`docs/` contains project copies of the five supplied documents. TRD is reconciled into an engineering specification. Approved decisions appended to the other project copies supersede contradictory proposal text. The original attachments remain unchanged.

`GATES.md` records historical phase evidence and current Phase 8 stabilization results. Browser screenshots and reports are ignored generated artifacts, not source files. Tests run against the production build. Unknown-path fallback is verified in local preview only; eventual hosting must be configured and checked separately.

## Dependency decisions

Registry engine and peer constraints were inspected before installation on Node 24.14.1 / npm 11.11.0. TypeScript 6.0.3 stays within typescript-eslint's `<6.1.0` peer range; TypeScript 7 was not selected. jsdom 29.1.1 supports this Node version; jsdom 30.1.3 requires Node 24.15.0 or a different supported release and was not selected. ESLint 9 produced an unsupported-version warning during initial installation. After verifying Node and plugin peer compatibility, ESLint 10.13.0 and @eslint/js 10.0.1 were selected instead. Versions are project-owned, not inherited from sandbox tooling.

## Current behavior and data contract

The composer accepts an optional title and required non-whitespace content. Validation checks a trimmed copy only; saved title/content retain their entered text and line breaks. Text is rendered through React, never interpreted as HTML. Successful saves clear the composer and announce success only after persistence. Failed validation or writes retain the draft; failed writes also retain the previous saved collection.

`src/features/notes/noteTypes.ts` defines exactly five string fields: `id`, `title`, `content`, `createdAt`, `updatedAt`. Creation uses `crypto.randomUUID()` and one UTC-millisecond ISO timestamp for both dates. Unavailable UUID generation or a detected collision fails safely without writing. Display is sorted by the actual updated instant descending, then ID ascending for ties.

`src/services/noteStorage.ts` alone accesses browser localStorage. The key is `sticky-notes:notes:v1`, containing one JSON array. Every record must have exactly the five approved fields, a nonempty unique ID, string title/content, meaningful content, valid timezone-qualified ISO date-times, and updatedAt no earlier than createdAt. Stored timestamps accept four-digit years, seconds, optional 1–3 fractional digits and Z or a numeric offset; new timestamps are canonical UTC with milliseconds. Unknown fields and invalid records reject the entire collection without rewriting it.

A missing key is genuinely empty. Malformed JSON, invalid records, duplicate IDs or inaccessible storage block saving and show recovery, not an empty state. Retry loading only rereads; it never repairs, clears or overwrites data. Draft fields remain editable/copyable. The adapter checks the raw snapshot again before writing and pauses if it changed since loading. This avoids knowingly overwriting changed data, but localStorage cannot provide an atomic cross-tab transaction.

`useNotes` owns the authoritative saved collection; `NoteComposer` owns only its draft, validation and feedback. UI components do not access storage. There is no mount-time write or save effect. `NotesCollection`/`NoteCard` now render ordered responsive masonry; its presentation-only measurement hook is described below.

## Limitations and next step

Notes are stored as plaintext JSON in localStorage, accessible to scripts running in the same origin and to people/tools with browser-profile access. Do not use this app to protect secrets. Notes are local to this origin, browser and device; clearing site data loses them. There is no cloud backup or encryption layer. Unsaved drafts are in memory only. A beforeunload warning is registered for meaningful create-composer drafts only, but browsers may suppress it, particularly on mobile/process termination; it is not draft recovery. Edit drafts have the Cancel/Escape discard guard only: reload, tab closure and process termination can lose them, as browser-unload edit protection is explicitly outside Phase 3. Corrupt data is preserved but no repair/import/reset tool is included. Simultaneous writes from separate tabs are not guaranteed safe by the best-effort snapshot check; automatic synchronization/merging is not implemented.

Automated accessibility checks do not prove WCAG compliance. Firefox, WebKit, real mobile devices, manual screen-reader announcements and native unload dialogs remain unverified. Unknown-path fallback is tested in local preview, not a deployed host. No deployment is authorized.

The authorized scope now includes native dictation and final stabilization. Authentication, backend, cloud sync, AI, search, themes, import/export and other optional systems remain excluded.

## Editing behavior and boundaries

Each saved card has an always-visible, keyboard-accessible Edit note action. `NoteEditor` uses a native modal dialog, prepopulates its own transient draft, and reuses existing field/button styles. Focus enters Title; Tab/Shift+Tab wrap within the active editor/warning; the browser makes the background inert. Backdrop clicks do not dismiss. Cancel or Escape closes an unchanged draft immediately; changed drafts first offer Keep editing or Discard edits. Escape from that warning returns to editing. Closing restores the opener's focus, or main content if recovery removed it. The field region scrolls independently, leaving header and actions visible in constrained viewports.

`useNotes.saveEdit` validates content, preserves ID/createdAt and persists the full proposed collection through the unchanged storage adapter before committing state. Success closes the editor and updates a polite live region. Failed saves retain the editor, complete draft and previous saved collection. Recovery is also available inside the modal: read-only retry never clears or repairs data. If retry loads a changed or removed target, the old draft cannot overwrite it; cancel/reopen is required to review the latest record. Automatic merge/rebase is not implemented.

Exact unchanged text closes with “No changes to save,” without a write or timestamp change. Meaningful edits use `max(Date.now(), previous updatedAt + 1 ms)` so successful update times advance even with a same-millisecond save or clock rollback. Prepared timestamps are not committed on failure. Optional whitespace-only titles remain byte-preserved but use an Untitled note accessible label and omit an empty visual heading. All user text remains plain React text.

## Phase 3 verification outcome

All configured checks passed: 101 unit/component tests in six files and 29 Chromium production-preview tests, with no failures or skips in the final run. There are 35 zero-violation axe scans (21 retained route/create-state scans, 13 modal-state scans and one blank-title state scan) and 16 measured contrast pairs. Thirteen modal screenshots were individually inspected: editor, validation, discard warning and write error at 390/768/1440px, plus mobile recovery. A 390×600 viewport also has automated scroll/control checks. Native modal focus wrapping, inert background, Escape, focus restoration/fallback and reduced motion were browser-tested. Screen-reader announcements, other engines and real devices remain unverified. No dependencies or package/lock changes were made.

`artifacts/phase3/` contains scan JSON, generated and exact reviewed screenshots, visual observations and verification logs. `artifacts/contrast.json` and `artifacts/playwright-results.json` record current measurements/results. The review archive is `/data/sticky-notes-app-phase3.zip`; it includes source, project docs and selected evidence, but not dependencies, build output or Git internals. See GATES.md for commands, corrections, integrity and review boundary.

## Phase 2 verification outcome (historical)

Typecheck, lint, formatting, all 68 unit/component tests, the production build and all 20 Chromium tests passed. The browser suite includes real keyboard create/save/reload at 390/768/1440px and deterministic storage failures. Axe found zero violations across 15 workflow-state/viewport scans plus six route/viewport scans. Fifteen measured token pairs met their contrast targets. Empty, validation, saved/success, write-error and recovery screenshots were individually inspected at all three widths; long text and multiline content remain readable without horizontal overflow. See GATES.md for actual commands, evidence and limitations. No dependencies changed or were installed in this phase.

## Foundation verification outcome

A fresh `npm ci --engine-strict --ignore-scripts --no-audit --no-fund` succeeded. Typecheck, lint, formatting, all 3 component tests, production build and all 9 Chromium tests passed afterward. Six screenshots covering both routes at 390, 768 and 1440px were individually inspected; the final renders match those inspected images. Axe reported no violations in the six tested route/viewport combinations. Nine measured token pairs passed contrast targets. Dependency audit reported zero known vulnerabilities at the time of checking. This is foundation evidence only, not acceptance of note functionality.

All original attachments are unchanged. The supplied master document retains its original CRLF bytes; use `git -c core.whitespace=cr-at-eol diff --cached --check` for a line-ending-aware whitespace check. The original foundation staging is preserved; Phase 2, Phase 3, Phase 4, Phase 5 and Phase 6 modifications and new files are left unstaged for review. No initial commit, remote or deployment was created. See GATES.md and the archive evidence for checks and limitations.

## Safe deletion behavior (Phase 4)

Each saved card now has a discoverable Delete action alongside Edit note. `ConfirmDeleteDialog` reuses the native modal and existing Paper Atelier styles. Its bounded, plain-text title/content excerpt identifies the target without dumping the full note. Cancel is initially focused. Cancel, Escape and backdrop clicks dismiss without writing; Tab/Shift+Tab wrap within the modal and the background remains inert. No ordinary navigation or editing action opens a deletion confirmation.

`useNotes.deleteNote` checks the selected record against the original five-field dialog baseline, prepares the remaining collection, and uses the unchanged storage adapter to revalidate/reread the raw snapshot before writing. Only persistence success commits state, closes the dialog and announces deletion in a polite live region. Other notes and their metadata remain unchanged. Deleting the last note stores `[]`; a subsequent reload shows the genuine empty state. Focus returns to the initiating Delete on cancellation, or to the collection/empty-state heading after success; a missing opener uses the same heading fallback.

A failed write leaves the dialog, note and saved collection intact, reports an alert and permits an explicit retry. Malformed, invalid, duplicate, unreadable or unexpectedly changed storage blocks deletion. Read-only Retry loading never repairs or clears data and never automatically executes deletion. If retry reloads a changed or removed selected record, its stale confirmation is refused: cancel and review the latest notes. There is no undo, trash, bulk deletion, automatic repair or new persistence schema.

## Phase 4 verification and review archive

All six configured checks passed: **125 unit/component tests in 8 files and 40 Chromium E2E tests, with 0 failures or skips**. The 53 current-run axe scans found 0 violations; all 18 ordered contrast checks passed. The final evidence and exact command results are recorded in GATES.md and `artifacts/phase4/verification/`. The deletion increment adds 24 unit/component cases and 11 production-preview Chromium cases, retaining all previous tests. Eighteen deletion-state screenshots were individually inspected at 390, 768 and 1440px (960px viewport height; collection states captured full-page). Automated checks also exercise constrained 390×600 recovery controls. Eighteen new axe scans cover confirmation, cancellation, success, empty, write failure and recovery across the three widths; retained route/create/edit scans are rerun, not substituted for deletion coverage. Contrast measurements include destructive text on muted hover and inverse text on the destructive button.

The review archive is `/data/sticky-notes-app-phase4.zip`. It contains complete source, project docs, Phase 4 relative diff, command logs, integrity hashes, scan JSON, contrast results, Playwright JSON and exact reviewed screenshots/observations. It excludes dependencies, compiled output and Git internals. No dependencies, manifest/lock changes, staging, commit, push, publication or deployment were performed. Phase 4 ends here for review; no next feature has begun.

## Responsive masonry and visual refinement (Phase 5)

The collection uses CSS Grid with 4px implicit rows and measured natural-height row spans. A focused `useMasonryLayout` presentation hook observes articles and the container with ResizeObserver, batches notifications into one animation frame, reads heights before writing changed spans, and cleans up observers/queued work. Initial and collection-change measurement occurs before paint. CSS—not explicit coordinates—places items with non-dense row auto-placement. There is one sorted semantic list, no CSS order changes, column buckets, duplicate saved state, layout library or persistence effect. DOM/keyboard chronology follows visual top-to-bottom order, left-to-right for ties.

Cards have a 300px minimum column target (bounded by available width), 24px horizontal gutters and 24–under-28px vertical gutters after 4px rounding. The 1120px content cap gives one column at 390px, two at 768px and three at 1440px. Columns respond to available space, not device labels. Without ResizeObserver the usable responsive ordinary Grid remains; it is a fallback, not a claim of masonry support in that environment. CSS columns were rejected because balanced column-major order conflicts with the intended row-scanning chronology. Native masonry is not a dependable browser baseline.

The smaller workspace heading, aligned composer, wide-screen title/content arrangement, tighter mobile footer, editorial serif card titles and subtle action rule refine existing UI only. Controls remain visible and 44px+; text remains exact React text with pre-wrapped whitespace and safe word/URL wrapping. Existing timestamps and cream note surfaces remain; no new persisted fields or random colors were added. Optional CSS button transitions respect reduced motion; notes/grid do not animate. The editor and delete modal logic and their independently scrolling field regions are unchanged. All note operations, validation, storage adapter, useNotes workflow, schema and storage key are byte-identical to Phase 4.

## Phase 5 verification and review archive

The extended suites pass **133 unit/component tests in 9 files and 46 Chromium production-preview tests**, retaining all 125/40 prior cases. The new coverage checks measured spans, observer cleanup and fallback, 1/2/3-column geometry, exact short/long/multiline/title-less content, literal markup, chronological Tab traversal, 44px actions, edited-length growth/shrinkage, deletion/reload, unsafe storage protection, reduced motion and 48-note resizing/scrolling. Representative collection lifecycle runs record zero console/page errors and zero external requests. No sleeps, retries or removed assertions were introduced.

There are **79 current-run axe scans with 0 detected violations** (53 retained + 26 new) and **19 passing ordered contrast measurements**, including success text on canvas. Tokens' color values are unchanged. These checks are not proof of full WCAG or manual screen-reader compatibility. Six before screenshots and twenty after screenshots were individually inspected: empty, mixed collection, editor, delete confirmation, write error and recovery at 390/768/1440×960, plus editor/delete at 390×480. Full-page collections include real multiline and long URL content. See `artifacts/phase5/visual-review.md` for per-image findings and hashed reviewed images.

The configured managed browser cache was unavailable in this environment. Verification used the already installed Chromium 153.0.8010.12 via an outside-project cache symlink and `PLAYWRIGHT_BROWSERS_PATH=/data/playwright-system`; no dependency/browser installation or project configuration change was made. Firefox/WebKit, real mobile touch/keyboards, zoom/forced-colors and manual screen-reader behavior remain unverified. ResizeObserver-free Grid is browser-tested as fallback. Storage failure tests use deterministic mocks, not actual quota exhaustion; existing best-effort cross-tab limitations remain.

The source review archive is `/data/sticky-notes-app-phase5.zip`: full application source/configuration/project docs, Phase 4-relative patch and source hashes, baseline/prototype evidence, exact inspected before/after images and observations, current scan/contrast/Playwright JSON, command logs and Git/staging/dependency preservation records. It excludes node_modules, dist and .git. Package manifest, lockfile, original attachments and master are unchanged. No dependencies, staging, commit, push, deploy or publication were performed. Stop after Phase 5 for review.

## Phase 6 — optional voice-to-text

Activate **Start dictation** beneath Content to request native speech recognition; it never starts on load. **Stop dictation** ends listening and briefly waits for final text. Typing and title editing remain available throughout. Save waits until dictation has ended so late results cannot populate a cleared draft. Nothing is auto-saved.

**Insertion rule:** each finalized result appends to the current draft end, not the caret or selection. Add one newline only when existing content is nonempty and does not already end in a newline. Do not trim or replace typed/recognized text. You may edit/remove text during listening; subsequent final results append to the newly edited end. Interim words appear separately as “Provisional (not saved)” and are never inserted or persisted. Repeated final result indexes are ignored within each session; restart creates a new session/index set and retains earlier draft text.

The isolated `src/features/voice/useSpeechRecognition.ts` hook detects standard/prefixed native controllers. Its states are unavailable, idle, starting, listening, processing and error. A controller is created only on explicit start. Stop accepts final callbacks until end, then handlers are detached; error/unmount/page hiding/pagehide or focus entering a modal aborts and invalidates callbacks. No automatic restart. Startup (15s) and stop (8s) watchdogs release stalled sessions. Timeout/error cleanup never removes finalized or typed draft text. Starting again is explicit. Successful normal saving resets old speech feedback.

### Support, privacy and recovery

Native recognition is not universally supported or Baseline. Capability detection is not a promise that the vendor service, permission, language or microphone will work. HTTPS or localhost is required by this enhancement. Allow microphone access only when you choose to start; a denial explains how to check browser site permissions. Missing microphones, no speech, interrupted sessions, unsupported language and network/service failures have understandable feedback. Unsupported environments keep the complete typed-note workflow.

The page language (`en`) is the recognition language; no new language picker is added. Browser/platform implementations may send audio to a remote speech service and may need a connection. This app adds no audio recorder, custom transcription backend, analytics, speech SDK, audio storage or separate interim-transcript persistence. A finalized transcript becomes ordinary draft text and is persisted only when you explicitly save. These are application boundaries, not a guarantee about vendor audio retention, offline processing or browser privacy policies.

References inspected: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [stop](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/stop), [abort](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/abort). Result/error event types exist in this project's TypeScript DOM library; the controller does not, so a local minimal structural interface models only the used API.

### Phase 6 verification and review boundary

The source and evidence archive is `/data/sticky-notes-app-phase6.zip`; start with `artifacts/phase6/REVIEW-INDEX.md`. All six configured quality scripts passed: 167 unit/component tests and 54 production-preview Chromium tests (zero failed/skipped/flaky). All 97 current-run axe scans report zero violations, including 18 voice-state scans; all 19 measured contrast pairs pass. Eighteen voice screenshots were individually inspected at 390/768/1440px. See GATES.md and the evidence index for exact logs, corrections, ratios and preservation checks. Existing note schema/key, adapter/useNotes, validation, identity/timestamps, persist-before-success, recovery, masonry and modal implementations remain unchanged. Tests use deterministic browser speech mocks; they do not verify real microphones, real permission prompts, vendor speech accuracy, actual remote-service connectivity or hardware resource release. Manual audio testing has not been performed. Only installed Chromium/local production preview is tested; Firefox/WebKit, physical mobile devices and manual screen-reader announcements remain unverified. Automated scans are not full WCAG certification. No new dependencies, deployment or unrelated features are included. Stop after Phase 6.

## Phase 7 — final QA & release readiness

**Ready with caveats: local release candidate, not unconditional production/real-microphone sign-off.** Start with `artifacts/phase7/FINAL-QA-REPORT.md` and `REVIEW-INDEX.md`. Independently reran all configured gates: 167 unit/component tests and 55 production-preview browser tests pass. Typecheck, lint, format, build, dependency-tree and whitespace checks pass; npm audit reports zero known vulnerabilities. Manifest/lockfile and staged foundation work are unchanged.

One reproduced accessibility defect was fixed: the primary Save action's disabled-to-enabled background transition temporarily reduced text contrast. Primary colors now change immediately; a 12-frame browser regression measures 4.69:1 throughout completion. No features, palette, note schema/key or persistence/voice architecture changed. Original CRUD, recovery, masonry and modal suites remain intact.

There are 99 zero-violation normal-color axe scans (97 configured plus two supplemental), **but two separate forced-colors diagnostic scans remain unresolved**: axe reports light-on-white while browser computed styles and inspected pixels show black-on-white. The supplemental helper exits nonzero; no finding was suppressed. Fourteen screenshots were individually inspected, including 390/768/1440px collections, narrow dialogs, voice states, storage recovery and 320px reflow. These checks do not certify WCAG compliance.

Only installed headless Chrome/local production preview was verified. Real microphone permissions, actual speech accuracy/vendor connectivity, native high contrast, other browsers/physical devices and manual screen-reader behavior still need review. Native browser speech may use remote processing; no app audio storage/custom backend/analytics was added. Existing local-only storage, memory-only draft and best-effort cross-tab boundaries remain. See the report for exact failure history, commands, open risks and the unexecuted release checklist. Review archive: `/data/sticky-notes-app-phase7.zip`; no dependency installation, staging, commit, push, publication or deployment performed.

## Phase 8 — internship submission handoff

**Ready with documented caveats.** The two Phase 7 forced-colors diagnostics were independently reproduced and resolved in browser emulation without suppressing axe. Chrome exposed system black for `color` but the authored cream for `-webkit-text-fill-color`; axe uses the latter. Primary actions now explicitly use ButtonText/ButtonFace, GrayText when disabled and Highlight for keyboard focus/hover borders, only inside `@media (forced-colors: active)`. Native color adjustment stays enabled. Normal Paper Atelier tokens, layout and behavior are unchanged. Native Windows High Contrast has not been tested.

Four new deterministic speech tests and seven browser regressions cover empty/blank recognition, unmapped service errors and stale callbacks, stop-before-start, listener removal even if abort throws, forced-color dialogs/keyboard/disabled recovery, actual two-tab stale operations and explicit saving of reviewed speech. A fresh unmocked load also exposed a missing `/favicon.ico` request; an explicit empty favicon declaration prevents that console 404 without a new visual asset. The voice hook and note storage/model are unchanged: no new runtime lifecycle or data-integrity defect was confirmed. Final suite: **171 unit/component tests and 62 production-preview browser tests**. Exact commands, results, failures, scans and screenshot provenance are in `artifacts/phase8/FINAL-QA-REPORT.md` and `REVIEW-INDEX.md`. Phase 7 evidence/archive remains untouched; the previous contrast-regression artifact now writes under Phase 8 rather than overwriting that evidence.

Voice remains an enhancement: explicitly Start, allow permission if offered, dictate, Stop, review/edit, then Save. Unsupported/insecure browsers retain typing. Finals append at the draft end, interim words stay provisional, sessions never auto-save/restart. Real microphone capture, permission prompts, speech accuracy, vendor connectivity/audio retention and physical release remain unverified. Browser speech may be remote; no app audio recording, custom backend or analytics exists. Only the installed headless Chrome environment was tested, not other engines, real mobile hardware, screen readers or native Windows high contrast.

Storage is plaintext and local-only; failed/malformed reads and writes preserve data/drafts and block unsafe mutations. Retry only rereads. Sequential stale cross-tab writes are blocked and tested with two actual pages; the read/check/write operation is not atomic, so truly concurrent writers can still race. No automatic cross-tab refresh, merge or synchronization is promised. Unsaved drafts are memory-only and unload warnings are best effort.

HTTPS, Content Security Policy, security headers, host route handling and deployed-origin smoke tests are **deployment-specific and unverified**, not supplied by the local Vite build. No deployment or remote changes were authorized or performed. Before future publication, assess an appropriate restrictive policy for the selected host, test its interaction with native browser speech, then verify the actual deployed origin; do not assume a local preview proves these controls.

Review package: `/data/sticky-notes-app-phase8.zip` (complete source, documentation and Phase 8 evidence, no node_modules/dist/.git). Run the setup and package scripts above. No dependencies, Git staging/commit/push, publication or deployment were performed in this phase. Earlier phase evidence sections below/above are historical; Phase 8 is the current submission status.
