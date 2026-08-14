# Luna desktop pet plugin design

## Shape decision

- Goal: add an unmistakably visible, animated, interactive pet to the DeepSeek Harness Web shell.
- Build a plugin: yes; this is browser runtime UI composition and packaged visual behavior, not a prompt or standalone Skill concern.
- Out-of-tree / first-party: out-of-tree.
- Shape: pure Client Web UI plugin with a minimal Host mount entry.
- Mount point: additive `shell.overlay` through `ctx.slots.inject()`.
- Why not another shape: the pet is not model-callable business logic and does not belong in a Conversation Node; replacing `root`, `sidebar`, or `conversation` would shadow first-party UI.
- Split a seam: no. The pet renderer, animation state, and controls are one visual feature.
- Credentials: none.

## Pet asset contract

- Pet: Luna (露娜), the user's existing pixel-style American Shorthair cheese cat Codex pet.
- Style: pixel-style cat mascot, designed to remain legible in a `192x208` cell.
- Source: the existing `~/.codex/pets/luna` package, copied without modifying the original and re-validated with the fixed 8-column × 9-row hatch-pet contract.
- States: idle, running-right, running-left, waving, jumping, failed, waiting, running, and review.
- Runtime: the browser bundle embeds the validated WebP atlas so Git and npm installs do not depend on a separate asset server.

## Interaction contract

- Luna idles as a frameless, non-blocking shell overlay rather than inside a full-card container.
- Dragging Luna with a mouse, pen, or touch pointer moves the overlay; the position is clamped to the viewport and persisted in browser-local storage.
- Hovering plays Luna's original head-pat response; clicking plays her contented animation; named controls select waiting, working, review, patrol, and failed states.
- A compact mode can hide the control labels while keeping the pet visible.
- Reduced-motion users see a stable first frame.
- Unload cancels timers and removes the additive slot through Cordis disposal.

## Verification plan

- [x] Hatch-pet deterministic atlas validation passes with zero errors and warnings.
- [x] Visual identity QA passes; generic state QA notes that Luna's original rows 3/4 depict petting/contentment rather than a literal wave/jump, so the DSH interaction labels use those real semantics.
- [x] Host and Client bundles build.
- [x] Smoke tests cover atlas metadata, additive slot registration, and browser-bundle embedding.
- [x] Static plugin validator passes.
- [x] Installed `web` profile mounts `luna-pet` and remains HTTP 200.
- [x] Real browser interaction visibly changes Luna's animation state.
- [x] Settings → Plugins → Plugin list finds the mounted entry through `showcase` search.
- [x] Real browser drag persists Luna's position after reload; computed styles confirm the shell has no border, background, or box shadow.
