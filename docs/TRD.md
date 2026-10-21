# Technical Requirements — Sticky Notes App

## Status and authority

Reconciled foundation and Phase 2 specification, based on the supplied five documents and subsequent explicit user decisions. The supplied TRD attachment was a document-writing brief; the original remains untouched. This project copy replaces that brief with actual engineering decisions. Implementation and verification status is tracked in GATES.md, not inferred from this specification.

## Approved technical baseline

React + React DOM, strict TypeScript, Vite, CSS Modules and global custom-property tokens. npm manages exact direct versions in package.json and a project-owned package-lock.json. Node 24 / npm 11 are the supported development baseline. Vitest + Testing Library + jsdom cover behavior; Playwright Chromium + axe cover production-preview browser checks. ESLint and Prettier enforce static quality. All package versions and executable scripts are in package.json. No backend, server database, authentication, global state library, UI kit, remote font, external speech SDK or application environment variable is needed. No deployment is authorized.

## Foundation and Phase 2 implemented scope

The implemented foundation consists of React initialization, a responsive Paper Atelier shell, minimal pathname handling for `/` and unknown paths, skip navigation, tokens, tests and quality/build configuration. Phase 2 adds create, validated localStorage persistence, genuine empty/recovery states, saved cards and reload recovery. Editing, deletion, voice input and final masonry remain unimplemented. Georgia and the system sans stack are deliberate initial fallbacks. A 600px layout breakpoint responds to header/footer text; the temporary grid uses auto-fill columns of at least 280px when space permits. Final masonry remains to be validated.

## File boundaries

- src/app/main.tsx: mounting and global style imports.
- src/app/App.tsx: root route selection and foundation composition, no domain or storage logic.
- src/features/notes: note types, validation, creation/sorting, useNotes and workspace composition.
- src/services/noteStorage.ts: exclusive localStorage adapter with full validation and non-destructive failure handling.
- src/components/notes: draft composer, collection, cards and their CSS Module.
- src/components/layout: header and not-found presentation, with CSS Modules.
- src/styles: Paper Atelier tokens, base typography, focus and reduced-motion defaults.
- src/test: component-test setup and automatic cleanup.
- tests/e2e: production-preview route, accessibility and responsive checks.
- vite.config.ts: Vite and Vitest configuration.
- playwright.config.ts: local production preview and Chromium test configuration.
- docs: project copies of requirements. README: setup, real commands and limitations.

## Implemented Phase 2 contracts and approved later contracts

Note fields: id, title, content, createdAt, updatedAt. Title and content are strings; content must contain non-whitespace text. Preserve line breaks. No arbitrary length limit. IDs use crypto.randomUUID in supported secure environments; unsupported environments must fail safely or receive an explicitly tested fallback. ISO timestamps are stored consistently; updates preserve ID and createdAt and alter updatedAt only for meaningful successful changes. Sort descending by updatedAt with a stable ID tie-breaker. No color or category field.

Storage key: sticky-notes:notes:v1. Format: one JSON array of note objects. A dedicated adapter must validate all records, required fields, timestamps and unique IDs. A missing key means empty. Invalid JSON, invalid records or read exceptions enter an explicit recovery state. Preserve the original raw value; block mutations until a safe read/recovery succeeds. No automatic partial-data rewrite or destructive reset is approved. Writes happen once per accepted mutation, before committing saved state or reporting success. Failure retains the previous saved collection and the draft. No generic multi-backend repository is needed.

A focused useNotes hook owns the single saved collection and coordinates pure domain functions with storage. Forms own draft and validation state. UI components do not access storage. No effect that blindly saves an initial empty collection. Render user text safely, not as HTML; do not log note contents.

Modal editing, confirmation deletion and warnings before dirty dismissal are approved for later increments. Focus restoration after successful deletion must use a logical surviving target, not the removed button.

Browser speech recognition remains a later increment. Detect support, require a user gesture, provide start/stop and understandable fallback/errors, append final transcript text only, deduplicate results, preserve draft text and clean up listeners. Do not auto-submit or persist audio. Browser/platform speech processing may be remote; do not promise offline voice recognition.

CSS-based masonry must be prototyped and verified for variable heights, chronological DOM order, visual scanning and keyboard focus. No masonry library or JavaScript positioning engine by default. Do not silently replace required masonry with an ordinary grid.

## Verification and delivery

Use the actual package scripts documented in README. Run typecheck, lint, formatting check, component tests, build, then E2E against production preview. Browser tests and screenshots must not substitute for inspecting the rendered images. Automated accessibility is supplemented by keyboard, focus, contrast and reduced-motion checks; screen-reader and real-device checks are separately reported. No coverage percentage or performance score is assumed. The production build is local, not deployment. Hosting selection, publishing and deployed smoke tests require later authorization.

## Phase 2 implementation details and limits

The implemented note schema contains exactly five string fields and rejects unknown persisted fields. New dates share one canonical UTC-millisecond ISO instant. Stored date-times require valid calendar/time values, timezone qualification, four-digit years, seconds and at most three fractional digits. updatedAt cannot precede createdAt. UUID capability failure or a detected collision leaves the draft unsaved. No identifier fallback is used.

Before each save the adapter rereads/validates storage and compares its raw value with the loaded snapshot. Changed or unreadable data blocks mutation pending read-only retry; ordinary write failures allow Save note to be retried with the same draft. Snapshot comparison is best-effort and not an atomic cross-tab transaction. No automatic synchronization, record salvage, reset or repair UI is implemented. Meaningful draft unload warnings use beforeunload and are browser-dependent, not persisted draft recovery.

Historical Phase 2 verification: 68 unit/component tests and 20 Chromium production-preview tests pass, with 21 zero-violation axe scans and 15 measured contrast pairs. No dependency or lockfile changes were needed. See GATES.md for the exact evidence and unverified platforms.

## Phase 3 implemented editing

The manifest, lockfile, scripts and storage adapter are unchanged. Native HTML dialog APIs plus existing React/CSS Modules implement editing; no dialog library is added. `updateNote` is a pure domain operation; `useNotes.saveEdit` validates and prepares a replacement record, calls the existing snapshot-guarded adapter, and commits only after success. ID and createdAt remain unchanged. Exact no-op drafts cause no write; successful meaningful edits advance updatedAt using max(device time, previous update + 1 ms), with no timestamp/state commit on failure. An original-note edit baseline guards against stale overwrites after recovery retry; no automatic merge exists. Edit drafts are memory-only with in-dialog dismissal protection, not new browser-unload protection.

Phase 3 verification: 101 unit/component tests and 29 production-preview Chromium tests pass; 35 axe scans report zero violations and 16 measured contrast pairs meet their targets. This supersedes the historical Phase 2 counts above. GATES.md records commands, evidence and limitations.


## Phase 4 implementation status — approved safe deletion

Deletion uses useNotes.deleteNote and the unchanged noteStorage adapter/key/schema. A five-field selected-note baseline plus existing raw-snapshot guard prevents known stale writes. No dependencies or package/lock changes. Read-only retry is not an automatic deletion or repair operation.


## Phase 5 implementation status — responsive masonry

Phase 5 implements ordered responsive masonry and scoped Paper Atelier visual refinement. One chronological semantic list uses non-dense CSS Grid auto-placement with 4px rows; a small presentation-only ResizeObserver hook supplies natural-height row spans, not coordinates or saved state. This measured CSS approach was prototyped against ordering/gutter criteria before implementation; it does not introduce a positioning library. Content width is capped at 1120px, with a 300px column target: 1/2/3 columns at 390/768/1440px. Missing ResizeObserver retains a readable ordinary-Grid fallback. CSS columns were rejected for column-major/balancing order; native masonry is not assumed.

The workspace/composer are more compact, card titles use editorial serif hierarchy, actions remain visible, and reduced-motion preferences suppress optional transitions. Note CRUD, validation, five-field schema, key, persistence safeguards and modal logic remain unchanged. README/GATES and artifacts/phase5 record actual tests, screenshots, accessibility/contrast findings and limitations. Voice input and all other excluded features remain unimplemented; no deployment is authorized. This status supersedes prior appendices that defer final masonry, without expanding product scope.


## Phase 6 implementation status — optional native dictation

The approved voice increment now enhances the existing composer only. Standard/prefixed native SpeechRecognition is feature-detected with explicit start/stop, textual/live states, provisional-only interim results and per-session final-index deduplication. Final text appends at the current draft end with a newline separator when needed; typing/editing stays available. Save waits for recognition to end and uses the unchanged validated persistence workflow. No auto-save/restart, custom audio backend/recorder, separate transcript persistence or dependency is introduced.

Hook cleanup invalidates callbacks and aborts on errors, unmount, page hiding or modal focus; stalled startup/stop are bounded. Unsupported/insecure environments retain typing. Browser speech processing may be remote and is not guaranteed offline; API presence does not guarantee usable hardware/service/permissions. Textual status and a restrained microphone glyph deliberately avoid a required animation. See README/GATES and artifacts/phase6 for actual mock-based verification, privacy boundaries, screenshots and unverified real-audio behavior. This status supersedes earlier appendices deferring voice, without changing the note schema/key or authorizing deployment.
