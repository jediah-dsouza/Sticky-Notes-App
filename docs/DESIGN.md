# DESIGN.md — Sticky Notes App

## 1. Document Overview

| Field                     | Details                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product                   | Sticky Notes App                                                                                                                                        |
| Document                  | Visual Design System and UX Specification                                                                                                               |
| Product Type              | Responsive, local-first note-taking web application                                                                                                     |
| Primary Platform          | Web                                                                                                                                                     |
| Product Source of Truth   | `PRD.md`                                                                                                                                                |
| Technical Source of Truth | `TRD.md`, when available                                                                                                                                |
| Design Status             | Proposed design direction; subject to review                                                                                                            |
| Working Brand Name        | Unnamed — final branding requires approval                                                                                                              |
| Primary Design Goal       | Create a distinctive, tactile, editorial note-taking experience that feels deliberately art-directed rather than generated from a generic SaaS template |

This document is the single source of truth for the application's visual language, interaction design, design tokens, reusable components, responsive behavior, accessibility, and page-level presentation.

All visual implementation must follow these specifications. Individual components must not introduce arbitrary colors, spacing, typography, animations, or interaction patterns that conflict with this document.

The approved `PRD.md` defines the product requirements. This document defines how those requirements should look, feel, and behave.

---

## 2. Product Experience and Design Vision

### 2.1 Design Concept — The Paper Atelier

The application should feel like a thoughtfully arranged collection of personal notes on a designer's physical desk: tactile, expressive, calm, and immediate.

The visual direction combines:

- The warmth and imperfection of physical paper.
- The clarity and precision of contemporary editorial design.
- A carefully curated palette inspired by stationery and printed matter.
- Strong typography and deliberate negative space.
- Subtle physicality through borders, shadows, paper-like surfaces, and restrained movement.
- The responsiveness and convenience of a modern web application.

The result should not resemble a conventional productivity dashboard. It should feel like a personal digital workspace with its own visual identity.

The interface should be visually memorable without sacrificing the speed and simplicity of writing a note.

### 2.2 Desired Emotional Response

Users should feel:

- **Invited:** opening the application immediately communicates where to write.
- **Unrestricted:** capturing a thought feels effortless.
- **Organized:** the note collection feels composed rather than cluttered.
- **Comfortable:** colors, typography, and spacing support extended reading.
- **Confident:** every action has clear feedback and predictable results.
- **Delighted:** small visual details make ordinary interactions feel considered.

### 2.3 Visual Identity

The identity should be built around the contrast between a quiet paper-like workspace and expressive note surfaces.

The workspace is the canvas. The notes are the visual personality.

Use a warm neutral foundation, dark ink typography, and a limited selection of distinctive paper colors. Introduce stronger color selectively through note cards, the primary action, and small interface details.

The interface should remain recognizable even if decorative elements are removed.

### 2.4 Design Principles

1. **Capture before decoration.** The composer must be easy to discover and use immediately.
2. **Personality through restraint.** Distinctiveness comes from composition, typography, color relationships, and interaction quality—not decorative overload.
3. **Notes are the content.** The interface must never visually overpower the user's writing.
4. **Designed, not templated.** Avoid generic SaaS layouts, predictable component arrangements, and stock dashboard aesthetics.
5. **Consistency without monotony.** Reuse design rules while allowing note cards to have subtle visual variation.
6. **Motion with purpose.** Movement should communicate creation, editing, listening, confirmation, or removal.
7. **Accessibility is part of the visual system.** Contrast, focus, readable text, and predictable interactions are mandatory.
8. **Responsive by composition.** Layouts should be intentionally adapted to each viewport rather than simply shrunk.
9. **Clarity under failure.** Empty states and errors deserve the same visual care as the default workspace.
10. **No unnecessary complexity.** Every visual element must justify its presence.

---

## 3. Anti-Slop Design Standard

The application must not use the familiar visual patterns associated with generic AI-generated websites.

### 3.1 Explicitly Avoid

- Generic centered hero sections with oversized marketing headlines.
- A dashboard layout with arbitrary statistic cards.
- Excessive rounded rectangles on every element.
- Glassmorphism, frosted panels, and decorative gradient backgrounds.
- Neon gradients or gratuitous glow effects.
- Random floating shapes, decorative blobs, and meaningless background illustrations.
- Excessive pill-shaped controls.
- An emoji used as the entire product identity.
- Generic purple-and-blue AI branding.
- Large empty areas that do not support the task.
- Identical card layouts regardless of their content.
- Unnecessary navigation sidebars.
- Excessive borders, shadows, badges, and decorative separators.
- Motion added only to make the interface appear sophisticated.
- Oversized headings that compete with the note composer.
- A note collection that looks like a collection of identical enterprise dashboard widgets.

### 3.2 What to Do Instead

- Use an editorial hierarchy with a deliberate relationship between headings, labels, and note content.
- Create an intentional composition with the composer and masonry collection.
- Use asymmetry where it improves visual rhythm without compromising usability.
- Allow variable-height notes to create a naturally composed collection.
- Use a restrained paper-inspired color palette with deliberate contrast.
- Make control styling consistent but not excessively rounded.
- Introduce distinctive typography and carefully considered spacing.
- Use a small number of recognizable visual details rather than numerous decorative effects.
- Make empty, listening, and error states feel designed rather than improvised.
- Refine the actual application at desktop, tablet, and mobile sizes instead of relying on a single polished screenshot.

### 3.3 Design Quality Gate

A visually functional interface is not automatically a well-designed interface.

Before approving a page, evaluate:

- Is the visual hierarchy immediately understandable?
- Does the interface have a distinctive identity?
- Does the composition feel intentional?
- Are the typography and spacing relationships consistent?
- Does every decorative detail serve a purpose?
- Do the note cards remain the visual focus?
- Are all interactions obvious and accessible?
- Does the interface still feel polished on mobile?
- Could this interface be mistaken for an unmodified generic starter template?

If the design feels generic, revise the composition and visual hierarchy before adding more effects or components.

---

## 4. Color System

### 4.1 Primary Palette

The proposed palette is inspired by warm paper, printed ink, and contemporary stationery.

| Token           | Color          | Hex       | Purpose                                          |
| --------------- | -------------- | --------- | ------------------------------------------------ |
| `canvas`        | Warm paper     | `#F5F1E8` | Main application background                      |
| `surface`       | Soft ivory     | `#FFFCF6` | Composer, dialogs, and elevated surfaces         |
| `surface-muted` | Pale parchment | `#EDE7DA` | Secondary surface and subtle control backgrounds |
| `ink`           | Charcoal ink   | `#282720` | Primary text and prominent controls              |
| `ink-secondary` | Warm graphite  | `#625F55` | Secondary text and supporting labels             |
| `ink-muted`     | Stone gray     | `#777367` | Muted metadata, subject to contrast verification |
| `border`        | Paper edge     | `#D9D1C3` | Borders and separators                           |
| `accent`        | Vermilion      | `#C74730` | Primary action and selected interface details    |
| `accent-hover`  | Deep vermilion | `#A93825` | Primary action hover state                       |
| `focus`         | Deep teal      | `#176B66` | Visible keyboard focus indicator                 |
| `success`       | Forest green   | `#286344` | Success status                                   |
| `danger`        | Deep red       | `#B42318` | Destructive actions and errors                   |
| `warning`       | Dark ochre     | `#80520C` | Warning status                                   |

These values establish the proposed visual direction. Before release, validate foreground/background combinations against the accessibility requirements in Section 14. Adjust individual token values if necessary without abandoning the overall palette.

### 4.2 Note Paper Palette

The note collection may use a curated set of paper colors to create visual variety.

| Token        | Color        | Hex       | Intended Use                 |
| ------------ | ------------ | --------- | ---------------------------- |
| `note-cream` | Butter paper | `#F7E8B2` | Warm, familiar note surfaces |
| `note-peach` | Soft apricot | `#F4D3C2` | Warm accent notes            |
| `note-sage`  | Muted sage   | `#D7E3CC` | Calm, nature-inspired notes  |
| `note-blue`  | Powder blue  | `#D3E1EE` | Cool contrast                |
| `note-lilac` | Dusty lilac  | `#E1D7ED` | Occasional visual variation  |
| `note-rose`  | Soft rose    | `#F0D4D1` | Occasional warm variation    |

These colors are presentation choices, not note categories or product features.

Rules:

- Use dark ink for note titles and body text.
- Do not assign a random color on every render.
- Prefer a deterministic color assignment so the collection remains visually stable.
- Avoid placing two identical accent colors together repeatedly when the collection permits a better distribution.
- Maintain sufficient text contrast on every note surface.
- Do not make color the only means of communicating a note's meaning.
- Avoid a rainbow effect or equal use of every color.
- Treat the paper palette as a subtle supporting element, not the main attraction.

The initial implementation may use a restrained subset of these colors if the full palette feels too busy.

### 4.3 Color Distribution

Use the following approximate visual balance as a composition guideline, not a rigid mathematical constraint:

- **65–75%:** warm neutral workspace and surfaces.
- **15–25%:** note paper colors.
- **5–10%:** typography, borders, and stronger accents.

The interface should feel predominantly calm, with the notes introducing personality.

### 4.4 Semantic Color Rules

Colors must communicate consistent meaning throughout the application.

- Vermilion: primary creation action and a small number of important highlights.
- Forest green: successful completion or confirmation.
- Deep red: destructive action and errors.
- Dark ochre: warnings and cautionary states.
- Deep teal: keyboard focus.
- Neutral ink: ordinary text and controls.

Do not use success green for decorative elements or error red merely to create visual contrast.

### 4.5 Color Restrictions

- No arbitrary one-off hex values in component styles.
- No gradients by default.
- No translucent text that reduces readability.
- No low-contrast metadata just to achieve a subdued aesthetic.
- No color-only hover, selection, error, or listening indicators.
- No automatic dark mode unless separately approved.

If a dark theme is considered later, it must be designed and tested as a complete theme rather than produced by mechanically inverting the palette.

---

## 5. Typography

### 5.1 Typography Direction

Typography should combine editorial character with excellent readability.

Use a distinctive display face for the main workspace heading and a highly readable sans-serif for controls, note content, and supporting interface text.

The recommended pairing is:

- **Display:** `DM Serif Display`, with a suitable serif fallback.
- **Interface and body:** `DM Sans`, with a suitable sans-serif fallback.
- **System fallbacks:** Georgia and the system sans-serif stack, respectively.

The proposed font pairing must be checked against the project's performance, licensing, and asset-loading requirements before being adopted. If external font loading adds unnecessary complexity, choose the closest available alternatives that preserve the intended contrast between editorial headings and practical interface text.

### 5.2 Type Scale

| Token             | Size    | Weight             | Use                                      |
| ----------------- | ------- | ------------------ | ---------------------------------------- |
| `type-display`    | 36–44px | Regular            | Main workspace heading on larger screens |
| `type-heading`    | 24–28px | Regular or medium  | Page-level heading                       |
| `type-subheading` | 18–20px | Medium             | Collection heading and dialog titles     |
| `type-note-title` | 16–19px | Medium or semibold | Note card titles                         |
| `type-body`       | 15–16px | Regular            | Note content and primary interface text  |
| `type-control`    | 14–15px | Medium             | Buttons, inputs, and form controls       |
| `type-caption`    | 12–13px | Regular or medium  | Timestamps and secondary metadata        |

These sizes are starting points. Responsive adjustments are permitted when they preserve the hierarchy and readability.

### 5.3 Typography Rules

- Use sentence case for headings and controls.
- Keep note content comfortable to read.
- Prefer regular font weights for editorial headings.
- Reserve heavier weights for emphasis and compact controls.
- Avoid excessively small metadata.
- Use a consistent line-height for body content, approximately 1.5–1.65.
- Use a slightly tighter line-height for display headings.
- Preserve line breaks entered by the user.
- Wrap long words and URLs without overflowing the note card.
- Use tabular numerals when useful for timestamps or numeric metadata.
- Avoid unnecessary uppercase labels and excessive letter spacing.

### 5.4 Content Hierarchy

The visual priority should generally be:

1. Note creation.
2. Workspace heading.
3. Saved note content.
4. Note titles.
5. Primary actions.
6. Secondary actions and metadata.

The heading must not dominate the workspace so much that the user has to search for the composer.

---

## 6. Spacing, Layout, and Shape System

### 6.1 Spacing Scale

Use a consistent spacing scale based on multiples of four.

| Token      | Value | Common Use                       |
| ---------- | ----- | -------------------------------- |
| `space-1`  | 4px   | Small icon/text gap              |
| `space-2`  | 8px   | Compact control spacing          |
| `space-3`  | 12px  | Field and card detail spacing    |
| `space-4`  | 16px  | Standard internal padding        |
| `space-5`  | 20px  | Card content separation          |
| `space-6`  | 24px  | Component spacing                |
| `space-8`  | 32px  | Section separation               |
| `space-10` | 40px  | Larger layout separation         |
| `space-12` | 48px  | Major section spacing            |
| `space-16` | 64px  | Large-screen composition spacing |

Do not use every spacing value everywhere. Establish consistent relationships between related components.

### 6.2 Content Width

- Center the workspace within a readable content container.
- Use approximately `1200–1320px` as the proposed maximum content width on larger displays.
- Allow the container to use available width on smaller screens.
- Preserve generous side margins on desktop.
- Reduce margins appropriately on mobile without allowing content to touch the screen edges.
- Avoid excessively wide note cards that make note content difficult to scan.

The final maximum width must be verified against the selected masonry implementation.

### 6.3 Layout Grid

Use a responsive layout based on CSS Grid and Flexbox.

The workspace should have a clear vertical structure:

1. Compact application header.
2. Workspace introduction, if retained.
3. Note composer.
4. Saved notes heading or collection metadata.
5. Masonry-style note collection.

The composition should feel editorial and deliberate, with enough whitespace to separate the writing area from the collection.

Do not create a sidebar or multi-column dashboard shell.

### 6.4 Border Radius

Use a small, consistent radius scale.

| Token           | Value | Use                                                        |
| --------------- | ----- | ---------------------------------------------------------- |
| `radius-small`  | 6px   | Compact controls and small surfaces                        |
| `radius-medium` | 10px  | Inputs, buttons, and note cards                            |
| `radius-large`  | 14px  | Composer and larger dialogs                                |
| `radius-pill`   | 999px | Only for controls that genuinely benefit from a pill shape |

Note cards should feel like carefully finished paper objects, not oversized rounded dashboard widgets.

Avoid using the largest radius on every surface.

### 6.5 Borders and Shadows

Use borders and shadows sparingly.

- Prefer a fine, warm border for defining paper edges.
- Use soft, low-opacity shadows only where they improve depth or separation.
- Keep note cards visually grounded against the workspace.
- Avoid thick borders around every component.
- Avoid dramatic floating shadows.
- Use stronger elevation for active dialogs than for ordinary cards.
- Do not rely on shadows alone to communicate focus or state.

The default workspace should feel tactile but not skeuomorphic.

---

## 7. Responsive Design System

### 7.1 Breakpoint Strategy

Use content-driven responsive breakpoints.

The following are proposed starting points:

| Breakpoint    | Width            | Layout Guidance                                                          |
| ------------- | ---------------- | ------------------------------------------------------------------------ |
| Small mobile  | Below 480px      | Single-column notes, compact header, full-width composer                 |
| Large mobile  | 480–767px        | Comfortable single-column or carefully tested narrow masonry arrangement |
| Tablet        | 768–1023px       | Two-column note collection where space permits                           |
| Desktop       | 1024–1439px      | Two or three columns depending on content width                          |
| Large desktop | 1440px and above | Three or four columns where card widths remain readable                  |

These are not rigid device categories. Adjust them when actual component widths and usability testing demonstrate a better result.

### 7.2 Mobile Behavior

On mobile:

- Keep the product identity compact.
- Make the composer easy to access without a large introductory section.
- Use a single column when it provides the clearest reading and focus order.
- Allow the composer and note cards to use the available content width.
- Keep buttons comfortably tappable.
- Do not require hover to reveal edit or delete actions.
- Ensure text areas remain usable when the virtual keyboard appears.
- Prevent dialogs from exceeding the viewport.
- Avoid horizontal scrolling.
- Keep destructive actions distinct from primary actions.

### 7.3 Tablet Behavior

On tablet:

- Use the available width without compressing note text.
- Prefer a balanced two-column layout when appropriate.
- Maintain clear separation between the composer and collection.
- Keep edit and delete controls discoverable.
- Avoid awkward card widths caused by too many columns.

### 7.4 Desktop Behavior

On desktop:

- Use whitespace to establish a strong visual composition.
- Keep the workspace aligned to a consistent content container.
- Let the masonry collection create a varied, editorial rhythm.
- Avoid stretching the composer across an excessively wide line.
- Keep the primary action visually obvious.
- Ensure the collection feels full without becoming crowded.

### 7.5 Masonry and Reading Order

The visual layout must never undermine usability.

- Card height should follow content naturally.
- Cards must not overlap.
- Editing a note must not break the layout.
- The visual reading order should remain understandable.
- Keyboard focus order must follow a logical DOM order.
- Do not use CSS positioning tricks that make keyboard navigation unpredictable.
- Verify the chosen CSS masonry technique across supported browsers.

If a visually complex masonry approach creates accessibility or reading-order problems, prioritize a simpler layout.

---

## 8. Design Tokens and Implementation Consistency

The implementation must maintain a centralized set of design tokens for:

- Colors.
- Typography.
- Spacing.
- Border radii.
- Borders.
- Shadows.
- Content widths.
- Responsive breakpoints.
- Animation durations.
- Focus indicators.
- Layering and dialog elevation.

Use the styling approach established by the approved TRD and repository.

### Token Rules

1. Components should consume shared tokens rather than define arbitrary values.
2. Repeated visual patterns must use the same tokens.
3. New tokens require a clear design need.
4. Component-specific exceptions must be documented when they are genuinely necessary.
5. Responsive adjustments must remain consistent with the established spacing and typography scales.
6. State colors must preserve their semantic meaning.
7. A design change should be evaluated across all affected components, not only the first screen where it appears.

Do not introduce a separate design system package or component library merely to manage a small set of application tokens.

---

## 9. Reusable Component Design Specifications

Every component must have a clear purpose, consistent visual states, and predictable behavior.

### 9.1 Application Header

**Purpose:** Establish product identity and provide minimal workspace context.

**Visual treatment:**

- Compact horizontal composition.
- Product identity aligned consistently with the workspace container.
- Small, distinctive wordmark or simple icon treatment.
- Clear heading hierarchy.
- Minimal decoration.

**Behavior:**

- Remains usable at narrow widths.
- Does not introduce unnecessary navigation.
- Provides accessible names for interactive elements.
- Does not rely on decorative imagery to communicate the product's purpose.

The product name and final logo require approval.

### 9.2 Workspace Introduction

**Purpose:** Introduce the workspace without delaying note creation.

**Visual treatment:**

- Editorial heading with a clear typographic personality.
- One concise supporting sentence.
- Restrained use of accent color.
- Enough whitespace to distinguish the introduction from the composer.

**Behavior:**

- Optional and subordinate to the main note-taking workflow.
- Compact on mobile.
- Must not become a marketing hero section.

### 9.3 Note Composer

**Purpose:** Provide the primary place to capture a thought.

**Visual treatment:**

- Prominent paper-like surface.
- Clear distinction between title and content fields.
- Strong readable input text.
- Quiet field borders and obvious focus states.
- A primary creation action with consistent vermilion styling.
- Voice input integrated into the composition without competing with Save.

**Required states:**

- Idle.
- Focused.
- Draft entered.
- Validation error.
- Saving.
- Persistence failure.
- Voice listening.
- Voice unavailable.

**Behavior:**

- Preserve entered content when validation or storage fails.
- Do not show errors before a meaningful user action unless an immediate system failure requires explanation.
- Make the primary action easy to identify.
- Keep the composer responsive to the virtual keyboard on mobile.

### 9.4 Form Fields

**Visual treatment:**

- Consistent height, padding, borders, and typography.
- Clear labels or accessible equivalents.
- Strong visible focus state.
- Readable placeholder text.
- Error styling that remains distinguishable without color alone.

**Behavior:**

- Support keyboard input.
- Preserve multiline content.
- Keep validation feedback associated with the relevant field.
- Avoid animated field resizing that causes disruptive layout shifts.

### 9.5 Note Card

**Purpose:** Present a saved note as a readable, independent paper surface.

**Visual treatment:**

- One approved paper color.
- Dark, readable text.
- Consistent internal padding.
- Natural content-driven height.
- Subtle border or restrained shadow.
- Clearly separated title, content, metadata, and controls.

**Required elements:**

- Optional title.
- Note content.
- Readable timestamp.
- Edit action.
- Delete action.

**Behavior:**

- Long content wraps safely.
- User-entered line breaks are preserved.
- Edit and delete controls remain accessible.
- Hover effects are subtle and never required to use the card.
- Focused controls remain visible.
- A card must not become visually inaccessible when its title is absent.

Avoid applying arbitrary rotation to cards. A slight tactile character should come from the paper palette, spacing, and depth rather than an unstable, scrapbook-like layout.

### 9.6 Note Editor

**Design decision:** Use an inline editor or a dialog, not both, unless a demonstrated usability requirement justifies a mixed approach.

**Visual treatment:**

- Reuse the composer field styles.
- Make the editing context obvious.
- Preserve the existing note's visual identity where practical.
- Use clear Save Changes and Cancel actions.

**Behavior:**

- Populate fields with saved content.
- Preserve the original note until the update succeeds.
- Communicate validation and persistence errors.
- Protect meaningful unsaved changes from accidental dismissal.
- If modal, manage focus and Escape behavior accessibly.

### 9.7 Delete Confirmation

**Purpose:** Prevent accidental loss of a note.

**Visual treatment:**

- Compact dialog.
- Clear heading and concise explanatory text.
- Neutral cancel action.
- Distinct destructive action.
- No unnecessary illustration or dramatic warning graphics.

**Behavior:**

- Identify the note being deleted.
- Cancel preserves the note.
- Confirm executes the deletion.
- Escape dismisses the dialog without deleting.
- Focus returns to the invoking control when the dialog closes.
- If persistence fails, communicate the failure and preserve recoverable content.

### 9.8 Voice Input Control

**Purpose:** Let users dictate text when browser speech recognition is supported.

**Visual treatment:**

- Recognizable microphone icon.
- Accessible label.
- Distinct listening state.
- Subtle animated indicator while actively listening.
- Clear stop or cancel control.

**Behavior:**

- Do not imply microphone activity before recognition starts.
- Explain when permission is denied or the feature is unavailable.
- Preserve text already entered or transcribed.
- Do not automatically submit the note.
- Allow users to correct transcription before saving.

Use animation to communicate listening status, not as decoration.

### 9.9 Notifications and Status Messages

**Purpose:** Communicate the result of an action.

**Visual treatment:**

- Compact, readable messages.
- Consistent spacing and typography.
- Semantic color usage.
- Subtle entry and exit transitions.

**Behavior:**

- Successful actions should not interrupt writing.
- Errors must remain available long enough to understand and respond.
- Important storage failures should not disappear automatically before the user can act.
- Status changes must be accessible to assistive technology.

### 9.10 Empty State

**Purpose:** Help users create their first note.

**Visual treatment:**

- Calm and welcoming.
- One clear heading.
- One short explanatory sentence.
- An obvious action that leads to note creation.
- Optional small, original illustration or simple stationery-inspired motif.

**Behavior:**

- Display only when the collection is genuinely empty.
- Do not confuse an unreadable storage state with an empty collection.
- Avoid a large marketing-style illustration.
- Keep the primary creation action available.

### 9.11 Storage Error State

**Purpose:** Explain when saved notes cannot be accessed or persisted reliably.

**Visual treatment:**

- Clear error heading.
- Brief explanation in plain language.
- Distinct but restrained warning styling.
- A visible retry or recovery action where appropriate.

**Behavior:**

- Do not claim that no notes exist if storage could not be read.
- Do not automatically overwrite potentially recoverable data.
- Preserve drafts where possible.
- Do not display a success state after a failed write.

### 9.12 Not Found Page

**Purpose:** Provide a recovery path for an invalid route.

**Visual treatment:**

- Minimal layout.
- Same color, typography, and spacing system as the workspace.
- Clear message and return action.
- Optional small decorative detail consistent with the Paper Atelier direction.

Do not introduce a separate visual identity for this page.

---

## 10. Navigation and Information Hierarchy

The application is a single-workspace experience.

### Navigation Rules

- The main workspace is the default destination.
- The header should provide product identity, not an unnecessary menu system.
- Do not add a sidebar.
- Do not introduce account controls, workspace switching, or settings navigation.
- Any optional preference control requires explicit approval.
- The not-found page must provide a clear route back to the workspace.

### Interaction Hierarchy

The visual priority should remain:

1. Create a note.
2. Read saved notes.
3. Edit a note.
4. Delete a note.
5. Access voice input.
6. Receive status and error feedback.

Destructive actions must never visually compete with the primary creation action.

---

## 11. Interaction States and Microinteractions

Every interactive component must have deliberately designed states.

### 11.1 Buttons

Define consistent default, hover, active, focus, disabled, and pending states.

- Primary action: vermilion surface with sufficient text contrast.
- Secondary action: restrained neutral surface or outline.
- Destructive action: semantic danger styling.
- Icon-only action: visible focus treatment and accessible name.
- Disabled action: clearly unavailable without becoming illegible.

Hover effects should be subtle and should not shift surrounding layout.

### 11.2 Note Creation

On successful creation:

- The new note should become visible in the collection.
- The transition should communicate that the note has been added.
- The composer should reset only after the save succeeds.
- Feedback should remain brief and nonintrusive.

Do not use exaggerated scaling, spinning, or bounce animations.

### 11.3 Editing

- Make entry into editing mode immediately understandable.
- Preserve the user's context.
- Avoid disruptive layout changes.
- Indicate whether changes have been saved or remain unsaved.
- Keep the transition short enough that it never delays interaction.

### 11.4 Deletion

- Communicate the destructive action clearly.
- If confirmation is used, make the decision easy to understand.
- Remove the note visually only when the operation succeeds.
- Do not use dramatic screen transitions for ordinary deletion.

### 11.5 Voice Recognition

- Show a clear active listening state.
- Use a subtle pulse or equivalent restrained indicator.
- Provide an explicit stop action.
- Do not rely on animation alone to communicate recording.
- Keep status text available to screen readers.

### 11.6 Focus and Selection

- Focus indicators must remain visible.
- Selected or active controls must have clear visual feedback.
- Focus must not disappear during animations.
- Opening a modal should move focus appropriately.
- Closing a modal should restore focus logically.

---

## 12. Motion and Animation System

### 12.1 Motion Philosophy

Motion should make the application feel responsive and carefully finished, not theatrical.

Prefer short transitions with restrained easing.

### 12.2 Proposed Motion Tokens

| Token             | Duration | Intended Use                                       |
| ----------------- | -------- | -------------------------------------------------- |
| `motion-fast`     | 120ms    | Button and control feedback                        |
| `motion-standard` | 180ms    | Focus-related visual changes and small transitions |
| `motion-panel`    | 220ms    | Composer or dialog transitions                     |
| `motion-card`     | 240ms    | Note appearance or removal                         |

These are starting points. The final implementation must be tested for perceived responsiveness and reduced-motion behavior.

### 12.3 Approved Motion Patterns

- Subtle button color transitions.
- Small opacity transitions for feedback.
- Restrained note entrance and exit.
- Short dialog transitions.
- Listening indicators while speech recognition is active.
- Small, purposeful changes in elevation.

### 12.4 Motion Restrictions

- No long intro animations.
- No parallax.
- No continuous decorative movement.
- No scroll-jacking.
- No animations that delay saving or deletion.
- No excessive bounce or elastic effects.
- No movement that causes content to jump unexpectedly.
- No animation dependency solely for simple transitions that CSS can handle.

### 12.5 Reduced Motion

When `prefers-reduced-motion: reduce` is enabled:

- Remove nonessential movement.
- Reduce transitions to minimal visual changes.
- Disable looping listening animations or replace them with a static active indicator.
- Preserve all functionality and status information.
- Avoid large-scale movement and animated rearrangement.

Reduced-motion behavior must be verified during implementation and testing.

---

## 13. Loading, Empty, Error, and Success States

These states are part of the design system, not secondary implementation details.

### Initial Workspace

Since local storage is synchronous, the default experience should not display a fabricated loading screen.

If initialization genuinely requires an asynchronous operation, use a restrained loading indicator that preserves the page's visual hierarchy.

### Empty Collection

Display a clear message and direct path to creating the first note.

### Validation Error

- Identify the problem.
- Associate the message with the relevant input.
- Keep the user's content intact.
- Avoid using color as the only signal.

### Storage Read Failure

- Clearly explain that saved data could not be loaded reliably.
- Distinguish the error from an empty workspace.
- Offer recovery or retry where appropriate.

### Storage Write Failure

- Explain that the change was not saved successfully.
- Preserve the draft where possible.
- Do not show a successful-save notification.
- Offer a reasonable next action.

### Voice Input Failure

Provide understandable feedback for unsupported browsers, permission denial, recognition interruption, and other errors.

Manual typing must remain available.

### Success Feedback

Use quiet, concise feedback. Avoid a modal for routine successful note creation or editing.

### Not Found

Use a minimal error page that preserves the product's established visual identity.

---

## 14. Accessibility Requirements

Accessibility is a mandatory part of the design system.

### 14.1 Contrast

Target WCAG 2.2 Level AA.

- Normal text must meet a contrast ratio of at least 4.5:1.
- Large text must meet at least 3:1.
- Relevant control boundaries, graphical indicators, and focus indicators must meet applicable non-text contrast requirements.
- Validate text contrast on every approved note color.
- Muted text must remain readable.
- Never reduce contrast solely to achieve a subtle visual style.

### 14.2 Keyboard Navigation

All core functionality must work without a mouse.

Users must be able to:

- Navigate to the composer.
- Enter and save notes.
- Edit and cancel changes.
- Open and dismiss confirmation dialogs.
- Delete notes.
- Operate voice controls where supported.
- Navigate to the main workspace from the not-found page.

Do not make essential actions available only through hover.

### 14.3 Focus

- Use a visible, consistent focus indicator.
- Do not remove browser focus outlines without providing an adequate replacement.
- Ensure focused controls remain visible against all approved surfaces.
- Manage focus correctly for modal interactions.
- Avoid unexpectedly moving focus when notes are created or updated.

### 14.4 Forms

- Provide visible labels or accessible equivalents.
- Associate validation messages with the appropriate field.
- Identify required content clearly.
- Preserve the user's input after validation failures.
- Do not communicate errors using color alone.

### 14.5 Dialogs

- Use appropriate dialog semantics.
- Provide an accessible title.
- Move focus into the dialog when opened.
- Keep focus within a modal dialog while it is active.
- Support Escape where appropriate.
- Return focus to the invoking control when closed.

### 14.6 Screen Readers

- Give icon-only buttons meaningful accessible names.
- Announce relevant save and error feedback.
- Communicate listening status through text or accessible status announcements.
- Avoid excessive announcements when the collection changes.
- Maintain a logical heading structure and content order.

### 14.7 Touch

Design primary touch controls around a target of approximately 44 × 44 CSS pixels where practical.

Avoid closely spaced icon buttons, hover-dependent controls, and tiny destructive actions.

### 14.8 Accessibility Validation

Automated checks must be supplemented with manual keyboard and focus testing. Visual approval alone does not establish accessibility compliance.

---

## 15. Page-Level Layout Guidance

### 15.1 Notes Workspace (`/`)

**Purpose:** Provide an immediate, focused environment for creating and managing notes.

#### Desktop Composition

The page should have a calm, paper-like background and a clearly aligned content container.

The header establishes the application's identity. A concise editorial heading may introduce the workspace, followed by the composer. The note collection occupies the primary content area beneath it.

The composition should balance whitespace with the density of the note collection. Avoid making the page feel empty when notes are present or crowded when the collection grows.

#### Header

- Compact and aligned with the main container.
- Distinct product identity.
- Minimal controls.
- Clear visual separation from the workspace where necessary.

#### Introduction

- Short, visually distinctive heading.
- One concise supporting sentence.
- Optional, understated accent detail.
- Must not compete with the composer.

#### Composer

- Prominent and easy to discover.
- Paper-like surface that is distinguishable from the background.
- Clear title and content fields.
- Primary action in the established accent color.
- Voice input integrated into the writing workflow.
- Responsive width and comfortable padding.

#### Collection

- Clear collection heading.
- Optional lightweight note count.
- Responsive masonry-style grid.
- Variable-height cards with controlled spacing.
- Stable note colors and consistent controls.
- Natural content-driven card heights.

#### Empty State

- Appears when no notes exist.
- Encourages the user to create the first note.
- Uses the same typography and palette.
- Remains compact and focused.

#### Editing and Deletion

Use the approved editing and deletion patterns consistently. Do not mix inline editing and modal editing without a documented reason.

#### Error Feedback

Place errors near the relevant component when possible. A storage error must be visually distinct from an ordinary empty collection.

### 15.2 Not Found (`*`)

The not-found page should reuse the established visual system.

Include:

- Product identity.
- A clear heading.
- One concise explanation.
- A visible return-to-workspace action.
- Optional restrained stationery-inspired detail.

Avoid a full-screen illustration, oversized promotional typography, or a new color scheme.

---

## 16. Content and Microcopy Guidelines

The interface should use concise, human, practical language.

### Tone

- Friendly without being overly playful.
- Clear without sounding technical.
- Confident without being promotional.
- Helpful without lengthy explanations.

### Writing Rules

- Prefer short sentences.
- Use familiar words.
- Explain what happened and what the user can do next.
- Avoid internal implementation terminology.
- Do not promise successful persistence before it has succeeded.
- Do not claim voice input is available when the browser does not support it.

### Example Copy Direction

| Context                 | Recommended Direction                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| Empty workspace         | “A little space for your thoughts.”                                          |
| Composer title field    | “Give this note a title”                                                     |
| Composer content field  | “Write something worth remembering…”                                         |
| Primary action          | “Save note” or “Create note”                                                 |
| Edit action             | “Edit note”                                                                  |
| Delete action           | “Delete note”                                                                |
| Storage error           | “This note couldn't be saved. Your text is still here—try again.”            |
| Voice unsupported       | “Voice input isn't available in this browser. You can still type your note.” |
| Listening status        | “Listening… Speak clearly, then stop when you're finished.”                  |
| Empty collection action | “Create your first note”                                                     |

These examples establish tone rather than requiring exact wording in every context. Final copy must remain consistent across the application.

---

## 17. Iconography and Illustrations

### Iconography

Use a consistent icon set with a coherent visual style.

- Prefer simple, legible icons.
- Use consistent stroke weight and optical size.
- Keep icons subordinate to text labels where the action might be unclear.
- Provide accessible names for icon-only controls.
- Avoid mixing unrelated icon styles.
- Do not use emoji as substitutes for functional icons.

### Illustrations

Illustrations are optional.

If used, they should follow the Paper Atelier direction: simple, restrained, original, and related to stationery or the act of capturing thoughts.

Do not add illustrations merely to fill empty space. The note collection and typography should provide most of the visual character.

Avoid generic stock illustrations, random decorative blobs, and oversized illustrations that delay the primary action.

---

## 18. Design Skills and AI Coding Agent Workflow

The project has access to the following design and engineering resources:

- `nextlevelbuilder/ui-ux-pro-max-skill`
- `pbakaus/impeccable`
- `Nutlope/hallmark`
- `Leonxlnx/taste-skill`
- `emilkowalski/skills`
- `miqdadbadjuber/anti-slop`
- `darkroomengineering/lenis`
- `DavidHDev/react-bits`
- `greensock/GSAP`
- `tengbao/vanta`
- `microsoft/playwright`

These resources are supporting tools, not independent sources of product truth. `PRD.md`, the approved technical documents, and this design specification remain authoritative.

### 18.1 Required Design Workflow

Before implementing the final UI, the AI coding agent must:

1. Inspect the installed design skills and their actual available instructions.
2. Identify the appropriate slash commands from the installed resources rather than guessing command names.
3. Apply the most relevant design-review, visual-direction, anti-slop, typography, spacing, interaction, and refinement capabilities available.
4. Translate the chosen visual direction into reusable design tokens and component rules.
5. Validate the composition against this document before implementing the full application.
6. Review the actual rendered interface at representative desktop, tablet, and mobile sizes.
7. Refine weak visual hierarchy, spacing, alignment, typography, and interaction feedback before adding decorative effects.
8. Recheck accessibility and responsive behavior after visual refinements.

### 18.2 Resource Selection Rules

Use resources selectively according to their purpose.

- **UI/UX Pro Max:** Consult its design guidance and available design-system capabilities when establishing or reviewing the interface direction.
- **Impeccable:** Use its available design critique and refinement capabilities to identify generic patterns and improve existing UI decisions.
- **Hallmark:** Inspect the installed instructions and use relevant capabilities only when they fit the implementation and approved design.
- **Taste:** Use applicable visual-quality guidance to improve composition, typography, and overall design character.
- **Emil Kowalski's skills:** Apply relevant interaction and animation guidance where it improves usability.
- **Anti-Slop:** Use as a review lens to identify generic AI-generated patterns and unnecessary decoration.
- **Lenis:** Do not introduce smooth-scrolling infrastructure unless a genuine, approved interaction requirement justifies it.
- **React Bits:** Use a component or effect only when it supports the established design direction and is appropriate for the application.
- **GSAP:** Do not add a full animation library for interactions that can be implemented cleanly with CSS.
- **Vanta:** Do not introduce animated background effects by default; they conflict with the quiet paper-inspired direction unless a specific, approved use case demonstrates clear value.
- **Playwright:** Use for browser-level interaction, responsive, and visual verification according to the project's testing workflow.

The availability of a resource does not mean it must be used.

### 18.3 Skill Usage Constraints

- Do not invent slash commands.
- Do not run every skill indiscriminately.
- Do not add dependencies simply because a resource demonstrates them.
- Do not let a skill override the approved product scope or accessibility requirements.
- Do not replace a coherent visual direction with a collection of unrelated effects.
- Do not claim a skill has been invoked or a visual review completed unless it actually has.
- Record consequential design decisions and deviations in the appropriate project documentation.

### 18.4 Visual Review Standard

The coding agent must evaluate the rendered application, not merely the source code.

Review:

- Visual hierarchy.
- Typography and line lengths.
- Spacing and alignment.
- Composer prominence.
- Note card proportions and color distribution.
- Masonry composition.
- Hover, focus, pressed, and disabled states.
- Listening and error states.
- Empty-state composition.
- Mobile usability.
- Reduced-motion behavior.
- Accessibility and contrast.

If the result looks like a generic starter template, revise the design before treating the UI as complete.

---

## 19. Visual Quality Assurance

Visual QA is required throughout implementation, not only at the end.

### 19.1 Desktop Review

Verify:

- The application has a clear identity.
- The composer is immediately discoverable.
- The note collection is the dominant content area.
- Typography has a deliberate hierarchy.
- The masonry layout looks balanced.
- Paper colors are distributed intentionally.
- Whitespace feels purposeful.
- No unnecessary decorative elements compete with the content.

### 19.2 Mobile Review

Verify:

- The header does not become crowded.
- The composer remains easy to use.
- Note cards are readable.
- All controls remain available without hover.
- Dialogs fit the viewport.
- The virtual keyboard does not obstruct essential actions.
- There is no unintended horizontal scrolling.
- The interface remains visually coherent at narrow widths.

### 19.3 Interaction Review

Verify:

- Focus indicators are visible.
- Hover effects are subtle.
- Pressed and disabled states are distinct.
- Editing does not disrupt the user's context.
- Deletion behavior is understandable.
- Listening status is clear.
- Storage failures are visually and verbally explicit.
- Success feedback is useful without being distracting.

### 19.4 Consistency Review

Check the entire application for:

- Inconsistent colors.
- Unexplained typography changes.
- Arbitrary spacing values.
- Inconsistent corner radii.
- Mixed icon styles.
- Repeatedly different button treatments.
- One-off animations.
- Components that do not follow the shared design tokens.

### 19.5 Acceptance Rule

A page is not visually complete merely because it renders correctly.

It must satisfy the functional requirements, align with this design system, behave responsively, and pass the applicable accessibility and interaction checks.

---

## 20. Explicitly Out of Scope

The design must not introduce the following without approval:

- Account screens or authentication flows.
- Sidebars or complex navigation.
- Dashboards and productivity analytics.
- Search interfaces unless separately approved.
- Theme switching unless separately approved.
- Labels, folders, tags, or categories.
- Note pinning or archiving.
- Rich-text editing.
- Image and file attachments.
- Reminders or notifications unrelated to application feedback.
- Cloud synchronization.
- AI-generated content or AI assistants.
- Subscription interfaces.
- Unnecessary animated backgrounds.
- Decorative effects that require substantial new dependencies.

The design must support the approved MVP, not silently expand it.

---

## 21. Design Decisions and Approval Register

| Decision               | Proposed Direction                                           | Status                                      |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Visual concept         | The Paper Atelier: tactile, editorial, warm, and restrained  | Proposed                                    |
| Product name           | Unnamed until approved                                       | Pending approval                            |
| Brand mark             | Simple wordmark or restrained icon                           | Pending design review                       |
| Light theme            | Warm paper and ink                                           | Proposed                                    |
| Dark theme             | Excluded from initial MVP                                    | Not approved                                |
| Display typography     | DM Serif Display or suitable equivalent                      | Proposed; verify availability and licensing |
| Interface typography   | DM Sans or suitable equivalent                               | Proposed; verify availability and licensing |
| Primary accent         | Vermilion                                                    | Proposed                                    |
| Note colors            | Curated paper-inspired palette                               | Proposed                                    |
| Note editing           | Inline editor or dialog                                      | Must be selected before implementation      |
| Deletion interaction   | Accessible confirmation or documented reversible interaction | Must be selected before implementation      |
| Masonry behavior       | Responsive, variable-height CSS-based layout                 | Required; implementation must be verified   |
| Motion                 | Short, purposeful transitions                                | Proposed                                    |
| Animation libraries    | None by default                                              | Proposed                                    |
| Illustrations          | Optional, restrained, and original                           | Not required                                |
| Voice input feedback   | Visible, accessible listening and error states               | Required                                    |
| Accessibility          | WCAG 2.2 AA target                                           | Required design goal                        |
| Responsive breakpoints | Content-driven, using proposed values as a starting point    | Requires implementation validation          |

Do not represent proposed choices as approved decisions. Record approved changes and any necessary deviations in the project decision log.

---

## 22. Final Design Acceptance Checklist

### Visual Identity

- The application has a distinctive, coherent visual direction.
- The interface avoids generic AI-generated SaaS patterns.
- Colors, typography, and spacing follow the design system.
- Decorative elements are purposeful.
- Note cards remain the primary visual content.

### Components

- Header and workspace introduction follow the hierarchy.
- Composer is immediately discoverable.
- Note cards are readable and consistent.
- Editing and deletion interactions are visually clear.
- Voice input states are distinguishable.
- Empty, error, and success states are intentionally designed.
- The not-found page follows the same design system.

### Responsive Design

- Small mobile layout verified.
- Tablet layout verified.
- Desktop layout verified.
- No unintended horizontal overflow.
- Controls remain accessible on touch devices.
- Masonry behavior preserves a coherent reading and focus order.

### Interaction and Motion

- Hover, focus, pressed, disabled, and active states are defined.
- Animations communicate meaningful state changes.
- Reduced-motion preferences are respected.
- Feedback does not obstruct note-taking.
- Unsaved content is not discarded silently.

### Accessibility

- Color contrast has been verified.
- All core actions are keyboard accessible.
- Focus indicators are visible.
- Forms and validation messages are accessible.
- Dialogs manage focus appropriately.
- Status messages are communicated accessibly.
- Color is not the only means of communicating state.

### Engineering Consistency

- Shared design tokens are used consistently.
- Components do not introduce arbitrary visual styles.
- No unnecessary animation or UI dependencies were added.
- Installed design skills were inspected and applied selectively where useful.
- Rendered UI was reviewed at representative viewport sizes.
- All visual refinements preserve the approved product scope.

---

## 23. Final Design Principle

The Sticky Notes App should feel like a beautiful, personal paper workspace brought to life on the web.

Its distinctiveness must come from deliberate art direction, a warm and controlled palette, expressive typography, carefully composed masonry, thoughtful interactions, and exceptional attention to detail.

The application must not rely on generic dashboard patterns, excessive gradients, decorative animations, or unnecessary features to appear polished.

**Build a visually distinctive experience, make the ordinary interactions feel effortless, and let the user's notes remain the heart of the product.**

Resolve the remaining design decisionsDefine the note interaction model

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

## Phase 2 visual implementation status

The foundation shell, Georgia/system-sans typography, warm surfaces and focus treatment are retained. The composer uses labeled native fields and one primary save action; paper-cream cards render multiline text. Danger/success/control-border tokens support measured contrast rather than color-only messaging. Empty, validation, saved/success, write-error and recovery states were inspected at 390/768/1440px. A simple responsive grid is authorized for this slice only; final masonry, edit/delete controls and voice input are deferred. See GATES.md for verification, not the aspirational checklist above.

## Phase 3 visual implementation status

Always-visible Edit note actions use the existing neutral control styling. The native modal reuses ivory surfaces, Georgia editorial headings, existing labels/fields, vermillion primary actions and teal focus. The same modal presents an explicit discard warning with focused Keep editing; backdrop clicks do not discard. The scrollable field/recovery area keeps header and actions visible at constrained heights. No new motion or visual direction is introduced; only a translucent ink backdrop token is added.

Editor, validation, discard and write-error captures were inspected individually at 390/768/1440px, plus recovery at 390px. Browser checks also cover 390×600. Thirty-five targeted axe scans and 16 token contrast measurements supplement keyboard and visual checks, not full WCAG certification. Final masonry, deletion and voice remain deferred. Exact reviewed captures and observations are under artifacts/phase3/.


## Phase 4 implementation status — approved safe deletion

Phase 4 adds a compact native Paper Atelier confirmation reusing existing modal/header/field/footer styles. Cancel receives initial focus; destructive labeling is explicit, not color-only. Mobile actions stack; the body can scroll while actions stay reachable. Collection/empty headings are programmatic focus destinations, not extra tab stops.


## Phase 5 implementation status — responsive masonry

Phase 5 implements ordered responsive masonry and scoped Paper Atelier visual refinement. One chronological semantic list uses non-dense CSS Grid auto-placement with 4px rows; a small presentation-only ResizeObserver hook supplies natural-height row spans, not coordinates or saved state. This measured CSS approach was prototyped against ordering/gutter criteria before implementation; it does not introduce a positioning library. Content width is capped at 1120px, with a 300px column target: 1/2/3 columns at 390/768/1440px. Missing ResizeObserver retains a readable ordinary-Grid fallback. CSS columns were rejected for column-major/balancing order; native masonry is not assumed.

The workspace/composer are more compact, card titles use editorial serif hierarchy, actions remain visible, and reduced-motion preferences suppress optional transitions. Note CRUD, validation, five-field schema, key, persistence safeguards and modal logic remain unchanged. README/GATES and artifacts/phase5 record actual tests, screenshots, accessibility/contrast findings and limitations. Voice input and all other excluded features remain unimplemented; no deployment is authorized. This status supersedes prior appendices that defer final masonry, without expanding product scope.


## Phase 6 implementation status — optional native dictation

The approved voice increment now enhances the existing composer only. Standard/prefixed native SpeechRecognition is feature-detected with explicit start/stop, textual/live states, provisional-only interim results and per-session final-index deduplication. Final text appends at the current draft end with a newline separator when needed; typing/editing stays available. Save waits for recognition to end and uses the unchanged validated persistence workflow. No auto-save/restart, custom audio backend/recorder, separate transcript persistence or dependency is introduced.

Hook cleanup invalidates callbacks and aborts on errors, unmount, page hiding or modal focus; stalled startup/stop are bounded. Unsupported/insecure environments retain typing. Browser speech processing may be remote and is not guaranteed offline; API presence does not guarantee usable hardware/service/permissions. Textual status and a restrained microphone glyph deliberately avoid a required animation. See README/GATES and artifacts/phase6 for actual mock-based verification, privacy boundaries, screenshots and unverified real-audio behavior. This status supersedes earlier appendices deferring voice, without changing the note schema/key or authorizing deployment.
