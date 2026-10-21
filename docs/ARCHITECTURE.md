# ARCHITECTURE.md — Sticky Notes App

## 1. Document Overview

| Field                   | Details                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Product                 | Sticky Notes App                                                                         |
| Document                | Software Architecture Specification                                                      |
| Product Type            | Responsive, local-first web application                                                  |
| Architecture Style      | Client-side, component-based frontend                                                    |
| Primary Framework       | React                                                                                    |
| Language                | TypeScript                                                                               |
| Build Tool              | Vite                                                                                     |
| Data Persistence        | Browser `localStorage`                                                                   |
| Voice Input             | Browser Speech Recognition API, where supported                                          |
| Backend                 | Not required for the MVP                                                                 |
| Database Server         | Not required                                                                             |
| Authentication          | Not required                                                                             |
| Product Source of Truth | `PRD.md`                                                                                 |
| Design Source of Truth  | `DESIGN.md`                                                                              |
| Technical Requirements  | `TRD.md`                                                                                 |
| Document Status         | Proposed architecture; verify against the actual repository and approved master workflow |

This document defines how the Sticky Notes App should be structured, implemented, tested, and maintained.

It establishes the architectural boundaries between the user interface, application state, note operations, browser APIs, and persistent storage.

The architecture must remain proportionate to the project's scope. The objective is a reliable, polished, maintainable frontend application—not a demonstration of unnecessary infrastructure.

### 1.1 Source-of-Truth Hierarchy

When making implementation decisions, follow this hierarchy:

1. Explicit user requirements and approved decisions.
2. `PRD.md` for product scope and functional behavior.
3. `DESIGN.md` for visual identity, interaction design, and accessibility expectations.
4. `TRD.md` for technical requirements and repository conventions.
5. `ARCHITECTURE.md` for component boundaries, data flow, and system structure.
6. The approved `MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW` for development sequencing, tools, quality gates, and delivery practices.
7. Existing repository configuration and implementation, after inspection and reconciliation with the documents above.

If two documents conflict, do not silently invent a resolution. Record the conflict and obtain approval when it changes product scope or an established technical decision.

**Important:** The actual master workflow has not been reproduced in this document. The coding agent must inspect its available instructions before finalizing the architecture. The stack and structure below are proposed until verified against that workflow and the actual repository.

---

## 2. Architectural Goals

The architecture must support the following goals.

### 2.1 Functional Goals

- Create notes with a title and text content.
- Display saved notes in a responsive masonry-style collection.
- Edit existing notes.
- Delete notes safely.
- Preserve notes across page refreshes and browser sessions.
- Support voice-to-text when the browser provides compatible speech recognition.
- Provide useful feedback for empty collections, validation errors, storage failures, and speech-recognition failures.

### 2.2 Engineering Goals

- Keep application logic separate from presentation.
- Maintain a single authoritative in-memory note collection.
- Centralize persistent storage operations.
- Isolate browser-specific speech-recognition behavior.
- Use strict TypeScript typing.
- Minimize external dependencies.
- Support automated testing without requiring a real browser storage environment for every unit test.
- Maintain responsive behavior and accessibility.
- Make the application straightforward to run, build, test, and deploy.

### 2.3 Non-Goals

The MVP does not require:

- A backend server.
- A REST or GraphQL API.
- A relational or document database server.
- User authentication or authorization.
- Cloud synchronization.
- Collaborative editing.
- Server-side rendering.
- AI services or language models.
- Background jobs or queues.
- Microservices.
- Complex state-management libraries.
- Analytics or third-party tracking.
- An abstraction layer for hypothetical future backends.

These must not be introduced without an approved requirement.

---

## 3. Recommended Technology Stack

The following is the proposed baseline stack. Versions must be resolved against the actual repository, the approved master workflow, package compatibility, and the official release information before installation.

| Layer                      | Recommended Technology                                        | Responsibility                                  |
| -------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Language                   | TypeScript with strict mode                                   | Type safety and maintainability                 |
| UI framework               | React                                                         | Components, rendering, and application state    |
| Build tooling              | Vite                                                          | Development server and production build         |
| Styling                    | CSS Modules or the repository's established CSS convention    | Component styling and responsive layout         |
| Design tokens              | CSS custom properties                                         | Centralized visual design system                |
| State management           | React state and hooks                                         | Note collection and UI state                    |
| Persistence                | Browser `localStorage`                                        | Local note persistence                          |
| Speech recognition         | Browser Speech Recognition API where supported                | Voice-to-text input                             |
| Unit and component testing | Vitest and React Testing Library                              | Application behavior and component tests        |
| Browser testing            | Playwright                                                    | End-to-end interaction and browser verification |
| Accessibility testing      | `axe-core` integration where compatible, plus manual checks   | Accessibility verification                      |
| Linting                    | ESLint                                                        | Static code-quality checks                      |
| Formatting                 | Prettier                                                      | Consistent source formatting                    |
| Version control            | Git                                                           | Source history and incremental delivery         |
| Package manager            | Existing repository package manager                           | Dependency installation and reproducible builds |
| Hosting                    | Static hosting provider, selected when deployment is approved | Distribution of production assets               |

### 3.1 Technology Selection Rules

**React and TypeScript**

React provides component-based UI development and built-in state management. TypeScript helps keep note models, component properties, persistence contracts, and browser API boundaries consistent.

Use React's built-in state mechanisms unless the approved workflow or actual project requirements establish a justified alternative.

**Vite**

Vite provides a lightweight development and production build workflow appropriate for a frontend-only application.

No server-side framework is needed for the stated MVP.

**CSS Modules or Existing Styling Convention**

Follow the repository's established styling convention. If no convention exists, CSS Modules with global design tokens are a suitable default.

The architecture must not introduce multiple competing styling systems.

**React State**

The application has one main domain collection and a small amount of transient interface state. A dedicated global state-management library is unnecessary.

**Local Storage**

Browser storage satisfies the persistence requirement without introducing a backend, database administration, or credentials.

**Speech Recognition**

Use browser speech recognition when available. Voice input must remain an optional enhancement; typing and all core note operations must work independently of it.

**Testing Tools**

Use the test stack already established by the repository or master workflow. Do not add duplicate testing frameworks if suitable tooling is already configured.

### 3.2 Version Policy

Do not invent exact dependency versions or claim that packages have been installed.

Before implementation:

1. Inspect `package.json` and the lockfile.
2. Inspect the installed Node.js and package-manager versions.
3. Verify compatibility between React, Vite, TypeScript, and the test tooling.
4. Follow the approved workflow's version policy.
5. Preserve existing compatible dependencies.
6. Record any necessary upgrade or migration decision.

Pin or lock dependencies according to the repository's package-management conventions.

---

## 4. System Architecture

### 4.1 Architecture Style

Use a **single-page, client-side React application with a local-first data model**.

The system consists of five logical layers:

1. Presentation components.
2. Feature-level application logic.
3. Domain models and note operations.
4. Browser service adapters.
5. Browser-provided runtime capabilities.

These are logical boundaries, not separate applications or deployable services.

### 4.2 High-Level Architecture

\<CodeBlock language="mermaid" model_previewable> flowchart TD     U["User"]     UI["React UI Components"]     STATE["React State and Hooks"]     DOMAIN["Note Operations and Validation"]     STORE["Local Storage Adapter"]     LS["Browser localStorage"]     VOICE["Speech Recognition Adapter"]     SPEECH["Browser Speech Recognition API"]

```
U --> UI
UI <--> STATE
STATE --> DOMAIN
DOMAIN --> STORE
STORE <--> LS
UI <--> VOICE
VOICE <--> SPEECH
VOICE --> UI
DOMAIN --> STATE
```

\</CodeBlock>

### 4.3 Layer Responsibilities

#### Presentation Layer

Responsible for:

- Rendering the workspace.
- Rendering the composer and note cards.
- Collecting user input.
- Displaying validation messages and notifications.
- Displaying voice-recognition states.
- Managing accessible dialogs and interaction feedback.
- Applying the approved design system.

It must not directly manipulate `localStorage` or implement speech-recognition lifecycle management.

#### Application Layer

Responsible for:

- Coordinating note creation, editing, and deletion.
- Managing transient UI state.
- Coordinating validation and persistence.
- Updating the visible collection.
- Handling save failures.
- Managing the active editing session.
- Exposing clear actions to presentation components.

This layer may use a custom React hook when doing so provides a clear and testable boundary.

#### Domain Layer

Responsible for:

- Note data contracts.
- Note input validation.
- Note creation and update rules.
- Identifier generation through a suitable browser API.
- Timestamp management.
- Pure transformations of note collections.

The domain layer should remain independent of React rendering and browser storage.

#### Browser Service Layer

Responsible for:

- Reading and writing persisted notes.
- Validating stored data before use.
- Handling unavailable storage and serialization failures.
- Feature-detecting speech recognition.
- Starting, stopping, and cleaning up recognition sessions.
- Translating browser-specific results into application-level data.

#### Browser Runtime

Provides:

- `localStorage`.
- Speech-recognition capabilities where implemented.
- UUID generation where supported.
- DOM and accessibility behavior.
- Browser events and lifecycle notifications.

The application must detect unsupported capabilities rather than assuming that every browser implements every API.

---

## 5. Data Flow

### 5.1 Application Initialization

1. The application initializes its React root.
2. The note repository attempts to read the configured storage key.
3. The stored value is parsed and validated.
4. Valid notes initialize the in-memory collection.
5. The workspace renders the notes or the empty state.
6. If reading or validation fails, the application enters an appropriate recovery state instead of silently treating the collection as empty.

Because `localStorage` is synchronous, the MVP does not need an artificial loading screen.

A brief initialization state is acceptable if required to distinguish an unresolved storage operation from a confirmed empty collection.

### 5.2 Creating a Note

1. The user enters a title, content, or both, according to the approved PRD validation rules.
2. The composer maintains the current draft.
3. The application validates the input.
4. The domain operation constructs a note with a unique ID and timestamps.
5. The application prepares the updated note collection.
6. Persistence is attempted through the storage adapter.
7. On success, the application commits the new collection to visible state and resets the composer.
8. On failure, the draft is preserved and an error is shown.

The implementation must avoid showing a successful-save state before persistence has succeeded.

### 5.3 Editing a Note

1. The user activates Edit on an existing note.
2. The editor receives the saved note's ID and initial values.
3. The user modifies the title or content.
4. The application validates the changes.
5. The update operation preserves the note ID and original creation timestamp.
6. The update timestamp is refreshed.
7. Persistence is attempted.
8. On success, the updated collection becomes visible.
9. On failure, the editor preserves the user's changes and communicates the problem.

### 5.4 Deleting a Note

1. The user activates Delete.
2. The approved deletion interaction is presented.
3. The user confirms the action.
4. The application prepares the collection without the selected note.
5. The updated collection is persisted.
6. On success, the note disappears from the workspace.
7. On failure, the application retains the note and reports the failure.

Do not remove the note permanently from visible state before a persistence attempt succeeds unless a deliberately reversible deletion model has been approved.

### 5.5 Voice-to-Text

1. The application detects speech-recognition support.
2. The user activates the microphone control.
3. The browser requests microphone permission if needed.
4. The speech adapter starts a recognition session.
5. Recognition results are passed to the composer.
6. The user reviews and corrects the resulting text.
7. The user explicitly saves the note.
8. The speech adapter stops and cleans up when appropriate.

Speech recognition must never automatically create a note or submit a draft without user confirmation.

### 5.6 State and Persistence Consistency

The in-memory note collection is the authoritative state during the current session, but a mutation is not considered successfully saved until the persistence operation succeeds.

All note mutations must pass through one application-level operation path. Components must not independently construct storage updates.

Avoid duplicate sources of truth, such as maintaining separate copies of the entire note collection in multiple hooks.

---

## 6. Domain Model

### 6.1 Note Entity

The baseline note entity contains the following fields.

| Field       | Type   | Purpose                     | Rules                                               |
| ----------- | ------ | --------------------------- | --------------------------------------------------- |
| `id`        | String | Unique note identifier      | Required and unique                                 |
| `title`     | String | Optional note title         | Empty when omitted, according to the approved PRD   |
| `content`   | String | Main note text              | Required according to the approved validation rules |
| `createdAt` | String | Creation timestamp          | ISO 8601 representation                             |
| `updatedAt` | String | Last modification timestamp | ISO 8601 representation                             |

No additional product fields should be added without an approved requirement.

In particular, do not introduce labels, folders, reminders, pinning, collaboration metadata, or user identifiers.

### 6.2 Note Creation Input

Creation input should contain only the editable fields required by the product.

The application generates the ID and timestamps. These values must not be trusted from arbitrary user input.

### 6.3 Note Update Input

An update identifies the existing note and provides the changed editable fields.

The operation must preserve the original ID and `createdAt` value while updating `updatedAt`.

### 6.4 Identifier Generation

Use a suitable browser-supported unique identifier mechanism, preferably `crypto.randomUUID()` when available in the supported runtime.

If compatibility requirements demand a fallback, document and test it before implementation. Do not use array indexes or timestamps alone as identifiers.

### 6.5 Timestamp Rules

- Store timestamps as ISO 8601 strings.
- Generate timestamps consistently.
- Keep the creation timestamp unchanged during edits.
- Update the modification timestamp only when a meaningful update is accepted.
- Format timestamps for display at the presentation layer.
- Avoid hardcoding display strings into stored data.

---

## 7. Persistence Architecture

### 7.1 Storage Strategy

Use browser `localStorage` as the only persistence mechanism for the MVP.

No database server, backend API, ORM, database client, or synchronization service is required.

### 7.2 Storage Key

Use a namespaced, versioned key:

`sticky-notes:notes:v1`

This is a proposed key and should be confirmed against the existing repository before implementation.

The namespace reduces collisions with unrelated applications running on the same origin.

### 7.3 Serialization Format

Persist the collection as one JSON array containing note objects.

The persisted representation must conform to the note contract in Section 6.

Use one authoritative collection key for the MVP. Avoid creating a separate key for every note unless a documented requirement justifies that change.

### 7.4 Storage Adapter

All storage reads and writes must pass through a dedicated adapter.

Responsibilities:

- Read the configured key.
- Parse JSON safely.
- Validate the overall structure and each note.
- Serialize valid note collections.
- Catch storage access and quota errors.
- Return clear success or failure results.
- Avoid silently replacing unreadable data.
- Provide an explicit recovery path where possible.

Presentation components must never call `localStorage.getItem()` or `localStorage.setItem()` directly.

### 7.5 Startup Validation

On startup:

1. Check whether browser storage is accessible.
2. Read the configured key.
3. Distinguish a missing key from an existing stored value.
4. Parse JSON inside an error boundary.
5. Validate field types and required values.
6. Reject malformed records or enter a documented recovery state.
7. Never automatically overwrite an unreadable collection with an empty array.

If individual records are invalid, do not silently discard them and rewrite the collection without an explicit, documented recovery policy.

### 7.6 Write Strategy

For every accepted note mutation:

1. Build the proposed updated collection.
2. Attempt to serialize and persist it.
3. If persistence succeeds, update the visible authoritative collection.
4. If persistence fails, retain the existing saved collection and preserve the user's draft or edited values.

This approach prevents ordinary storage failures from being misrepresented as successful operations.

The storage adapter must be designed so storage errors can be surfaced to the application layer.

### 7.7 Storage Limitations

The application must clearly recognize that `localStorage`:

- Is specific to the current browser origin and storage environment.
- Does not automatically synchronize across devices.
- Can be cleared by the user or browser.
- Can become unavailable or exceed its quota.
- Does not provide a backup guarantee.
- Is not suitable for storing secrets.
- Does not provide a transactional multi-user database.

Do not describe local storage as cloud storage or guaranteed permanent storage.

### 7.8 Future Migration

If a backend is approved in the future, introduce a repository interface that separates the application's note operations from the concrete storage implementation.

Do not build a generalized multi-backend framework for the MVP. The existing storage adapter is sufficient until a real migration requirement exists.

---

## 8. React State Management

### 8.1 State Ownership

Use React's built-in state and hooks.

The following ownership model is recommended:

| State                      | Owner                                            |
| -------------------------- | ------------------------------------------------ |
| Note collection            | Workspace-level state or a focused notes hook    |
| New-note draft             | Composer                                         |
| Active editing ID          | Workspace or notes hook                          |
| Editing field values       | Editor                                           |
| Delete confirmation target | Workspace or dialog controller                   |
| Storage status             | Workspace-level application state                |
| Voice-recognition status   | Voice input hook or adapter                      |
| Recognition transcript     | Composer or voice-input state                    |
| Field validation errors    | Relevant form                                    |
| Temporary status message   | Small notification component or focused UI state |

Avoid putting all interface state into one large object unless the existing workflow specifically requires it.

### 8.2 Recommended Hooks

Use custom hooks only where they establish a useful responsibility boundary.

**`useNotes`**

Coordinates:

- Initial note loading.
- Create operations.
- Update operations.
- Delete operations.
- Persistence feedback.
- Note collection state.

**`useSpeechRecognition`**

Coordinates:

- Support detection.
- Recognition status.
- Start and stop operations.
- Transcript delivery.
- Permission and recognition errors.
- Cleanup when the component unmounts.

These names describe proposed responsibilities, not existing files.

### 8.3 State Update Rules

- Use predictable, immutable state updates.
- Avoid mutating existing note objects or arrays.
- Do not duplicate derived values without a reason.
- Keep form drafts separate from persisted notes.
- Do not synchronize storage from multiple independent effects.
- Ensure updates and deletes target a stable note ID.
- Keep transient dialog and notification state separate from the persisted domain model.

### 8.4 Avoiding Unnecessary Complexity

Do not introduce Redux, Zustand, a server-state library, or a context-based global store unless actual requirements establish a need.

The application does not have remote server state, multiple users, or complex cross-page workflows.

---

## 9. Frontend Component Architecture

### 9.1 Component Boundaries

The application should use a small set of focused components.

#### Application Components

- `App`: application initialization and top-level composition.
- `AppHeader`: product identity and compact workspace heading.
- `NotesWorkspace`: coordinates the composer and note collection.
- `NotesCollection`: displays the empty state or note grid.
- `NoteCard`: displays one saved note and its actions.
- `NoteComposer`: creates a new note.
- `NoteEditor`: edits an existing note.
- `VoiceInputButton`: exposes speech-recognition controls.
- `ConfirmDeleteDialog`: confirms destructive actions.
- `StatusMessage`: displays meaningful operation feedback.
- `EmptyState`: encourages initial note creation.
- `NotFoundPage`: provides a recovery route for invalid URLs.

Component names may be adapted to the existing project conventions, but responsibilities must remain explicit.

### 9.2 Component Responsibility Rules

`App` must not contain all note operations, persistence logic, form handling, and voice-recognition code.

`NoteCard` must not own the complete note collection or access browser storage.

`NoteComposer` must not generate and persist records independently of the shared note-operation path.

`VoiceInputButton` must not implement unrelated note creation or deletion logic.

`ConfirmDeleteDialog` must communicate the user's decision through explicit callbacks rather than mutating note data.

`NotesCollection` must focus on rendering and layout rather than implementing persistence.

### 9.3 Communication

Use props and callbacks for communication between components.

The workspace or notes hook coordinates domain mutations. Child components report user intent; they do not independently change the persisted collection.

Do not introduce a complex event bus or generalized command framework.

---

## 10. Masonry Layout Architecture

### 10.1 Recommended Approach

Use a responsive CSS-based layout, subject to validation against the supported browsers and the accessibility requirements in `DESIGN.md`.

The implementation should support variable-height cards without requiring a masonry package by default.

### 10.2 Layout Requirements

- Use the approved content-width and spacing tokens.
- Allow note cards to grow naturally with their content.
- Adapt the column count to available width.
- Avoid card overlap.
- Preserve readable line lengths.
- Prevent horizontal overflow.
- Keep card actions accessible on touch devices.
- Ensure the visual arrangement does not break keyboard navigation.

### 10.3 Reading Order

Visual masonry order and DOM order can differ depending on the implementation technique.

The chosen solution must be verified for:

- Logical screen-reader reading order.
- Predictable keyboard navigation.
- Stable focus when notes are added or removed.
- Reasonable visual scanning.
- Correct responsive behavior.

If a CSS masonry technique produces a confusing reading order or inconsistent browser support, use a simpler grid arrangement with variable card heights.

Do not introduce JavaScript layout measurement, a complex positioning engine, or a dedicated masonry dependency unless testing establishes that it is necessary.

---

## 11. Voice-to-Text Architecture

### 11.1 Browser API Boundary

Encapsulate speech recognition behind a small browser-specific adapter and, where useful, a React hook.

The rest of the application must not depend directly on vendor-specific recognition events.

### 11.2 Feature Detection

Before displaying an active voice-input capability:

- Detect whether a supported speech-recognition interface exists.
- Account for the browser's implemented API variant.
- Handle missing interfaces without throwing errors.
- Provide an accessible explanation when voice input is unavailable.
- Preserve manual text entry in every case.

### 11.3 Recognition States

The application should represent at least the following states:

- `unsupported`
- `idle`
- `requesting-permission`
- `listening`
- `processing`
- `error`

The exact state representation can be adjusted to the actual API lifecycle, but the UI must distinguish active listening from an inactive or failed state.

### 11.4 Transcript Handling

- Deliver recognized text to the active composer.
- Preserve text already entered manually.
- Define whether interim recognition results are displayed before implementation.
- Prevent repeated final results from being appended more than once.
- Allow users to edit transcription.
- Never automatically save a note from a transcript.
- Do not persist microphone recordings or raw audio.

The default proposed behavior is to append finalized recognition text at the current insertion point or to the end of the current draft, with sensible spacing. This interaction should be confirmed before implementation.

### 11.5 Permissions and Errors

Handle:

- Permission denial.
- Unsupported browser APIs.
- Recognition service failures.
- Recognition interruption.
- Empty recognition results.
- Unexpected session termination.
- Attempts to start multiple simultaneous recognition sessions.

Error feedback must be clear, concise, and nonblocking.

### 11.6 Privacy

The application must not claim that all speech recognition happens locally.

Browser speech-recognition implementations may process speech through a browser or platform service. The application must not transmit audio through a custom backend, and it must communicate the feature's limitations honestly where appropriate.

The user must explicitly initiate voice recognition. Provide a visible way to stop it.

### 11.7 Cleanup

Stop active recognition and remove event handlers when the session ends or the relevant component unmounts.

Prevent duplicate listeners, stale callbacks, and updates to unmounted components.

---

## 12. Routing Architecture

### 12.1 MVP Routes

The approved design defines the following routes:

| Route | Purpose              |
| ----- | -------------------- |
| `/`   | Main notes workspace |
| `*`   | Not-found fallback   |

The MVP does not require a dedicated page for each note.

### 12.2 Routing Strategy

Because the application has a minimal route inventory, avoid adding a routing library unless the existing repository or master workflow already uses one.

A simple routing mechanism compatible with the approved requirements is sufficient.

If a routing dependency is already established, preserve it when compatible with this architecture.

### 12.3 Route Behavior

- The root route renders the notes workspace.
- Unknown routes render the not-found page.
- The not-found page provides a clear return path to `/`.
- Route handling must not introduce unnecessary network calls.
- Core note operations must remain independent of route changes.

The implementation must be verified against the selected hosting provider's fallback behavior if client-side routing is used.

---

## 13. API, Backend, and External Services

### 13.1 Backend

No backend is required for the MVP.

The application must not create a server merely to wrap local storage operations.

### 13.2 API Architecture

No application-owned REST, GraphQL, or RPC API is required.

The UI communicates with application logic through function calls, hooks, and component callbacks.

### 13.3 Database

No external database is required.

The browser's `localStorage` provides the requested persistence mechanism.

### 13.4 External Services

No third-party application service is required for the core functionality.

Potential browser speech-recognition services are controlled by the browser and platform implementation. They must not be confused with an application-owned backend.

### 13.5 AI Architecture

No AI model, LLM integration, vector database, prompt pipeline, or AI API is required.

The product's voice-to-text challenge is speech recognition, not AI-generated note content.

### 13.6 Hosting

A static hosting provider is sufficient for the production frontend.

The provider must be selected according to the approved master workflow and deployment requirements. Do not assume a provider or create a deployment account without authorization.

---

## 14. File and Folder Structure

The following is the proposed project structure. It must be reconciled with the actual repository and the master workflow before implementation.

Do not create a second application structure if the repository already has an approved, compatible organization.

```
sticky-notes-app/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── notes/
│   │   │   ├── NoteComposer.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NotesCollection.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── voice/
│   │   │   └── VoiceInputButton.tsx
│   │   │
│   │   └── feedback/
│   │       ├── ConfirmDeleteDialog.tsx
│   │       └── StatusMessage.tsx
│   │
│   ├── features/
│   │   └── notes/
│   │       ├── useNotes.ts
│   │       ├── noteOperations.ts
│   │       ├── noteValidation.ts
│   │       └── noteTypes.ts
│   │
│   ├── hooks/
│   │   └── useSpeechRecognition.ts
│   │
│   ├── services/
│   │   ├── noteStorage.ts
│   │   └── speechRecognition.ts
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   │
│   ├── test/
│   │   ├── setup.ts
│   │   └── testUtils.tsx
│   │
│   └── types/
│       └── speech-recognition.d.ts
│
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── DESIGN.md
│   └── ARCHITECTURE.md
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── README.md
└── .env.example
```

This tree is illustrative. The actual package manager determines the lockfile name, and the selected Vite template determines the exact TypeScript configuration files.

### 14.1 File Responsibilities

| File or Directory                  | Responsibility                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/app/App.tsx`                  | Top-level application composition and minimal route selection                                |
| `src/app/main.tsx`                 | React root initialization and global stylesheet import                                       |
| `components/layout/`               | Shared application layout and route-level fallback                                           |
| `components/notes/`                | Composer, editor, card, collection, and empty-state UI                                       |
| `components/voice/`                | Voice-input control                                                                          |
| `components/feedback/`             | Confirmation and status feedback components                                                  |
| `features/notes/useNotes.ts`       | Coordinates note state and persistence operations                                            |
| `features/notes/noteOperations.ts` | Pure creation, update, deletion, and collection operations                                   |
| `features/notes/noteValidation.ts` | Validation rules for user-entered note data                                                  |
| `features/notes/noteTypes.ts`      | Note and note-operation TypeScript contracts                                                 |
| `hooks/useSpeechRecognition.ts`    | React-facing recognition state and lifecycle coordination                                    |
| `services/noteStorage.ts`          | Storage reads, writes, parsing, and error handling                                           |
| `services/speechRecognition.ts`    | Browser API detection and recognition lifecycle adapter                                      |
| `styles/tokens.css`                | Shared colors, typography, spacing, and other design tokens                                  |
| `styles/global.css`                | Global resets, body styling, base typography, and accessibility defaults                     |
| `styles/utilities.css`             | Small shared styling utilities, only where justified                                         |
| `test/setup.ts`                    | Test environment setup                                                                       |
| `test/testUtils.tsx`               | Shared test rendering helpers, if needed                                                     |
| `types/speech-recognition.d.ts`    | Minimal supplemental type declarations only if required by the selected TypeScript libraries |
| `docs/`                            | Approved project documentation                                                               |
| `index.html`                       | Application document shell and metadata                                                      |
| `package.json`                     | Dependencies and verified project scripts                                                    |
| `tsconfig*.json`                   | TypeScript compiler configuration                                                            |
| `vite.config.ts`                   | Vite build and development configuration                                                     |
| `vitest.config.ts`                 | Vitest configuration, if separate configuration is needed                                    |
| `eslint.config.js`                 | Lint rules                                                                                   |
| `.prettierrc`                      | Formatting configuration, following repository conventions                                   |
| `.gitignore`                       | Excludes generated artifacts, local secrets, and dependencies                                |
| `README.md`                        | Setup, scripts, usage, and known limitations                                                 |
| `.env.example`                     | Documents any genuinely required environment variables; no values or credentials are assumed |

### 14.2 Folder Structure Constraints

- Do not create empty folders solely because they appear in the proposed tree.
- Do not duplicate the note model across multiple files.
- Do not place storage logic in components.
- Do not introduce a repository, use-case, controller, and service layer for every simple operation.
- Do not add a separate configuration framework for a small frontend application.
- Do not create a general-purpose shared component library for components used only once.
- Keep test files close to the code they verify if that matches the established workflow.
- Preserve the actual repository's package-manager and configuration conventions.

The purpose of the structure is to clarify responsibility, not to maximize the number of files.

---

## 15. Environment and Configuration

### 15.1 Environment Variables

The baseline MVP requires no application-specific environment variables.

It does not need:

- Database credentials.
- Authentication secrets.
- Backend API keys.
- Speech-recognition API keys.
- AI provider keys.
- Cloud storage credentials.

Do not invent environment variables for capabilities already provided by the browser.

### 15.2 Vite Configuration

Use Vite's existing configuration and the approved repository conventions.

Only introduce configuration that is justified by an actual need, such as:

- Development server settings.
- Build output configuration.
- Test integration.
- A documented client-side route fallback when required by the deployment provider.

Do not add arbitrary build plugins.

### 15.3 Environment File Policy

If `.env.example` is retained for workflow consistency, document that no variables are currently required.

Never commit real secrets, credentials, or private environment files.

Remember that environment variables exposed to a browser bundle are public. Client-side environment configuration must never be used to hide secrets.

### 15.4 Development and Production

Development and production must use the same application behavior and storage contract.

Differences should be limited to the build process, source maps, debugging settings, and other justified environment-specific configuration.

Do not use production-only behavior that silently changes how notes are stored or validated.

### 15.5 Package Scripts

The project should expose appropriate scripts for:

- Starting development.
- Building for production.
- Previewing the production build.
- Running unit and component tests.
- Running lint checks.
- Running formatting checks.
- Running browser tests, if configured.

The coding agent must use actual scripts defined in `package.json`. This document does not claim that any scripts have already been configured.

---

## 16. Error Handling and Recovery

### 16.1 General Principles

- Fail explicitly rather than silently.
- Preserve user-entered content wherever possible.
- Never report a failed persistence operation as successful.
- Keep browser API errors away from presentation components.
- Translate technical failures into understandable user feedback.
- Avoid logging sensitive note content.
- Do not silently overwrite unreadable persisted data.
- Ensure an error in voice recognition does not break manual note-taking.

### 16.2 Error Categories

| Error                            | Detection Layer                         | Application Response                               |
| -------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Invalid note input               | Validation                              | Preserve input and show field feedback             |
| Missing or malformed stored JSON | Storage adapter                         | Enter a recoverable storage-error state            |
| Browser storage unavailable      | Storage adapter                         | Preserve current draft and communicate limitations |
| Storage quota exceeded           | Storage adapter                         | Keep the prior saved collection and report failure |
| Failed note update               | Application layer                       | Preserve edits and allow retry                     |
| Failed deletion persistence      | Application layer                       | Keep the note visible and report failure           |
| Speech API unsupported           | Speech adapter                          | Disable voice input gracefully                     |
| Permission denied                | Speech adapter                          | Explain the problem and retain manual input        |
| Recognition interruption         | Speech adapter                          | Stop listening safely and preserve the transcript  |
| Unexpected UI error              | React error boundary, where appropriate | Display a recovery-oriented fallback               |

### 16.3 Error Boundaries

Use a React error boundary for unexpected rendering failures where justified by the project's architecture.

An error boundary is not a replacement for ordinary storage, validation, and speech-recognition error handling.

### 16.4 Logging

The MVP does not require an external logging or monitoring service.

During development, use appropriate diagnostics without logging full note contents unnecessarily.

Production error reporting should remain local and privacy-conscious unless external monitoring is separately approved.

### 16.5 Recovery Policy

If the existing note collection cannot be read reliably, the application must not automatically write an empty collection over the same storage key.

Recovery must be deliberate, transparent, and documented.

If data appears malformed, preserve the original value until a safe recovery or replacement operation has been approved by the application's recovery logic.

---

## 17. Security and Privacy Boundaries

### 17.1 Threat Model

This application stores user-created text in the browser and does not provide authentication, server-side access controls, or remote synchronization.

Its main security concerns are:

- Unsafe rendering of user-entered content.
- Unintended disclosure through logging or external services.
- Destructive storage recovery.
- Browser storage limitations.
- Misleading microphone permission behavior.
- Accidental inclusion of secrets in the frontend bundle.

### 17.2 User-Entered Content

- Render note titles and content as text.
- Do not interpret note content as executable HTML.
- Do not use unsafe HTML injection for rendering notes.
- Preserve multiline text using appropriate styling.
- Avoid introducing a rich-text rendering engine without an approved requirement.

### 17.3 Browser Storage

- Treat persisted data as untrusted input.
- Validate parsed records before using them.
- Catch malformed JSON and storage access errors.
- Do not store credentials or secrets in the notes collection.
- Do not claim that local storage is encrypted.
- Do not claim that notes are protected against other scripts executing on the same origin.

### 17.4 Speech Recognition

- Require an explicit user action to start recognition.
- Communicate active listening visibly and accessibly.
- Allow users to stop recognition.
- Do not collect or persist raw microphone audio.
- Do not transmit audio through a custom application backend.
- Be transparent that browser speech recognition may rely on external browser or platform services.

### 17.5 Dependency Security

- Use only dependencies justified by the project.
- Preserve and review the package lockfile.
- Follow the established dependency auditing workflow.
- Avoid adding third-party scripts for decorative effects.
- Do not load arbitrary executable code from remote sources.

### 17.6 Content Security

Use the browser and deployment platform's available security configuration appropriately. Avoid introducing a complex security framework for an application without a backend.

If the deployment platform supports security headers, apply suitable headers according to the actual asset and hosting requirements.

---

## 18. Performance and Browser Compatibility

### 18.1 Performance Goals

The application should remain responsive during ordinary note-taking.

- Render the initial workspace without unnecessary network requests.
- Avoid expensive calculations during ordinary state changes.
- Keep note operations straightforward.
- Avoid unnecessary React re-renders.
- Keep CSS animations short and purposeful.
- Avoid large animation libraries for simple effects.
- Do not add virtualization unless actual performance measurements justify it.

### 18.2 Browser Support

Core note-taking must work in supported modern browsers with React-compatible runtime features.

The exact minimum browser versions must be confirmed against the selected dependencies and the master workflow.

Voice recognition may have narrower support than the rest of the application.

### 18.3 Graceful Degradation

If a browser lacks speech recognition:

- Notes must still load.
- The user must still create, edit, and delete notes.
- Local persistence must continue to work.
- The interface must explain that voice input is unavailable.

Do not make the entire application dependent on an optional browser API.

### 18.4 Storage Scale

The MVP is intended for a personal collection of short notes.

Do not implement pagination, indexing infrastructure, background processing, or virtualization without evidence of a real performance problem.

---

## 19. Testing Architecture

Testing must verify behavior, data integrity, accessibility, and the rendered experience.

Use the testing tools established by the actual repository and master workflow. The tools listed below are proposed choices, not claims about the current project configuration.

### 19.1 Unit Tests

Recommended coverage:

- Note creation and identifier generation.
- Note update behavior.
- Preservation of creation timestamps.
- Modification timestamp updates.
- Note deletion.
- Input validation.
- Malformed persisted-data validation.
- Serialization and parsing.
- Error-result handling.

Domain operations should be testable without mounting React components.

### 19.2 Storage Tests

Verify:

- A missing storage key initializes an empty collection.
- Valid stored notes load correctly.
- Malformed JSON does not crash the application.
- Invalid records are handled according to the documented recovery policy.
- Storage access failures are reported.
- Quota or write failures do not falsely indicate success.
- Failed writes do not silently replace the existing saved collection.

Use mocked storage or an isolated test environment where appropriate.

### 19.3 Component Tests

Verify:

- The composer accepts text.
- Invalid drafts produce appropriate feedback.
- Successful creation clears the draft only after success.
- Notes render correctly in the collection.
- Edit actions populate the editor.
- Update actions preserve note identity.
- Delete confirmation behaves correctly.
- Empty and error states render correctly.
- Keyboard users can operate essential controls.

### 19.4 Voice-Recognition Tests

Mock browser speech-recognition behavior where necessary.

Verify:

- Unsupported browsers receive a usable fallback.
- Listening status is represented correctly.
- Recognition results reach the composer.
- Repeated events do not duplicate finalized text.
- Recognition errors are handled.
- Recognition stops and cleans up correctly.
- Manual note entry remains functional.

Do not require a real microphone or external speech service for routine automated tests.

### 19.5 End-to-End Tests

Use Playwright if approved by the existing workflow.

Critical journeys should include:

1. Open the workspace.
2. Create a note.
3. Refresh the page and verify persistence.
4. Edit the note.
5. Verify the updated content after refresh.
6. Delete the note.
7. Verify the empty state when appropriate.
8. Exercise storage-failure feedback where practical.
9. Verify the voice-input fallback.
10. Test representative mobile and desktop viewports.

### 19.6 Accessibility Tests

Combine automated checks with manual verification.

Verify:

- Keyboard navigation.
- Focus visibility.
- Dialog focus management.
- Semantic structure.
- Form labeling and error announcements.
- Color contrast.
- Touch-target usability.
- Reduced-motion behavior.

Automated accessibility tooling must not be treated as proof of complete WCAG compliance.

### 19.7 Visual QA

Review the rendered application against `DESIGN.md`.

Test representative viewports and inspect:

- Header and composer alignment.
- Typography and line lengths.
- Masonry composition.
- Note color distribution.
- Dialog positioning.
- Responsive controls.
- Empty and error states.
- Hover, focus, listening, and deletion states.

Use visual refinement skills from the approved workflow where useful, but do not introduce dependencies solely to achieve a visual effect.

### 19.8 Build and Quality Gates

Before delivery:

- TypeScript checks pass.
- Lint checks pass.
- Formatting checks pass.
- Relevant unit and component tests pass.
- Critical end-to-end journeys pass.
- The production build succeeds.
- No known critical browser errors remain.
- Responsive and accessibility checks are completed.
- The README and technical documentation reflect the actual implementation.

Exact commands must come from the repository's configured scripts.

---

## 20. Deployment Architecture

### 20.1 Deployment Model

Deploy the production frontend as a static web application.

A static deployment is sufficient because the application has no application-owned backend.

### 20.2 Deployment Requirements

- Serve the production build over HTTPS.
- Ensure the root route loads correctly.
- Configure fallback behavior if client-side route handling requires it.
- Confirm that the application works in the deployed origin.
- Verify that `localStorage` persists between sessions on that origin.
- Test speech recognition in the deployed browser environment.
- Confirm that the deployment does not require private environment variables.
- Run a production smoke test after deployment.

### 20.3 Origin-Specific Persistence

Browser storage belongs to a specific origin.

Notes created on a local development origin will not automatically appear on the production domain. Notes may also differ between browsers or browser profiles.

This behavior is expected for the local-first MVP and must not be described as a synchronization defect.

### 20.4 Deployment Approval

The hosting provider and deployment authorization remain pending if not already specified in the approved workflow.

Do not create accounts, incur costs, configure external credentials, or publish the application without appropriate authorization.

---

## 21. MVP Versus Future Scalability

### 21.1 MVP Architecture

The MVP should contain:

- One React application.
- One notes workspace.
- One shared note collection in application state.
- One local storage adapter.
- One speech-recognition adapter.
- A small collection of reusable UI components.
- A responsive CSS-based masonry layout.
- Automated tests and browser-level verification.
- Static deployment when approved.

### 21.2 Future Changes Requiring Architectural Review

The following are not part of the current architecture, but would require reassessment if approved later:

| Future Requirement     | Architectural Impact                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Cloud synchronization  | Requires a backend, remote persistence, conflict resolution, and synchronization rules |
| User accounts          | Requires authentication, authorization, account-scoped data, and server-side security  |
| Collaborative editing  | Requires shared data coordination and concurrent-update handling                       |
| Cross-device access    | Requires remote storage and synchronization                                            |
| Rich-text editing      | Requires an editor model, sanitization, and additional accessibility testing           |
| Large note collections | May justify performance profiling and collection-rendering optimization                |
| Import/export          | Requires an approved file format and safe import validation                            |
| Multiple workspaces    | Requires a revised data model and navigation structure                                 |

Do not implement these hypothetical capabilities in advance.

### 21.3 Migration Principles

If scope changes:

1. Update `PRD.md` to establish the approved behavior.
2. Update `TRD.md` to establish the new technical requirements.
3. Update this document to reflect the approved architecture.
4. Update `DESIGN.md` if the new functionality changes the user experience.
5. Document migration, compatibility, and recovery implications.
6. Implement the smallest architecture that reliably supports the new requirement.

---

## 22. Architecture Decisions and Approval Register

| Decision                      | Proposed Choice                                          | Status                                             | Reason / Impact                                        |
| ----------------------------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Frontend framework            | React                                                    | Confirm against repository and master workflow     | Matches the assigned learning goals                    |
| Language                      | TypeScript                                               | Proposed; confirm                                  | Improves maintainability and data-contract consistency |
| Build tooling                 | Vite                                                     | Proposed; confirm                                  | Lightweight frontend build system                      |
| State management              | React state and hooks                                    | Recommended                                        | Sufficient for the current application scope           |
| Persistence                   | Browser `localStorage`                                   | Required by PRD                                    | No backend required                                    |
| Storage key                   | `sticky-notes:notes:v1`                                  | Proposed                                           | Namespaced and versioned                               |
| Note model                    | ID, title, content, creation timestamp, update timestamp | Required baseline                                  | Consistent domain representation                       |
| Voice recognition             | Browser Speech Recognition API where available           | Required challenge; compatibility must be verified | Avoids unnecessary external services                   |
| Masonry implementation        | Responsive CSS-based approach                            | Required; validate implementation                  | Minimizes dependencies                                 |
| Routing                       | Minimal root and not-found handling                      | Proposed; verify repository                        | Avoids unnecessary routing infrastructure              |
| Styling                       | Existing convention or CSS Modules with shared tokens    | Confirm                                            | Maintains visual consistency                           |
| Unit testing                  | Vitest and React Testing Library                         | Proposed; verify workflow                          | Covers domain and component behavior                   |
| Browser testing               | Playwright                                               | Proposed; verify workflow                          | Validates critical user journeys                       |
| Accessibility tooling         | Automated checks plus manual verification                | Required quality goal                              | Supports accessible implementation                     |
| Backend                       | None                                                     | Recommended for MVP                                | No server-side functionality is required               |
| Database                      | None                                                     | Recommended for MVP                                | Browser storage meets the assigned requirement         |
| Authentication                | None                                                     | Recommended for MVP                                | Personal, local-only workspace                         |
| External application services | None                                                     | Recommended for MVP                                | Reduces configuration and privacy complexity           |
| AI integration                | None                                                     | Recommended for MVP                                | No AI-powered feature is required                      |
| Hosting provider              | Static hosting                                           | Pending approval if unselected                     | Appropriate for a frontend-only application            |
| Environment variables         | None required by baseline                                | Confirm against repository                         | Avoids unnecessary configuration                       |
| Product branding              | Follow approved `DESIGN.md` direction                    | Proposed                                           | Maintains visual consistency                           |
| Master workflow alignment     | Inspect and reconcile before implementation              | Pending verification                               | Prevents conflicting technical decisions               |

---

## 23. Architecture Acceptance Criteria

The architecture is ready for implementation when:

### Product Alignment

- Every MVP requirement in `PRD.md` has a defined implementation boundary.
- The architecture does not add unapproved features.
- The page and component inventory is accounted for.
- The approved visual and accessibility requirements remain enforceable.

### Technical Clarity

- The stack has been checked against the actual repository.
- The note model and validation boundaries are defined.
- React state and persistence responsibilities are clear.
- Storage errors and recovery behavior are documented.
- Speech-recognition behavior and fallback handling are defined.
- The file structure reflects real responsibilities.
- Environment requirements are accurate.
- No unnecessary backend or external service has been introduced.

### Quality and Safety

- User-entered text is handled safely.
- Failed persistence does not appear successful.
- Unreadable stored data is not silently overwritten.
- Speech recognition is optional and permission-aware.
- Keyboard and assistive-technology behavior is covered.
- Responsive behavior and visual QA are part of the development process.
- Testing requirements are documented.

### Delivery

- The approved master workflow has been inspected.
- Existing repository conventions have been preserved or reconciled.
- Pending decisions remain explicitly identified.
- The production build and critical user journeys can be verified.
- Documentation describes the actual implementation rather than an assumed one.

---

## 24. Final Architectural Principle

Build the Sticky Notes App as a small, reliable, local-first React application with explicit boundaries between the UI, note operations, persistence, and browser speech recognition.

Keep the note collection as the single authoritative in-memory state, centralize storage operations, handle failures without silently losing user content, and make voice input an optional enhancement.

Follow `PRD.md` for what the application must do, `DESIGN.md` for how it should look and behave, `TRD.md` for its technical requirements, and the approved master workflow for how implementation must proceed.

**Choose the simplest architecture that satisfies the requirements, preserves user data responsibly, and supports a distinctive, accessible, production-quality frontend.**

Resolve the architecture's conflicting storage rules

## Approved implementation decisions — foundation reconciliation

This section supersedes conflicting proposed defaults elsewhere in this project copy. The original attachment is unchanged.

- This is a new frontend-only project. Paper Atelier is approved.
- Content must contain non-whitespace text; title is optional. Title-only notes are invalid.
- Editing uses an accessible modal. Deletion requires confirmation. Meaningful unsaved changes require a warning before discard.
- Prepare a collection, persist successfully, then commit saved state and show success. Preserve drafts and saved data on failures.
- Missing storage key means empty. Malformed/unreadable data means recovery, never an automatic overwrite.
- Append finalized dictated text to the active content draft with sensible spacing. No interim text committed, replacement of existing text, or automatic submission.
- Foundation uses Georgia/system-sans fallbacks, CSS Modules and shared tokens. No remote font loading.
- Phase 2 authorizes and implements create, localStorage persistence, display and reload recovery only. Editing, deletion, dictation and final masonry remain later increments. No deployment is authorized.
- New project directory is /data/sticky-notes-app. npm with an exact project lockfile is approved. No deployment is authorized.

## Phase 2 implemented boundaries

`features/notes/noteTypes`, `noteValidation` and `noteOperations` define the five-field contract, full collection validation, pure creation and deterministic sorting. `services/noteStorage` alone accesses localStorage and preserves unreadable data. `features/notes/useNotes` owns one saved collection and commits only after successful persistence. `NotesWorkspace` composes the UI; `components/notes/NoteComposer` owns unsaved draft state; `NotesCollection` and `NoteCard` present confirmed data or recovery. No mount-time save effect exists. Snapshot revalidation detects already-changed storage but is not an atomic multi-tab lock. The collection is a temporary simple grid, not final masonry.

## Phase 3 implemented boundaries

The existing authoritative collection and storage adapter are retained. `noteOperations.updateNote`/`sameNote` provide pure replacement/baseline operations; `useNotes.saveEdit` coordinates validation, snapshot-guarded persistence and commit. The editor's original-note snapshot is transient conflict-detection input, not a second saved collection. Reloading changed storage cannot silently rebase an old draft onto a modified or missing target.

`NoteCard` exposes Edit via `NotesCollection` to `NotesWorkspace`, which owns the active editor session/opener and polite result announcement. `NoteEditor` owns only its draft, errors and discard-warning state. It uses one native dialog with alternate editor/warning panels, explicit Tab boundary wrapping, initial/final focus management, in-modal non-destructive retry and independently scrolling fields. The unchanged create composer retains its own draft/unload behavior. No save effect, direct UI storage access, new global state, deletion or dictation is introduced. See README and GATES for actual behavior and evidence.


## Phase 4 implementation status — approved safe deletion

ConfirmDeleteDialog owns only a transient target baseline, local error and modal focus. NotesWorkspace coordinates dialog visibility and a shared polite edit/delete status. useNotes.deleteNote validates target identity/content/metadata against that baseline, filters the one selected ID, then calls the existing adapter; state changes only after successful persistence. Cards/collection only emit intent. Other records and timestamps are unchanged. Unsafe reads/snapshots pause mutations; a changed/removed target after read-only retry requires cancel/review, not automatic merge or deletion.


## Phase 5 implementation status — responsive masonry

Phase 5 implements ordered responsive masonry and scoped Paper Atelier visual refinement. One chronological semantic list uses non-dense CSS Grid auto-placement with 4px rows; a small presentation-only ResizeObserver hook supplies natural-height row spans, not coordinates or saved state. This measured CSS approach was prototyped against ordering/gutter criteria before implementation; it does not introduce a positioning library. Content width is capped at 1120px, with a 300px column target: 1/2/3 columns at 390/768/1440px. Missing ResizeObserver retains a readable ordinary-Grid fallback. CSS columns were rejected for column-major/balancing order; native masonry is not assumed.

The workspace/composer are more compact, card titles use editorial serif hierarchy, actions remain visible, and reduced-motion preferences suppress optional transitions. Note CRUD, validation, five-field schema, key, persistence safeguards and modal logic remain unchanged. README/GATES and artifacts/phase5 record actual tests, screenshots, accessibility/contrast findings and limitations. Voice input and all other excluded features remain unimplemented; no deployment is authorized. This status supersedes prior appendices that defer final masonry, without expanding product scope.


## Phase 6 implementation status — optional native dictation

The approved voice increment now enhances the existing composer only. Standard/prefixed native SpeechRecognition is feature-detected with explicit start/stop, textual/live states, provisional-only interim results and per-session final-index deduplication. Final text appends at the current draft end with a newline separator when needed; typing/editing stays available. Save waits for recognition to end and uses the unchanged validated persistence workflow. No auto-save/restart, custom audio backend/recorder, separate transcript persistence or dependency is introduced.

Hook cleanup invalidates callbacks and aborts on errors, unmount, page hiding or modal focus; stalled startup/stop are bounded. Unsupported/insecure environments retain typing. Browser speech processing may be remote and is not guaranteed offline; API presence does not guarantee usable hardware/service/permissions. Textual status and a restrained microphone glyph deliberately avoid a required animation. See README/GATES and artifacts/phase6 for actual mock-based verification, privacy boundaries, screenshots and unverified real-audio behavior. This status supersedes earlier appendices deferring voice, without changing the note schema/key or authorizing deployment.
