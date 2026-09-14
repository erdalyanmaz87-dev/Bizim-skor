# Simplified Navigation Implementation Plan

**Goal:** Replace the crowded visible horizontal menu with a four-item mobile bottom bar and grouped side drawer without changing existing screen-routing behavior.

**Architecture:** Add a standalone UMD navigation module after `horizontal-menu.js`. The module renders the new controls, proxies existing tab/header actions, observes active/unread state, and injects scoped responsive styles. Existing feature modules remain unchanged.

**Tech Stack:** Vanilla JavaScript, DOM/CSS, Node assert tests, Vercel Git preview.

---

### Task 1: Define navigation behavior

**Files:**
- Create: `simple-navigation.test.js`
- Create: `simple-navigation.js`

1. Add failing tests for item groups, aliases, bottom-bar state, and accessible markup.
2. Run the focused test and confirm it fails because the module is absent.
3. Implement pure navigation helpers and rendering/mount behavior.
4. Run the focused test and confirm it passes.

### Task 2: Load the navigation layer

**Files:**
- Modify: `ui-integration-loader.js`
- Create: `simple-navigation-loader.test.js`

1. Add a failing order test requiring the module after the horizontal menu.
2. Add the script to the integration loader.
3. Run the focused loader test.

### Task 3: Verify and publish preview

1. Run syntax checks and focused tests.
2. Run the full test suite and classify any pre-existing failures.
3. Push only the preview branch and wait for the Vercel preview deployment.
4. Verify the preview in a browser at mobile and desktop widths.
5. Share the preview URL without merging to `main`.
